import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { createProductSchema, productsQuerySchema } from '@/backend/src/controllers/products/schemas'
import type { Product } from '@/lib/actions/products'
import { useProductsImportExportActions } from '@/components/products/hooks/use-products-import-export-actions'
import { useProductsSelectionActions } from '@/components/products/hooks/use-products-selection-actions'
import { useProductsReorder } from '@/components/products/hooks/use-products-reorder'
import { SORT_CHOICES } from '@/components/products/toolbar/toolbar'
import {
    applyLocalMove,
    mapSortFieldToProductSort,
    nextColumnSort,
    normalizeSortOrder,
    resolveDropPosition,
} from '@/components/products/products-page-utils'
import { computeMoveUpdates, MoveError } from '@/backend/src/controllers/products/ordering'
import { bulkImportProducts, getAllProductIds, getProducts, moveProduct } from '@/lib/actions/products'

vi.mock('@/lib/actions/products', async () => {
    const actual = await vi.importActual<typeof import('@/lib/actions/products')>('@/lib/actions/products')
    return {
        ...actual,
        bulkImportProducts: vi.fn(),
        getAllProductIds: vi.fn(),
        getProducts: vi.fn(),
        moveProduct: vi.fn(),
    }
})

vi.mock('@/backend/src/services/supabase', () => ({ supabase: {} }))

vi.mock('@/lib/contexts/i18n-provider', () => ({
    useTranslation: () => ({ t: (key: string) => key, language: 'tr' }),
}))

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
        info: vi.fn(),
    },
}))

function makeProduct(id: string, price = 10): Product {
    return {
        id,
        user_id: 'user-1',
        sku: null,
        name: `Product ${id}`,
        description: null,
        price,
        stock: 5,
        category: null,
        image_url: null,
        images: [],
        product_url: null,
        custom_attributes: [],
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        order: 0,
    }
}

