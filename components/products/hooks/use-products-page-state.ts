"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import type { Product, ProductStats } from "@/lib/actions/products"
import {
  DEFAULT_ITEMS_PER_PAGE,
  PAGE_SIZE_OPTIONS,
  parseLimitFromQuery,
  parsePageFromQuery,
  type SortField,
  type SortOrder,
  type StockFilter,
  type ViewMode,
} from "@/components/products/products-page-utils"
import type { ProductsPageClientProps } from "@/components/products/products-page-types"
import type { ProductsMetadata } from "./products-page-controller.types"

interface UseProductsPageStateParams extends ProductsPageClientProps {
  t: (key: string, params?: Record<string, unknown>) => string
}

export function useProductsPageState({
  initialProducts,
  initialMetadata,
  initialStats,
  maxProducts,
  t,
}: UseProductsPageStateParams) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [metadata, setMetadata] = useState<ProductsMetadata>(initialMetadata)
  const [stats, setStats] = useState<ProductStats>(initialStats)

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [showBulkImageModal, setShowBulkImageModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [currentPage, setCurrentPage] = useState(parsePageFromQuery(searchParams.get("page")))
  const [itemsPerPage, setItemsPerPage] = useState(parseLimitFromQuery(searchParams.get("limit")))

  const [priceChangeType, setPriceChangeType] = useState<"increase" | "decrease">("increase")
  const [priceChangeMode, setPriceChangeMode] = useState<"percentage" | "fixed">("percentage")
  const [priceChangeAmount, setPriceChangeAmount] = useState<number>(10)

  useEffect(() => {
    setProducts(initialProducts)
    setMetadata(initialMetadata)
    setStats(initialStats)
  }, [initialProducts, initialMetadata, initialStats])

  useEffect(() => {
    setViewMode("list")
  }, [])

  const updateUrl = useCallback((newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "all" || value === "") {
        params.delete(key)
      } else {
        params.set(key, value.toString())
      }
    })

    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }, [router, searchParams])

  const adjustMetadataTotal = useCallback((delta: number) => {
    setMetadata((prev) => {
      const nextTotal = Math.max(0, prev.total + delta)
      const pageLimit = prev.limit || itemsPerPage || DEFAULT_ITEMS_PER_PAGE
      return {
        ...prev,
        total: nextTotal,
        totalPages: Math.max(1, Math.ceil(nextTotal / pageLimit)),
      }
    })
  }, [itemsPerPage])

  const isAtLimit = metadata.total >= maxProducts

  const getLimitErrorMessage = useCallback((incomingCount: number) => {
    return t("toasts.productLimitReached", {
      current: metadata.total.toString(),
      incoming: incomingCount.toString(),
      max: maxProducts.toString(),
    }) as string
  }, [t, metadata.total, maxProducts])

  const willExceedProductLimit = useCallback((incomingCount: number) => {
    return metadata.total + incomingCount > maxProducts
  }, [metadata.total, maxProducts])

  useEffect(() => {
    const action = searchParams.get("action")
    if (action === "new") {
      if (isAtLimit) {
        setShowLimitModal(true)
      } else {
        setEditingProduct(null)
        setShowProductModal(true)
      }
      const newPath = window.location.pathname
      window.history.replaceState({}, "", newPath)
    } else if (action === "import") {
      setShowImportModal(true)
      const newPath = window.location.pathname
      window.history.replaceState({}, "", newPath)
    }
  }, [searchParams, isAtLimit])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    updateUrl({ page })
  }, [updateUrl])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
    updateUrl({ search: value, page: 1 })
  }, [updateUrl])

  const handleCategoryChange = useCallback((cat: string) => {
    setSelectedCategory(cat)
    setCurrentPage(1)
    updateUrl({ category: cat, page: 1 })
  }, [updateUrl])

  const handleItemsPerPageChange = useCallback((size: number) => {
    const safeSize = PAGE_SIZE_OPTIONS.includes(size) ? size : DEFAULT_ITEMS_PER_PAGE
    setItemsPerPage(safeSize)
    setCurrentPage(1)
    updateUrl({ limit: safeSize, page: 1 })
  }, [updateUrl])

  return {
    router,
    searchParams,
    isPending,
    startTransition,
    products,
    setProducts,
    metadata,
    setMetadata,
    stats,
    setStats,
    search,
    setSearch,
    showLimitModal,
    setShowLimitModal,
    showProductModal,
    setShowProductModal,
    editingProduct,
    setEditingProduct,
    selectedIds,
    setSelectedIds,
    showBulkImageModal,
    setShowBulkImageModal,
    showImportModal,
    setShowImportModal,
    showFilters,
    setShowFilters,
    showPriceModal,
    setShowPriceModal,
    showDeleteAlert,
    setShowDeleteAlert,
    viewMode,
    setViewMode,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    stockFilter,
    setStockFilter,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    priceChangeType,
    setPriceChangeType,
    priceChangeMode,
    setPriceChangeMode,
    priceChangeAmount,
    setPriceChangeAmount,
    adjustMetadataTotal,
    updateUrl,
    isAtLimit,
    getLimitErrorMessage,
    willExceedProductLimit,
    handlePageChange,
    handleSearchChange,
    handleCategoryChange,
    handleItemsPerPageChange,
  }
}
