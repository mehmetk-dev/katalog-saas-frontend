import { describe, expect, it } from 'vitest'

import { createCatalogPagesModel } from '@/components/builder/preview/use-catalog-pages'
import { buildPages } from '@/components/export/pdf-export-document'
import type { Product } from '@/lib/actions/products'

function product(id: string, category: string): Product {
    return {
        id,
        user_id: 'user-1',
        sku: `SKU-${id}`,
        name: `Product ${id}`,
        description: `Description ${id}`,
        price: 10,
        stock: 5,
        category,
        image_url: `https://example.com/${id}.jpg`,
        images: [],
        product_url: null,
        custom_attributes: [],
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        order: Number(id),
    }
}

describe('PDF export / preview page parity', () => {
    it('uses the same page sequence and page numbering as preview export mode', () => {
        const products = [
            product('1', 'B'),
            product('2', 'B'),
            product('3', 'A'),
            product('4', 'A'),
            product('5', 'A'),
            product('6', 'B'),
            product('7', 'A'),
        ]
        const catalog = {
            layout: 'modern-grid',
            columns_per_row: 2,
            enable_cover_page: true,
            enable_category_dividers: true,
            category_order: ['A', 'B'],
        }

        const previewModel = createCatalogPagesModel({
            products,
            layout: 'modern-grid',
            columnsPerRow: 2,
            enableCoverPage: true,
            enableCategoryDividers: true,
            categoryOrder: ['A', 'B'],
            uncategorizedLabel: 'Kategorisiz',
        })
        const previewPages = previewModel.getAllPages()
        const exportPages = buildPages(catalog, products)

        expect(exportPages.map((page) => page.type)).toEqual(previewPages.map((page) => page.type))
        expect(
            exportPages.map((page) =>
                page.type === 'products' ? page.products.map((p) => p.id) : []
            )
        ).toEqual(
            previewPages.map((page) =>
                page.type === 'products' ? page.products.map((p) => p.id) : []
            )
        )
        expect(
            exportPages
                .map((page, index) =>
                    page.type === 'products'
                        ? { pageNumber: page.pageNumber, totalPages: page.totalPages, index }
                        : null
                )
                .filter(Boolean)
        ).toEqual(
            exportPages
                .map((page, index) =>
                    page.type === 'products'
                        ? { pageNumber: index + 1, totalPages: previewModel.totalPages, index }
                        : null
                )
                .filter(Boolean)
        )
    })
})
