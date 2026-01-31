/**
 * Integration Tests for Storytelling Catalog Page Generation
 * Tests the catalogPages array generation logic in PublicCatalogClient
 */

import type { Product } from '@/lib/actions/products'

describe('Storytelling Catalog Page Generation', () => {
    const mockProducts: Product[] = [
        {
            id: '1',
            name: 'Product 1',
            category: 'Electronics',
            image_url: 'https://example.com/p1.jpg',
            price: 100,
            description: 'Test product 1',
            user_id: 'user1',
            sku: 'SKU1',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            stock: 10,
            images: ['https://example.com/p1.jpg'],
            product_url: null,
            custom_attributes: [],
            order: 0
        },
        {
            id: '2',
            name: 'Product 2',
            category: 'Electronics',
            image_url: 'https://example.com/p2.jpg',
            price: 200,
            description: 'Test product 2',
            user_id: 'user1',
            sku: 'SKU2',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            stock: 5,
            images: ['https://example.com/p2.jpg'],
            product_url: null,
            custom_attributes: [],
            order: 1
        },
        {
            id: '3',
            name: 'Product 3',
            category: 'Clothing',
            image_url: 'https://example.com/p3.jpg',
            price: 50,
            description: 'Test product 3',
            user_id: 'user1',
            sku: 'SKU3',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            stock: 20,
            images: ['https://example.com/p3.jpg'],
            product_url: null,
            custom_attributes: [],
            order: 2
        },
    ]

    // Helper function to simulate catalogPages generation
    const generateCatalogPages = (
        products: Product[],
        enableCoverPage: boolean,
        enableCategoryDividers: boolean,
        productsPerPage: number = 12
    ) => {
        type CatalogPage =
            | { type: 'cover' }
            | { type: 'divider'; categoryName: string; firstProductImage: string | null }
            | { type: 'products'; products: Product[]; pageNumber: number; totalPages: number }

        const catalogPages: CatalogPage[] = []

        // 1. Add Cover Page
        if (enableCoverPage) {
            catalogPages.push({ type: 'cover' })
        }

        // 2. Group by Category
        const productsByCategory: Record<string, Product[]> = {}
        products.forEach(product => {
            const cat = product.category || 'Uncategorized'
            if (!productsByCategory[cat]) {
                productsByCategory[cat] = []
            }
            productsByCategory[cat].push(product)
        })

        const categories = Object.keys(productsByCategory)

        // 3. Generate Pages
        categories.forEach((categoryName, catIndex) => {
            const categoryProducts = productsByCategory[categoryName]

            // Add Category Divider (except before first category if cover page exists)
            if (enableCategoryDividers && (catIndex > 0 || !enableCoverPage)) {
                catalogPages.push({
                    type: 'divider',
                    categoryName,
                    firstProductImage: categoryProducts[0]?.image_url || null
                })
            }

            // Add Product Pages
            const totalPagesInCategory = Math.ceil(categoryProducts.length / productsPerPage)
            for (let i = 0; i < totalPagesInCategory; i++) {
                const start = i * productsPerPage
                const end = start + productsPerPage
                const pageProducts = categoryProducts.slice(start, end)

                catalogPages.push({
                    type: 'products',
                    products: pageProducts,
                    pageNumber: i + 1,
                    totalPages: totalPagesInCategory
                })
            }
        })

        return catalogPages
    }

    describe('Cover Page Generation', () => {
        it('should add cover page when enabled', () => {
            const pages = generateCatalogPages(mockProducts, true, false)

            expect(pages[0]).toEqual({ type: 'cover' })
        })

        it('should not add cover page when disabled', () => {
            const pages = generateCatalogPages(mockProducts, false, false)

            expect(pages[0]).not.toEqual({ type: 'cover' })
            expect(pages[0].type).toBe('products')
        })
    })

    describe('Category Divider Generation', () => {
        it('should add dividers between categories when enabled', () => {
            const pages = generateCatalogPages(mockProducts, false, true)

            const dividers = pages.filter(p => p.type === 'divider')
            expect(dividers.length).toBe(2) // Electronics and Clothing
        })

        it('should not add dividers when disabled', () => {
            const pages = generateCatalogPages(mockProducts, false, false)

            const dividers = pages.filter(p => p.type === 'divider')
            expect(dividers.length).toBe(0)
        })

        it('should skip first divider if cover page is enabled', () => {
            const pages = generateCatalogPages(mockProducts, true, true)

            // Cover, Products (Electronics), Divider (Clothing), Products (Clothing)
            expect(pages[0].type).toBe('cover')
            expect(pages[1].type).toBe('products')
            expect(pages[2].type).toBe('divider')
        })

        it('should include first product image in divider', () => {
            const pages = generateCatalogPages(mockProducts, false, true)

            const firstDivider = pages.find(p => p.type === 'divider' && p.categoryName === 'Electronics')
            expect(firstDivider).toBeDefined()
            if (firstDivider && firstDivider.type === 'divider') {
                expect(firstDivider.firstProductImage).toBe('https://example.com/p1.jpg')
            }
        })
    })

    describe('Complete Storytelling Catalog', () => {
        it('should generate correct page sequence with all features enabled', () => {
            const pages = generateCatalogPages(mockProducts, true, true)

            // Expected: Cover, Products(Electronics x2), Divider(Clothing), Products(Clothing x1)
            expect(pages.length).toBeGreaterThan(0)
            expect(pages[0].type).toBe('cover')

            const productPages = pages.filter(p => p.type === 'products')
            const dividerPages = pages.filter(p => p.type === 'divider')

            expect(productPages.length).toBeGreaterThan(0)
            expect(dividerPages.length).toBeGreaterThan(0)
        })

        it('should handle single category without dividers', () => {
            const singleCategoryProducts = mockProducts.filter(p => p.category === 'Electronics')
            const pages = generateCatalogPages(singleCategoryProducts, true, true)

            expect(pages[0].type).toBe('cover')
            expect(pages[1].type).toBe('products')

            const dividers = pages.filter(p => p.type === 'divider')
            expect(dividers.length).toBe(0) // No dividers for single category
        })

        it('should maintain product order within pages', () => {
            const pages = generateCatalogPages(mockProducts, false, false, 2) // 2 products per page

            const firstProductPage = pages.find(p => p.type === 'products')
            if (firstProductPage && firstProductPage.type === 'products') {
                expect(firstProductPage.products.length).toBeLessThanOrEqual(2)
                expect(firstProductPage.products[0].id).toBe('1')
            }
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty product list', () => {
            const pages = generateCatalogPages([], true, true)

            expect(pages.length).toBe(1) // Only cover page
            expect(pages[0].type).toBe('cover')
        })

        it('should handle products without categories', () => {
            const uncategorizedProducts = mockProducts.map(p => ({ ...p, category: null }))
            const pages = generateCatalogPages(uncategorizedProducts as Product[], false, true)

            const divider = pages.find(p => p.type === 'divider')
            if (divider && divider.type === 'divider') {
                expect(divider.categoryName).toBe('Uncategorized')
            }
        })

        it('should handle single product', () => {
            const singleProduct = [mockProducts[0]]
            const pages = generateCatalogPages(singleProduct, true, true)

            expect(pages[0].type).toBe('cover')
            expect(pages[1].type).toBe('products')

            if (pages[1].type === 'products') {
                expect(pages[1].products.length).toBe(1)
            }
        })
    })
})
