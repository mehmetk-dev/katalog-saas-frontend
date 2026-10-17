"use client"

import { useMemo } from "react"

import type { Product } from "@/lib/actions/products"
import type { ProductsPageDerived } from "./products-page-controller.types"

interface UseProductsPageDerivedParams {
  products: Product[]
  initialAllCategories: string[]
  search: string
  selectedCategory: string
  stockFilter: string
  priceRange: [number, number]
  metadataTotal: number
  metadataTotalPages: number
}

export function useProductsPageDerived({
  products,
  initialAllCategories,
  search,
  selectedCategory,
  stockFilter,
  priceRange,
  metadataTotal,
  metadataTotalPages,
}: UseProductsPageDerivedParams): ProductsPageDerived {
  const categories = useMemo(() => {
    // Ürünün kategori alanı virgülle ayrılmış birden çok kategori içerebilir
    const pageCategories = products.flatMap((p) => (p.category || "").split(",").map((c) => c.trim()).filter(Boolean))
    return [...new Set([...initialAllCategories, ...pageCategories])].sort((a, b) => a.localeCompare(b, "tr-TR"))
  }, [products, initialAllCategories])

  const hasActiveFilters =
    search !== "" ||
    selectedCategory !== "all" ||
    stockFilter !== "all" ||
    priceRange[0] > 0 ||
    priceRange[1] > 0

  const filteredCount = metadataTotal
  const paginatedProducts = products
  const totalPagesCount = metadataTotalPages

  return {
    categories,
    hasActiveFilters,
    paginatedProducts,
    totalPagesCount,
    filteredCount,
  }
}
