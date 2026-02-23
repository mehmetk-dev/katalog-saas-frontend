import type { Product } from '@/lib/actions/products'

import { type ColumnMapping } from './types'

interface BuildProductsParams {
    csvData: string[][]
    csvHeaders: string[]
    columnMappings: ColumnMapping[]
    isFreeUser: boolean
    onProgress?: (progress: number) => void
}

export const buildImportProducts = ({ csvData, csvHeaders, columnMappings, isFreeUser, onProgress }: BuildProductsParams) => {
    const products: Array<Record<string, unknown>> = []
    const totalRows = csvData.length

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
                    const attrName = mapping.customName?.trim() || csvHeaders[index].charAt(0).toUpperCase() + csvHeaders[index].slice(1).replace(/\*/g, '')
                    customAttrs.push({ name: attrName, value })
                }
                return
            }

            switch (mapping.systemField) {
                case 'name':
                    product.name = value
                    break
                case 'sku':
                    product.sku = value || null
                    break
                case 'description':
                    product.description = value || null
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
                    if (cleanValue.includes('.') && cleanValue.match(/\.\d{3}$/)) {
                        product.stock = parseInt(cleanValue.replace(/\./g, '')) || 0
                    } else if (cleanValue.includes(',') && cleanValue.match(/,\d{3}$/)) {
                        product.stock = parseInt(cleanValue.replace(/,/g, '')) || 0
                    } else {
                        product.stock = parseInt(cleanValue.replace(/[^\d]/g, '')) || 0
                    }
                    break
                }
                case 'category':
                    product.category = isFreeUser ? null : value || null
                    break
                case 'image_url':
                    if (value) {
                        const urls = parseImageUrls(value)
                        const cover = urls[0] || value
                        product.image_url = cover || null

                        const existingImages = Array.isArray(product.images) ? product.images : []
                        const merged = [cover, ...existingImages, ...urls].filter(Boolean)
                        product.images = Array.from(new Set(merged)).slice(0, 5)
                    }
                    break
                case 'images': {
                    const urls = parseImageUrls(value)
                    if (!urls.length) break

                    const existingImages = Array.isArray(product.images) ? product.images : []
                    const merged = [...existingImages, ...urls].filter(Boolean)
                    product.images = Array.from(new Set(merged)).slice(0, 5)

                    if (!product.image_url && product.images.length > 0) {
                        product.image_url = product.images[0]
                    }
                    break
                }
                case 'product_url':
                    product.product_url = value || null
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

    return products
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
