"use client"

import { useMemo, useState } from "react"

import { buildInitialCatalogState } from "@/components/builder/builder-utils"
import { createCatalogPagesModel } from "@/components/builder/preview/use-catalog-pages"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import type { CatalogPage } from "../_lib/types"

interface UseCatalogPagesOptions {
    catalog: Catalog
    products: Product[]
    uncategorizedLabel: string
    locale: string
}

/**
 * Yayındaki katalogun sayfaları. Tasarım ayarları ve sayfalama builder'daki
 * `buildInitialCatalogState` + `createCatalogPagesModel` ile üretilir; böylece
 * müşteri editörde gördüğünün aynısını görür.
 */
export function useCatalogPages({ catalog, products, uncategorizedLabel, locale }: UseCatalogPagesOptions) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")

    const design = useMemo(() => buildInitialCatalogState(catalog), [catalog])

    const categories = useMemo(
        () => ["all", ...new Set(products.map((p) => p.category?.trim()).filter((c): c is string => !!c))],
        [products],
    )

    const filteredProducts = useMemo(() => {
        const query = searchQuery.trim().toLocaleLowerCase(locale)
        return products.filter((product) => {
            if (selectedCategory !== "all" && product.category?.trim() !== selectedCategory) return false
            if (!query) return true
            return [product.name, product.description, product.sku].some((value) =>
                value?.toLocaleLowerCase(locale).includes(query),
            )
        })
    }, [locale, products, searchQuery, selectedCategory])

    const catalogPages = useMemo((): CatalogPage[] => {
        if (filteredProducts.length === 0) {
            // Filtre sonucu boşsa boş ürün sayfası yerine "sonuç yok" gösterilir
            return design.enableCoverPage && products.length > 0 && !searchQuery && selectedCategory === "all"
                ? [{ type: "cover" }]
                : []
        }
        return createCatalogPagesModel({
            products: filteredProducts,
            layout: design.layout,
            columnsPerRow: design.columnsPerRow,
            enableCoverPage: design.enableCoverPage,
            enableCategoryDividers: design.enableCategoryDividers,
            categoryOrder: design.categoryOrder,
            uncategorizedLabel,
        }).getAllPages()
    }, [design, filteredProducts, products.length, searchQuery, selectedCategory, uncategorizedLabel])

    const isFiltering = searchQuery.trim() !== "" || selectedCategory !== "all"

    return {
        design,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        categories,
        filteredProducts,
        catalogPages,
        isFiltering,
        resetFilters: () => {
            setSearchQuery("")
            setSelectedCategory("all")
        },
    }
}
