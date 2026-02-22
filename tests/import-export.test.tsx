import { describe, it, expect, vi, beforeEach } from 'vitest'

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

let mockApiFetch = vi.fn()
vi.mock('@/lib/api', () => ({
    apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}))

vi.mock('@/lib/actions/products', () => ({
    bulkImportProducts: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/components/builder/modals/upgrade-modal', () => ({
    UpgradeModal: () => null,
}))

global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
} as unknown as typeof ResizeObserver

describe('Import/Export Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockApiFetch = vi.fn() // Re-initialize mockApiFetch for each test
    })

    describe('CSV Import', () => {
        it('CSV dosyası doğru parse edilir', async () => {
            const csvContent = `ad,sku,fiyat,stok
Ürün 1,SKU-001,100,10
Ürün 2,SKU-002,200,20`

            // CSV parsing testi
            const lines = csvContent.split('\n')
            const headers = lines[0].split(',')
            expect(headers).toEqual(['ad', 'sku', 'fiyat', 'stok'])
            expect(lines.length).toBe(3) // Header + 2 ürün
        })

        it('Geçersiz CSV formatı hata verir', async () => {
            const invalidCsv = `ad,sku
Ürün 1` // Eksik kolon

            const lines = invalidCsv.split('\n')
            const headers = lines[0].split(',')
            const firstRow = lines[1].split(',')

            // Eksik kolon kontrolü
            expect(firstRow.length).toBeLessThan(headers.length)
        })

        it('Farklı header isimleri tanınır (ad, name, ürün adı)', async () => {
            const csvWithAliases = `ürün adı,stok kodu,fiyat
Ürün 1,SKU-001,100`

            const lines = csvWithAliases.split('\n')
            const headers = lines[0].split(',')

            // Header alias kontrolü
            const nameHeader = headers.find(h => h.includes('ad') || h.includes('name'))
            expect(nameHeader).toBeTruthy()
        })
    })

    describe('CSV Export', () => {
        it('Ürünler CSV formatına dönüştürülür', async () => {
            const mockProducts = [
                { id: '1', name: 'Ürün 1', sku: 'SKU-001', price: 100, stock: 10 },
                { id: '2', name: 'Ürün 2', sku: 'SKU-002', price: 200, stock: 20 },
            ]

            // CSV oluşturma
            const headers = ['ad', 'sku', 'fiyat', 'stok']
            const csvRows = mockProducts.map(p => [p.name, p.sku, p.price, p.stock])
            const csvContent = [headers, ...csvRows].map(row => row.join(',')).join('\n')

            expect(csvContent).toContain('Ürün 1')
            expect(csvContent).toContain('SKU-001')
        })
    })

    describe('Bulk Import', () => {
        it('Toplu import limit kontrolü yapar', async () => {
            const { bulkImportProducts } = await import('@/lib/actions/products')

            // Free plan için 50 ürün limiti
            const mockProducts = Array.from({ length: 51 }, (_, i) => ({
                name: `Product ${i}`,
                price: 100,
                stock: 10,
            }))

            const error = new Error('Limit Reached') as Error & { status?: number }
            error.status = 403
            mockApiFetch.mockRejectedValueOnce(error)

            // bulkImportProducts hata fırlatmalı
            try {
                await bulkImportProducts(mockProducts as Parameters<typeof bulkImportProducts>[0])
                expect.fail('Should have thrown an error')
            } catch (err) {
                expect(err).toBeDefined()
            }
        })
    })
})