describe('products page regressions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('accepts Supabase public storage URLs as trusted product images', () => {
        const result = createProductSchema.safeParse({
            name: 'Supabase Image Product',
            price: 25,
            stock: 3,
            image_url: 'https://abcxyzcompany.supabase.co/storage/v1/object/public/product-images/products/item.webp',
            images: [
                'https://abcxyzcompany.supabase.co/storage/v1/object/public/product-images/products/item.webp',
            ],
            product_url: null,
            custom_attributes: [],
        })

        expect(result.success).toBe(true)
    })

    it('moves a product before/after a target across the whole list (server)', () => {
        const rows = ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({ id, display_order: i }))
        // e → b'nin önüne: a e b c d — yalnızca değişen satırlar yazılır
        expect(computeMoveUpdates(rows, { id: 'e', position: 'before', targetId: 'b' })).toEqual([
            { id: 'e', order: 1 },
            { id: 'b', order: 2 },
            { id: 'c', order: 3 },
            { id: 'd', order: 4 },
        ])
        expect(computeMoveUpdates(rows, { id: 'a', position: 'after', targetId: 'c' })).toEqual([
            { id: 'b', order: 0 },
            { id: 'c', order: 1 },
            { id: 'a', order: 2 },
        ])
        expect(computeMoveUpdates(rows, { id: 'c', position: 'first' })).toEqual([
            { id: 'c', order: 0 },
            { id: 'a', order: 1 },
            { id: 'b', order: 2 },
        ])
        expect(computeMoveUpdates(rows, { id: 'b', position: 'last' })).toEqual([
            { id: 'c', order: 1 },
            { id: 'd', order: 2 },
            { id: 'e', order: 3 },
            { id: 'b', order: 4 },
        ])
        // Yer değişmiyorsa yazma yok
        expect(computeMoveUpdates(rows, { id: 'b', position: 'after', targetId: 'a' })).toEqual([])
    })

    it('normalizes duplicate legacy display_order values into a dense order on first move', () => {
        // Eski kayıtların hepsi 0: kanonik sıra (created_at/id) korunur ve 0..n-1 olur
        const rows = ['a', 'b', 'c'].map((id) => ({ id, display_order: 0 }))
        expect(computeMoveUpdates(rows, { id: 'c', position: 'before', targetId: 'b' })).toEqual([
            { id: 'c', order: 1 },
            { id: 'b', order: 2 },
        ])
    })

    it('rejects moves with a missing source or target', () => {
        const rows = [{ id: 'a', display_order: 0 }, { id: 'b', display_order: 1 }]
        expect(() => computeMoveUpdates(rows, { id: 'x', position: 'first' })).toThrow(MoveError)
        expect(() => computeMoveUpdates(rows, { id: 'a', position: 'before', targetId: 'x' })).toThrow(MoveError)
        expect(() => computeMoveUpdates(rows, { id: 'a', position: 'before', targetId: 'a' })).toThrow(MoveError)
    })

    it('applies moves optimistically to the visible page', () => {
        const page = ['a', 'b', 'c', 'd'].map((id) => makeProduct(id))
        const ids = (list: Product[]) => list.map((p) => p.id)
        const middle = { isFirst: false, isLast: false }

        expect(ids(applyLocalMove(page, { id: 'd', position: 'before', targetId: 'b' }, middle))).toEqual(['a', 'd', 'b', 'c'])
        expect(ids(applyLocalMove(page, { id: 'a', position: 'after', targetId: 'c' }, middle))).toEqual(['b', 'c', 'a', 'd'])
        // Başka sayfaya giden ürün bu sayfadan çıkar
        expect(ids(applyLocalMove(page, { id: 'c', position: 'first' }, middle))).toEqual(['a', 'b', 'd'])
        expect(ids(applyLocalMove(page, { id: 'c', position: 'first' }, { isFirst: true, isLast: false }))).toEqual(['c', 'a', 'b', 'd'])
        expect(ids(applyLocalMove(page, { id: 'b', position: 'last' }, { isFirst: false, isLast: true }))).toEqual(['a', 'c', 'd', 'b'])
    })

    it('resolves drop position from drag direction or pointer', () => {
        const page = ['a', 'b', 'c'].map((id) => makeProduct(id))
        expect(resolveDropPosition(page, 'a', 'c')).toBe('after')
        expect(resolveDropPosition(page, 'c', 'a')).toBe('before')
        expect(resolveDropPosition(page, 'c', 'a', true)).toBe('after')
    })

    it('keeps manual order ascending and cycles column sort back to manual', () => {
        expect(normalizeSortOrder('order', 'desc')).toBe('asc')
        expect(normalizeSortOrder('price', 'desc')).toBe('desc')

        expect(nextColumnSort({ field: 'order', order: 'asc' }, 'name')).toEqual({ field: 'name', order: 'asc' })
        expect(nextColumnSort({ field: 'name', order: 'asc' }, 'name')).toEqual({ field: 'name', order: 'desc' })
        expect(nextColumnSort({ field: 'name', order: 'desc' }, 'name')).toEqual({ field: 'order', order: 'asc' })
        expect(nextColumnSort({ field: 'order', order: 'asc' }, 'price')).toEqual({ field: 'price', order: 'desc' })
        expect(nextColumnSort({ field: 'price', order: 'desc' }, 'price')).toEqual({ field: 'price', order: 'asc' })
    })

    it('offers each sort choice exactly once', () => {
        const keys = SORT_CHOICES.map((c) => `${c.field}:${c.order}`)
        expect(new Set(keys).size).toBe(keys.length)
        expect(SORT_CHOICES[0]).toMatchObject({ field: 'order', order: 'asc' })
    })

    it('sends consecutive moves one at a time and refreshes once when they finish', async () => {
        const calls: string[] = []
        let release!: () => void
        vi.mocked(moveProduct).mockImplementation(async (move) => {
            calls.push(`start:${move.id}`)
            if (move.id === 'a') await new Promise<void>((resolve) => { release = resolve })
            calls.push(`end:${move.id}`)
            return { success: true }
        })
        const routerRefresh = vi.fn()
        const setProducts = vi.fn()

        const { result } = renderHook(() => useProductsReorder({
            t: (key) => key,
            currentPage: 2,
            totalPages: 3,
            setProducts,
            routerRefresh,
        }))

        act(() => {
            result.current.handleMove({ id: 'a', position: 'first' })
            result.current.handleMove({ id: 'b', position: 'after', targetId: 'c' })
        })
        expect(result.current.reorderStatus).toBe('saving')
        expect(setProducts).toHaveBeenCalledTimes(2)

        await act(async () => {
            await Promise.resolve()
        })
        expect(calls).toEqual(['start:a'])

        await act(async () => {
            release()
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(calls).toEqual(['start:a', 'end:a', 'start:b', 'end:b'])
        // "first" başka sayfaya taşıdığı için kuyruk bitince tek bir yenileme
        expect(routerRefresh).toHaveBeenCalledTimes(1)
        expect(result.current.reorderStatus).toBe('saved')
    })

    it('maps UI sort fields to product query sort fields', () => {
        expect(mapSortFieldToProductSort('order')).toBe('display_order')
        expect(mapSortFieldToProductSort('created_at')).toBe('created_at')
        expect(mapSortFieldToProductSort('price')).toBe('price')
    })

    it('accepts server-side stock and price filter query parameters', () => {
        const result = productsQuerySchema.safeParse({
            stockFilter: 'low_stock',
            minPrice: '100',
            maxPrice: '500',
        })

        expect(result.success).toBe(true)
        expect(result.success && result.data.stockFilter).toBe('low_stock')
        expect(result.success && result.data.minPrice).toBe(100)
        expect(result.success && result.data.maxPrice).toBe(500)
    })

    it('uses functional product state updates after each import batch', async () => {
        vi.mocked(bulkImportProducts)
            .mockResolvedValueOnce([makeProduct('batch-1')])
            .mockResolvedValueOnce([makeProduct('batch-2')])

        const setProducts = vi.fn()
        const { result } = renderHook(() => useProductsImportExportActions({
            t: (key) => key,
            currentPage: 1,
            itemsPerPage: 12,
            search: '',
            selectedCategory: 'all',
            stockFilter: 'all' as const,
            priceRange: [0, 0] as [number, number],
            sortField: 'order' as const,
            sortOrder: 'asc' as const,
            setProducts,
            setStats: vi.fn(),
            setMetadata: vi.fn(),
            setShowBulkImageModal: vi.fn(),
            adjustMetadataTotal: vi.fn(),
            refreshUser: vi.fn(async () => undefined),
            routerRefresh: vi.fn(),
            willExceedProductLimit: () => false,
            getLimitErrorMessage: () => 'limit reached',
        }))

        await result.current.handleImportProducts([makeProduct('incoming-1')])
        await result.current.handleImportProducts([makeProduct('incoming-2')])

        expect(setProducts).toHaveBeenCalledTimes(2)
        expect(setProducts).toHaveBeenNthCalledWith(1, expect.any(Function))
        expect(setProducts).toHaveBeenNthCalledWith(2, expect.any(Function))

        const firstUpdater = setProducts.mock.calls[0][0] as (prev: Product[]) => Product[]
        expect(firstUpdater([makeProduct('existing')]).map((product) => product.id)).toEqual(['batch-1', 'existing'])
    })

    it('preserves active server-side filters after bulk image upload refresh', async () => {
        vi.mocked(getProducts).mockResolvedValue({
            products: [makeProduct('filtered')],
            metadata: { total: 1, page: 2, limit: 24, totalPages: 1 },
        })
        const params = {
            t: (key: string) => key,
            currentPage: 2,
            itemsPerPage: 24,
            search: 'chair',
            selectedCategory: 'Furniture',
            stockFilter: 'low_stock' as const,
            priceRange: [100, 250] as [number, number],
            sortField: 'price' as const,
            sortOrder: 'desc' as const,
            setProducts: vi.fn(),
            setStats: vi.fn(),
            setMetadata: vi.fn(),
            setShowBulkImageModal: vi.fn(),
            adjustMetadataTotal: vi.fn(),
            refreshUser: vi.fn(async () => undefined),
            routerRefresh: vi.fn(),
            willExceedProductLimit: () => false,
            getLimitErrorMessage: () => 'limit reached',
        }

        const { result } = renderHook(() => useProductsImportExportActions(params))

        await result.current.handleBulkImageUploadSuccess()

        expect(getProducts).toHaveBeenCalledWith({
            page: 2,
            limit: 24,
            search: 'chair',
            category: 'Furniture',
            stockFilter: 'low_stock',
            minPrice: 100,
            maxPrice: 250,
            sortBy: 'price',
            sortOrder: 'desc',
        })
    })

    it('passes active filters when selecting all products across pages', async () => {
        vi.mocked(getAllProductIds).mockResolvedValue(['filtered-1', 'filtered-2'])
        const setSelectedIds = vi.fn()
        const params = {
            t: (key: string) => key,
            products: [makeProduct('visible')],
            selectedIds: [],
            paginatedProducts: [makeProduct('visible')],
            sortField: 'order' as const,
            search: 'chair',
            selectedCategory: 'Furniture',
            stockFilter: 'low_stock' as const,
            priceRange: [100, 250] as [number, number],
            setSelectedIds,
            setProducts: vi.fn(),
            setSortField: vi.fn(),
            setSortOrder: vi.fn(),
            setSearch: vi.fn(),
            setSelectedCategory: vi.fn(),
            setStockFilter: vi.fn(),
            setPriceRange: vi.fn(),
            setCurrentPage: vi.fn(),
            updateUrl: vi.fn(),
        }

        const { result } = renderHook(() => useProductsSelectionActions(params))

        await act(async () => {
            await result.current.handleToolbarSelectAll(true)
        })

        expect(getAllProductIds).toHaveBeenCalledWith({
            search: 'chair',
            category: 'Furniture',
            stockFilter: 'low_stock',
            minPrice: 100,
            maxPrice: 250,
        })
        expect(setSelectedIds).toHaveBeenCalledWith(['filtered-1', 'filtered-2'])
    })
})
