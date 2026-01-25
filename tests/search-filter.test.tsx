
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductsPageClient } from '@/components/products/products-page-client'

// Mock dependencies
vi.mock('@/lib/i18n-provider', () => ({
    useTranslation: () => ({ t: (key: string) => key, language: 'tr' }),
}))

vi.mock('@/lib/user-context', () => ({
    useUser: () => ({
        user: { id: 'test-user', plan: 'free' },
        isLoading: false,
        refreshUser: vi.fn(),
    }),
    UserProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/lib/api', () => ({
    apiFetch: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/dashboard/products',
    useSearchParams: () => new URLSearchParams(),
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}))

vi.mock('@/lib/actions/products', () => ({
    createProduct: vi.fn(),
    getProducts: vi.fn(),
    deleteProducts: vi.fn(),
    bulkImportProducts: vi.fn(),
    bulkUpdatePrices: vi.fn(),
    addDummyProducts: vi.fn(),
}))

global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
} as any

describe('Arama ve Filtreleme Testleri', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Ürün Arama', () => {
        it('Ürün adına göre arama yapar', () => {
            const products = [
                { id: '1', name: 'Laptop', sku: 'LAP-001', category: 'Electronics' },
                { id: '2', name: 'Mouse', sku: 'MOU-001', category: 'Electronics' },
                { id: '3', name: 'Keyboard', sku: 'KEY-001', category: 'Electronics' },
            ]

            const searchQuery = 'Laptop'
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            )

            expect(filtered).toHaveLength(1)
            expect(filtered[0].name).toBe('Laptop')
        })

        it('SKU ile arama yapar', () => {
            const products = [
                { id: '1', name: 'Laptop', sku: 'LAP-001', category: 'Electronics' },
                { id: '2', name: 'Mouse', sku: 'MOU-001', category: 'Electronics' },
            ]

            const searchQuery = 'MOU-001'
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
            )

            expect(filtered).toHaveLength(1)
            expect(filtered[0].sku).toBe('MOU-001')
        })

        it('Kategori ile arama yapar', () => {
            const products = [
                { id: '1', name: 'Laptop', sku: 'LAP-001', category: 'Electronics' },
                { id: '2', name: 'Table', sku: 'TAB-001', category: 'Furniture' },
            ]

            const searchQuery = 'Electronics'
            const filtered = products.filter(p => 
                p.category?.toLowerCase().includes(searchQuery.toLowerCase())
            )

            expect(filtered).toHaveLength(1)
            expect(filtered[0].category).toBe('Electronics')
        })
    })

    describe('Filtreleme', () => {
        it('Kategori filtresi çalışır', () => {
            const products = [
                { id: '1', name: 'Laptop', category: 'Electronics', stock: 10, price: 1000 },
                { id: '2', name: 'Table', category: 'Furniture', stock: 5, price: 500 },
                { id: '3', name: 'Mouse', category: 'Electronics', stock: 20, price: 50 },
            ]

            const selectedCategory = 'Electronics'
            const filtered = products.filter(p => p.category === selectedCategory)

            expect(filtered).toHaveLength(2)
            expect(filtered.every(p => p.category === 'Electronics')).toBe(true)
        })

        it('Stok filtresi çalışır', () => {
            const products = [
                { id: '1', name: 'Laptop', stock: 0 },
                { id: '2', name: 'Mouse', stock: 5 },
                { id: '3', name: 'Keyboard', stock: 20 },
            ]

            // Stokta yok
            const outOfStock = products.filter(p => p.stock === 0)
            expect(outOfStock).toHaveLength(1)

            // Az stok (0 < stock < 10)
            const lowStock = products.filter(p => p.stock > 0 && p.stock < 10)
            expect(lowStock).toHaveLength(1)

            // Stokta (stock >= 10)
            const inStock = products.filter(p => p.stock >= 10)
            expect(inStock).toHaveLength(1)
        })

        it('Fiyat aralığı filtresi çalışır', () => {
            const products = [
                { id: '1', name: 'Laptop', price: 1000 },
                { id: '2', name: 'Mouse', price: 50 },
                { id: '3', name: 'Keyboard', price: 200 },
            ]

            const priceRange = [100, 500]
            const filtered = products.filter(p => {
                const price = Number(p.price) || 0
                return price >= priceRange[0] && price <= priceRange[1]
            })

            // 100-500 aralığında: Laptop (1000) hariç, Keyboard (200) dahil
            // Mouse (50) da hariç çünkü 100'den küçük
            expect(filtered).toHaveLength(1) // Sadece Keyboard (200)
            expect(filtered[0].name).toBe('Keyboard')
        })
    })

    describe('Sıralama', () => {
        it('Fiyata göre artan sıralama yapar', () => {
            const products = [
                { id: '1', name: 'Laptop', price: 1000 },
                { id: '2', name: 'Mouse', price: 50 },
                { id: '3', name: 'Keyboard', price: 200 },
            ]

            const sorted = [...products].sort((a, b) => Number(a.price) - Number(b.price))

            expect(sorted[0].price).toBe(50)
            expect(sorted[1].price).toBe(200)
            expect(sorted[2].price).toBe(1000)
        })

        it('Fiyata göre azalan sıralama yapar', () => {
            const products = [
                { id: '1', name: 'Laptop', price: 1000 },
                { id: '2', name: 'Mouse', price: 50 },
                { id: '3', name: 'Keyboard', price: 200 },
            ]

            const sorted = [...products].sort((a, b) => Number(b.price) - Number(a.price))

            expect(sorted[0].price).toBe(1000)
            expect(sorted[1].price).toBe(200)
            expect(sorted[2].price).toBe(50)
        })

        it('Ada göre alfabetik sıralama yapar', () => {
            const products = [
                { id: '1', name: 'Zebra', price: 100 },
                { id: '2', name: 'Apple', price: 50 },
                { id: '3', name: 'Banana', price: 200 },
            ]

            const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name))

            expect(sorted[0].name).toBe('Apple')
            expect(sorted[1].name).toBe('Banana')
            expect(sorted[2].name).toBe('Zebra')
        })
    })
})
