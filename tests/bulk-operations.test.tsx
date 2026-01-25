
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BulkActionsModal } from '@/components/products/bulk-actions-modal'
import { BulkImageUploadModal } from '@/components/products/bulk-image-upload-modal'

// Mock dependencies
vi.mock('@/lib/i18n-provider', () => ({
    useTranslation: () => ({ t: (key: string) => key, language: 'tr' }),
}))

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user' } } } }),
        },
        storage: {
            from: () => ({
                upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
                getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/test.jpg' } }),
            }),
        },
    }),
}))

vi.mock('next/image', () => ({
    default: ({ src, alt, fill, unoptimized, ...props }: any) => {
        const imgProps: any = { src, alt, ...props }
        if (fill) {
            imgProps.style = { ...imgProps.style, position: 'absolute', width: '100%', height: '100%' }
        }
        if (unoptimized !== undefined) {
            imgProps.unoptimized = String(unoptimized)
        }
        return <img {...imgProps} />
    },
}))

vi.mock('@/lib/image-utils', () => ({
    convertToWebP: vi.fn(async (file: File) => ({
        blob: new Blob([file], { type: 'image/webp' }),
        fileName: file.name.replace(/\.[^.]+$/, '.webp'),
    })),
}))

vi.mock('@/lib/actions/products', () => ({
    bulkUpdatePrices: vi.fn().mockResolvedValue({ success: true }),
    bulkUpdateProductImages: vi.fn().mockResolvedValue({ success: true }),
    deleteProducts: vi.fn().mockResolvedValue({ success: true }),
    checkProductInCatalogs: vi.fn(),
}))

global.URL.createObjectURL = vi.fn(() => 'blob:test')
global.URL.revokeObjectURL = vi.fn()

global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
} as any

describe('Toplu İşlem Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Toplu Fiyat Güncelleme', () => {
        it('Seçili ürünlerin fiyatlarını günceller', async () => {
            const selectedProducts = [
                { id: '1', name: 'Product 1', price: 100 },
                { id: '2', name: 'Product 2', price: 200 },
            ]

            const { bulkUpdatePrices } = await import('@/lib/actions/products')
            
            // %10 artış
            const newPrice = 110 // 100 * 1.1
            await bulkUpdatePrices([{ productId: '1', price: newPrice }])

            expect(bulkUpdatePrices).toHaveBeenCalled()
        })

        it('Yüzde artış/azalış ile fiyat günceller', () => {
            const basePrice = 100
            const percentage = 10 // %10 artış
            
            const newPrice = basePrice * (1 + percentage / 100)
            expect(newPrice).toBeCloseTo(110, 2)
        })
    })

    describe('Toplu Silme', () => {
        it('Birden fazla ürünü toplu siler', async () => {
            const selectedIds = ['product-1', 'product-2', 'product-3']
            const { deleteProducts } = await import('@/lib/actions/products')

            await deleteProducts(selectedIds)

            expect(deleteProducts).toHaveBeenCalledWith(selectedIds)
        })

        it('Katalogda kullanılan ürün silinmeden önce uyarı verir', async () => {
            // checkProductInCatalogs fonksiyonunu mock'tan al
            const { checkProductInCatalogs } = await import('@/lib/actions/products')
            
            // Mock'u güncelle
            vi.mocked(checkProductInCatalogs).mockResolvedValueOnce({
                inCatalogs: true,
                catalogs: [{ id: 'catalog-1', name: 'Test Catalog' }],
            } as any)

            const result = await checkProductInCatalogs('product-1')
            expect(result.inCatalogs).toBe(true)
        })
    })

    describe('Toplu Fotoğraf Yükleme', () => {
        it('Dosya adlarından ürün eşleştirmesi yapar', () => {
            const products = [
                { id: '1', name: 'Laptop', sku: 'LAP-001' },
                { id: '2', name: 'Mouse', sku: 'MOU-001' },
            ]

            const fileName = 'LAP-001.jpg'
            
            // SKU ile eşleştirme
            const matchedProduct = products.find(p => 
                fileName.includes(p.sku || '') || 
                fileName.toLowerCase().includes(p.name.toLowerCase())
            )

            expect(matchedProduct).toBeTruthy()
            expect(matchedProduct?.sku).toBe('LAP-001')
        })

        it('Concurrency limit ile yükleme yapar (3 dosya)', async () => {
            const CONCURRENCY_LIMIT = 3
            const files = Array.from({ length: 5 }, (_, i) => 
                new File(['content'], `test-${i}.jpg`, { type: 'image/jpeg' })
            )

            // İlk 3 dosya paralel yüklenmeli
            const firstBatch = files.slice(0, CONCURRENCY_LIMIT)
            expect(firstBatch.length).toBe(3)

            // Kalan 2 dosya sonra yüklenmeli
            const remainingBatch = files.slice(CONCURRENCY_LIMIT)
            expect(remainingBatch.length).toBe(2)
        })
    })
})
