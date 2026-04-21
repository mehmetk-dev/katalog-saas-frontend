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
  itemsPerPage: number
  t: (key: string, params?: Record<string, unknown>) => string
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
  itemsPerPage,
  t,
}: UseProductsPageDerivedParams): ProductsPageDerived {
  const categories = useMemo(() => {
    const pageCategories = products.map((p) => p.category).filter(Boolean) as string[]
    return [...new Set([...initialAllCategories, ...pageCategories])].sort()
  }, [products, initialAllCategories])

  const priceStats = useMemo(() => {
    const prices = products.map((p) => Number(p.price) || 0)
    const calculatedMax = prices.length > 0 ? Math.max(...prices) : 0
    return {
      min: Math.min(...prices, 0),
      max: Math.max(calculatedMax, 0),
    }
  }, [products])

  const hasActiveFilters =
    search !== "" ||
    selectedCategory !== "all" ||
    stockFilter !== "all" ||
    priceRange[0] !== 0 ||
    priceRange[1] !== priceStats.max

  const filteredProducts = useMemo(() => {
    let result = products

    if (stockFilter !== "all") {
      result = result.filter((p) => {
        const stock = p.stock ?? 0
        if (stockFilter === "in_stock") return stock >= 10
        if (stockFilter === "low_stock") return stock > 0 && stock < 10
        if (stockFilter === "out_of_stock") return stock === 0
        return true
      })
    }

    if (priceStats.max > 0 && (priceRange[0] !== 0 || priceRange[1] !== priceStats.max)) {
      result = result.filter((p) => {
        const price = Number(p.price) || 0
        return price >= priceRange[0] && price <= priceRange[1]
      })
    }

    return result
  }, [products, stockFilter, priceRange, priceStats.max])

  const hasClientSideFilters =
    stockFilter !== "all" ||
    (priceStats.max > 0 && (priceRange[0] !== 0 || priceRange[1] !== priceStats.max))

  const filteredCount = hasClientSideFilters ? filteredProducts.length : metadataTotal

  const paginatedProducts = filteredProducts
  const totalPagesCount = hasClientSideFilters
    ? Math.max(1, Math.ceil(filteredCount / Math.max(1, itemsPerPage)))
    : metadataTotalPages

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
    filteredCount,
    categoryStats,
  }
}
