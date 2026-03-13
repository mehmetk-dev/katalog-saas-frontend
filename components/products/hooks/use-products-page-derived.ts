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
  metadataTotalPages: number
  t: (key: string, params?: Record<string, unknown>) => string
}

export function useProductsPageDerived({
  products,
  initialAllCategories,
  search,
  selectedCategory,
  stockFilter,
  priceRange,
  metadataTotalPages,
  t,
}: UseProductsPageDerivedParams): ProductsPageDerived {
  const categories = useMemo(() => {
    const pageCategories = products.map((p) => p.category).filter(Boolean) as string[]
    return [...new Set([...initialAllCategories, ...pageCategories])].sort()
  }, [products, initialAllCategories])

  const priceStats = useMemo(() => {
    const prices = products.map((p) => Number(p.price) || 0)
    return {
      min: Math.min(...prices, 0),
      max: Math.max(...prices, 100000),
    }
  }, [products])

  const hasActiveFilters =
    search !== "" ||
    selectedCategory !== "all" ||
    stockFilter !== "all" ||
    priceRange[0] !== 0 ||
    priceRange[1] !== priceStats.max

  const paginatedProducts = products
  const totalPagesCount = metadataTotalPages

  const categoryStats = useMemo(() => {
    const statsMap: Record<string, { count: number; totalValue: number }> = {}
    products.forEach((p) => {
      const cat = (p.category || (t && t("products.uncategorized") ? t("products.uncategorized") : "Kategorisiz")) as string
      if (!statsMap[cat]) statsMap[cat] = { count: 0, totalValue: 0 }
      statsMap[cat].count++
      statsMap[cat].totalValue += (Number(p.price) || 0) * p.stock
    })
    return Object.entries(statsMap).sort((a, b) => b[1].count - a[1].count)
  }, [products, t])

  return {
    categories,
    priceStats,
    hasActiveFilters,
    paginatedProducts,
    totalPagesCount,
    categoryStats,
  }
}
