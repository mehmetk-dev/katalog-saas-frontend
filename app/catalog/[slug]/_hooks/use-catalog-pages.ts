"use client"

import { useState, useMemo } from "react"
import type { Product } from "@/lib/actions/products"
import type { Catalog } from "@/lib/actions/catalogs"
import type { CatalogPage } from "../_lib/types"
import { getPageSize } from "../_lib/constants"

interface UseCatalogPagesOptions {
    catalog: Catalog
    products: Product[]
}

/**
 * Derives filterable catalog pages (cover, category dividers, product pages)
 * from a flat product list and catalog configuration.
 */
export function useCatalogPages({ catalog, products }: UseCatalogPagesOptions) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")

    const categories = useMemo(
        () => ["all", ...new Set(products.map(p => p.category).filter((c): c is string => c !== null))],
        [products],
    )

    const filteredProducts = useMemo(() => {
        const lowerSearch = searchQuery.toLowerCase()
        return products.filter(product => {
            const matchesSearch =
                !searchQuery ||
                product.name.toLowerCase().includes(lowerSearch) ||
                product.description?.toLowerCase().includes(lowerSearch) ||
                product.sku?.toLowerCase().includes(lowerSearch)
            const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [products, searchQuery, selectedCategory])

    const columnsPerRow = catalog.columns_per_row || 3
    const productsPerPage = getPageSize(catalog.layout, columnsPerRow)

    const catalogPages = useMemo(() => {
        const pages: CatalogPage[] = []

        if (catalog.enable_cover_page) {
            pages.push({ type: 'cover' })
        }

        const addProductPages = (prods: Product[]) => {
            for (let i = 0; i < prods.length; i += productsPerPage) {
                pages.push({
                    type: 'products',
                    products: prods.slice(i, i + productsPerPage),
                    pageNumber: 0,
                    totalPages: 0,
                })
            }
        }

        if (catalog.enable_category_dividers && filteredProducts.length > 0) {
            const productsByCategory = new Map<string, Product[]>()
            for (const product of filteredProducts) {
                const category = product.category || 'Kategorisiz'
                if (!productsByCategory.has(category)) {
                    productsByCategory.set(category, [])
                }
                productsByCategory.get(category)!.push(product)
            }

            const categoryKeys = Array.from(productsByCategory.keys())
            if (catalog.category_order?.length) {
                categoryKeys.sort((a, b) => {
                    const idxA = catalog.category_order!.indexOf(a)
                    const idxB = catalog.category_order!.indexOf(b)
                    if (idxA === -1 && idxB === -1) return 0
                    if (idxA === -1) return 1
                    if (idxB === -1) return -1
                    return idxA - idxB
                })
            }

            for (const categoryName of categoryKeys) {
                const prods = productsByCategory.get(categoryName)!
                pages.push({
                    type: 'divider',
                    categoryName,
                    firstProductImage: prods[0]?.image_url || null,
                })
                addProductPages(prods)
            }
        } else {
            addProductPages(filteredProducts)
        }

        // Assign sequential page numbers to product pages
        let counter = 1
        const totalProductPages = pages.filter(p => p.type === 'products').length
        for (const page of pages) {
            if (page.type === 'products') {
                page.pageNumber = counter
                page.totalPages = totalProductPages
                counter++
            }
        }

        return pages
    }, [filteredProducts, productsPerPage, catalog.enable_cover_page, catalog.enable_category_dividers, catalog.category_order])

    return {
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        categories,
        filteredProducts,
        catalogPages,
    }
}
