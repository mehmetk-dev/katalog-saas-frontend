import type { Product } from '@/lib/actions/products'

import { type ColumnMapping } from './types'

// SECURITY: Only allow image URLs from trusted sources (sync with backend/schemas.ts)
const ALLOWED_IMAGE_HOSTS = [
    'res.cloudinary.com',
    'api.cloudinary.com',
    'images.unsplash.com',
    'plus.unsplash.com',
]

function isTrustedImageUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        const hostname = parsed.hostname
        const isKnownCdn = ALLOWED_IMAGE_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`))
        const isSupabaseStorage = hostname.endsWith('.supabase.co') && parsed.pathname.startsWith('/storage/v1/object/public/')
        return isKnownCdn || isSupabaseStorage
    } catch {
        return false
    }
}

/** URL'leri doğrula — javascript: ve data: XSS saldırılarını önle */
function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
        return false
    }
}

/** Custom attribute isimlerini sanitize et — script injection önleme */
function sanitizeAttributeName(name: string): string {
    return name.replace(/[<>'"&]/g, '').trim().slice(0, 100)
}

/** Ürün metin alanlarını sanitize et — XSS önleme */
function sanitizeText(value: string): string {
    return value.replace(/[<>'"&]/g, '').trim()
}

interface BuildProductsParams {
    csvData: string[][]
    csvHeaders: string[]
    columnMappings: ColumnMapping[]
    isFreeUser: boolean
    onProgress?: (progress: number) => void
}

export interface BuildProductsResult {
    products: Array<Record<string, unknown>>
    warnings: string[]
}

export const buildImportProducts = ({ csvData, csvHeaders, columnMappings, isFreeUser, onProgress }: BuildProductsParams): BuildProductsResult => {
    const products: Array<Record<string, unknown>> = []
    const warnings: string[] = []
    const totalRows = csvData.length
    const seenSkus = new Set<string>()
    let duplicateSkuCount = 0
    let untrustedImageCount = 0
    let freeCategoryDropped = false

    const parseImageUrls = (raw: string) =>
        raw
            .split(/[|\n]/)
            .map((u) => u.trim())
            .filter(Boolean)

    for (let rowIdx = 0; rowIdx < csvData.length; rowIdx++) {
        const row = csvData[rowIdx]
        onProgress?.(Math.round((rowIdx / Math.max(totalRows, 1)) * 50))

        const product: Partial<Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
            name: string
            price: number
            stock: number
            custom_attributes: Array<{ name: string; value: string; unit?: string }>
        } = {
            name: '',
            sku: null,
            description: null,
            price: 0,
            stock: 0,
            category: null,
            image_url: null,
            images: [],
            product_url: null,
            custom_attributes: [],
        }

        const customAttrs: { name: string; value: string }[] = []

        columnMappings.forEach((mapping, index) => {
            const value = row[index]?.trim() || ''
            if (mapping.systemField === 'skip' || !value) return

            if (mapping.systemField === null) {
                if (csvHeaders[index]) {
                    const rawName = mapping.customName?.trim() || csvHeaders[index].charAt(0).toUpperCase() + csvHeaders[index].slice(1).replace(/\*/g, '')
                    const attrName = sanitizeAttributeName(rawName)
                    if (attrName) customAttrs.push({ name: attrName, value })
                }
                return
            }

            switch (mapping.systemField) {
                case 'name':
                    product.name = sanitizeText(value)
                    break
                case 'sku': {
                    const sanitizedSku = sanitizeText(value)
                    if (sanitizedSku) {
                        if (seenSkus.has(sanitizedSku)) {
                            duplicateSkuCount++
                            product.sku = null // Duplicate SKU'yu boş bırak
                        } else {
                            seenSkus.add(sanitizedSku)
                            product.sku = sanitizedSku
                        }
                    } else {
                        product.sku = null
                    }
                    break
                }
                case 'description':
                    product.description = sanitizeText(value) || null
                    break
                case 'price': {
                    const cleanValue = value.replace(/[^\d.,]/g, '')
                    if (!cleanValue) {
                        product.price = 0
                        break
                    }
                    const dotIndex = cleanValue.lastIndexOf('.')
                    const commaIndex = cleanValue.lastIndexOf(',')

                    if (dotIndex !== -1 && commaIndex !== -1) {
                        product.price = commaIndex > dotIndex
                            ? parseFloat(cleanValue.replace(/\./g, '').replace(',', '.')) || 0
                            : parseFloat(cleanValue.replace(/,/g, '')) || 0
                    } else if (commaIndex !== -1) {
                        product.price = parseFloat(cleanValue.replace(',', '.')) || 0
                    } else if (dotIndex !== -1) {
                        product.price = cleanValue.match(/\.\d{3}$/)
                            ? parseFloat(cleanValue.replace(/\./g, '')) || 0
                            : parseFloat(cleanValue) || 0
                    } else {
                        product.price = parseFloat(cleanValue) || 0
                    }
                    break
                }
                case 'stock': {
                    const cleanValue = value.replace(/[^\d.,]/g, '')
                    if (!cleanValue) {
                        product.stock = 0
                        break
                    }
                    if (cleanValue.includes('.') && cleanValue.match(/\.\d{3}$/)) {
                        // Binlik ayraç: 1.000
                        product.stock = parseInt(cleanValue.replace(/\./g, ''), 10) || 0
                    } else if (cleanValue.includes(',') && cleanValue.match(/,\d{3}$/)) {
                        // Binlik ayraç: 1,000
                        product.stock = parseInt(cleanValue.replace(/,/g, ''), 10) || 0
                    } else {
                        // Ondalık veya düz sayı: 10.5 → 10, 15 → 15
                        const normalized = cleanValue.replace(',', '.')
                        const floatVal = parseFloat(normalized)
                        product.stock = !isNaN(floatVal) ? Math.max(0, Math.floor(floatVal)) : 0
                    }
                    break
                }
                case 'category': {
                    if (isFreeUser && value) {
                        freeCategoryDropped = true
                        product.category = null
                    } else {
                        product.category = value || null
                    }
                    break
                }
                case 'image_url':
                    if (value) {
                        const urls = parseImageUrls(value).filter(isValidUrl)
                        const trustedUrls = urls.filter(isTrustedImageUrl)
                        if (urls.length > trustedUrls.length) untrustedImageCount++
                        const cover = trustedUrls[0] || null
                        product.image_url = cover

                        const existingImages = Array.isArray(product.images) ? product.images : []
                        const merged = [cover, ...existingImages, ...trustedUrls].filter(Boolean) as string[]
                        product.images = Array.from(new Set(merged)).slice(0, 5)
                    }
                    break
                case 'images': {
                    const urls = parseImageUrls(value).filter(isValidUrl)
                    const trustedUrls = urls.filter(isTrustedImageUrl)
                    if (urls.length > trustedUrls.length) untrustedImageCount++
                    if (!trustedUrls.length) break

                    const existingImages = Array.isArray(product.images) ? product.images : []
                    const merged = [...existingImages, ...trustedUrls].filter(Boolean)
                    product.images = Array.from(new Set(merged)).slice(0, 5)

                    if (!product.image_url && product.images.length > 0) {
                        product.image_url = product.images[0]
                    }
                    break
                }
                case 'product_url':
                    product.product_url = value && isValidUrl(value) ? value : null
                    break
            }
        })

        if (!product.image_url && Array.isArray(product.images) && product.images.length > 0) {
            product.image_url = product.images[0]
        }

        if (product.image_url && Array.isArray(product.images)) {
            const normalizedImages = [product.image_url, ...product.images].filter(Boolean)
            product.images = Array.from(new Set(normalizedImages)).slice(0, 5)
        }

        product.custom_attributes = customAttrs
        if (product.name) products.push(product)
    }

    if (duplicateSkuCount > 0) {
        warnings.push(`${duplicateSkuCount} üründe tekrarlayan SKU tespit edildi. İlk eşleşme korundu, kalanlar boş bırakıldı.`)
    }
    if (untrustedImageCount > 0) {
        warnings.push(`${untrustedImageCount} üründe güvenilir olmayan resim URL'i tespit edildi. Yalnızca Cloudinary, Unsplash veya Supabase Storage URL'leri kabul edilir.`)
    }
    if (freeCategoryDropped) {
        warnings.push('Kategoriler Free planda kaydedilmez. Kategori sütunundaki değerler atlandı.')
    }

    return { products, warnings }
}

export const downloadTemplateCsv = (t: (key: string) => string) => {
    const headers = [
        `${t('importExport.systemFields.name')}*`,
        t('importExport.systemFields.sku'),
        t('importExport.systemFields.description'),
        `${t('importExport.systemFields.price')}*`,
        t('importExport.systemFields.stock'),
        t('importExport.systemFields.category'),
        t('importExport.systemFields.coverImage'),
        t('importExport.systemFields.additionalImages'),
        t('products.attributeNames.weight'),
        t('products.attributeNames.color'),
        t('products.attributeNames.material'),
    ]

    const sampleData = [
        ['Ergonomik Ofis Koltuğu', 'MOB-001', 'Bel destekli, ayarlanabilir kolçaklar', '2499.99', '25', 'Mobilya', 'https://example.com/cover1.jpg', 'https://example.com/side1.jpg|https://example.com/side2.jpg', '12 kg', 'Siyah', 'Kumaş/Metal'],
        ['Ahşap Çalışma Masası', 'MOB-002', 'Doğal meşe, 150x75 cm', '1899.00', '15', 'Mobilya', 'https://example.com/cover2.jpg', 'https://example.com/side3.jpg|https://example.com/side4.jpg', '35 kg', 'Doğal', 'Meşe Ahşap'],
    ]

    const csvContent = [
        headers.join(';'),
        ...sampleData.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(';')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'urun-import-sablonu.csv'
    link.click()
    URL.revokeObjectURL(url)
}
