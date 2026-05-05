import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { createProductSchema, productsQuerySchema } from '@/backend/src/controllers/products/schemas'
import type { Product } from '@/lib/actions/products'
import { useProductsImportExportActions } from '@/components/products/hooks/use-products-import-export-actions'
import { useProductsSelectionActions } from '@/components/products/hooks/use-products-selection-actions'
import { ProductsFilterSheet } from '@/components/products/filters/filter-sheet'
import {
    buildProductOrderPayload,
    mapSortFieldToProductSort,
} from '@/components/products/products-page-utils'
import { bulkImportProducts, getAllProductIds, getProducts } from '@/lib/actions/products'

vi.mock('@/lib/actions/products', async () => {
    const actual = await vi.importActual<typeof import('@/lib/actions/products')>('@/lib/actions/products')
    return {
        ...actual,
        bulkImportProducts: vi.fn(),
        getAllProductIds: vi.fn(),
        getProducts: vi.fn(),
    }
})

vi.mock('@/lib/contexts/i18n-provider', () => ({
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

    it('builds page-offset order payloads for paginated drag reorder', () => {
        const payload = buildProductOrderPayload([makeProduct('p-13'), makeProduct('p-14')], 12)

        expect(payload).toEqual([
            { id: 'p-13', order: 12 },
            { id: 'p-14', order: 13 },
        ])
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
            hasMaxPriceFilter: false,
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
            hasMaxPriceFilter: true,
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

    it('does not issue a separate sort order update when selecting a new sort field', () => {
        const onSortFieldChange = vi.fn()
        const onSortOrderChange = vi.fn()

        render(
            <ProductsFilterSheet
                open
                onOpenChange={vi.fn()}
                sortField="created_at"
                sortOrder="asc"
                onSortFieldChange={onSortFieldChange}
                onSortOrderChange={onSortOrderChange}
                selectedCategory="all"
                onCategoryChange={vi.fn()}
                categories={[]}
                stockFilter="all"
                onStockFilterChange={vi.fn()}
                priceRange={[0, 0]}
                onPriceRangeChange={vi.fn()}
                maxPrice={0}
                hasActiveFilters={false}
                onClearFilters={vi.fn()}
                filteredCount={0}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /filters\.sortPrice/i }))

        expect(onSortFieldChange).toHaveBeenCalledWith('price')
        expect(onSortOrderChange).not.toHaveBeenCalled()
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
            priceStatsMax: 500,
            search: 'chair',
            selectedCategory: 'Furniture',
            stockFilter: 'low_stock' as const,
            priceRange: [100, 250] as [number, number],
            hasMaxPriceFilter: true,
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
