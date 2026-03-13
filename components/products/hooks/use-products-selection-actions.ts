"use client"

import { useCallback } from "react"
import { toast } from "sonner"

import type { Product } from "@/lib/actions/products"

interface UseProductsSelectionActionsParams {
  t: (key: string, params?: Record<string, unknown>) => string
  products: Product[]
  selectedIds: string[]
  paginatedProducts: Product[]
  sortField: string
  priceStatsMax: number
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  setSortField: React.Dispatch<React.SetStateAction<"name" | "price" | "stock" | "created_at" | "category" | "order">>
  setSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>
  setSearch: React.Dispatch<React.SetStateAction<string>>
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>
  setStockFilter: React.Dispatch<React.SetStateAction<"all" | "in_stock" | "low_stock" | "out_of_stock">>
  setPriceRange: React.Dispatch<React.SetStateAction<[number, number]>>
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  updateUrl: (newParams: Record<string, string | number | null>) => void
}

export function useProductsSelectionActions({
  t,
  products,
  selectedIds,
  paginatedProducts,
  sortField,
  priceStatsMax,
  setSelectedIds,
  setProducts,
  setSortField,
  setSortOrder,
  setSearch,
  setSelectedCategory,
  setStockFilter,
  setPriceRange,
  setCurrentPage,
  updateUrl,
}: UseProductsSelectionActionsParams) {
  const clearAllFilters = useCallback(() => {
    setSearch("")
    setSelectedCategory("all")
    setStockFilter("all")
    setPriceRange([0, priceStatsMax])
    setCurrentPage(1)
    updateUrl({ search: "", category: "all", page: 1 })
  }, [setSearch, setSelectedCategory, setStockFilter, setPriceRange, priceStatsMax, setCurrentPage, updateUrl])

  const selectCurrentPage = useCallback(() => {
    const pageIds = paginatedProducts.map((p: Product) => p.id)
    const newSelectedIds = Array.from(new Set([...selectedIds, ...pageIds]))
    setSelectedIds(newSelectedIds)
  }, [paginatedProducts, selectedIds, setSelectedIds])

  const selectAllProducts = useCallback(() => {
    setSelectedIds(products.map((p) => p.id))
  }, [products, setSelectedIds])

  const selectByCategory = useCallback((category: string) => {
    const categoryIds = products
      .filter((p) => (p.category || (t("products.uncategorized") as string)) === category)
      .map((p) => p.id)
    const newSelectedIds = Array.from(new Set([...selectedIds, ...categoryIds]))
    setSelectedIds(newSelectedIds)
  }, [products, t, selectedIds, setSelectedIds])

  const handleToolbarSelectAll = useCallback(async (checked: boolean) => {
    if (!checked) {
      setSelectedIds([])
      return
    }

    try {
      toast.loading(t("common.loading") as string || "Tum urunler seciliyor...", { id: "select-all" })
      const { getAllProductIds } = await import("@/lib/actions/products")
      const allIds = await getAllProductIds()
      if (allIds && allIds.length > 0) {
        setSelectedIds(allIds)
        toast.success(t("products.allSelected", { count: allIds.length }) as string || `Toplam ${allIds.length} urun secildi`, { id: "select-all" })
      } else {
        setSelectedIds(products.map((p) => p.id))
        toast.dismiss("select-all")
      }
    } catch {
      setSelectedIds(products.map((p) => p.id))
      toast.dismiss("select-all")
    }
  }, [setSelectedIds, t, products])

  const handleTableReorder = useCallback((newProducts: Product[]) => {
    setProducts(newProducts)
    if (sortField !== "order") {
      setSortField("order")
      setSortOrder("asc")
      toast.info((t("products.switchedToManualSort") as string) || "Manuel siralamaya gecildi")
    }
  }, [setProducts, sortField, setSortField, setSortOrder, t])

  return {
    clearAllFilters,
    selectCurrentPage,
    selectAllProducts,
    selectByCategory,
    handleToolbarSelectAll,
    handleTableReorder,
  }
}
