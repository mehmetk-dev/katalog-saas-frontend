"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import type { Product, ProductStats } from "@/lib/actions/products"
import {
  DEFAULT_ITEMS_PER_PAGE,
  PAGE_SIZE_OPTIONS,
  parseLimitFromQuery,
  parsePageFromQuery,
  parsePriceFromQuery,
  parseSortFieldFromQuery,
  parseSortOrderFromQuery,
  parseStockFilterFromQuery,
  type SortField,
  type SortOrder,
  type StockFilter,
  type ViewMode,
} from "@/components/products/products-page-utils"
import type { ProductsPageClientProps } from "@/components/products/products-page-types"
import type { ProductsMetadata } from "./products-page-controller.types"

const SEARCH_DEBOUNCE_MS = 300
const VIEW_MODE_STORAGE_KEY = "products-view-mode"

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
  const [sortField, setSortField] = useState<SortField>(parseSortFieldFromQuery(searchParams.get("sortBy")))
  const [sortOrder, setSortOrder] = useState<SortOrder>(parseSortOrderFromQuery(searchParams.get("sortOrder")))
  const [stockFilter, setStockFilter] = useState<StockFilter>(parseStockFilterFromQuery(searchParams.get("stockFilter")))
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all")
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parsePriceFromQuery(searchParams.get("minPrice")),
    parsePriceFromQuery(searchParams.get("maxPrice")),
  ])
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

  // Görünüm tercihi tarayıcıda hatırlanır (ilk render sunucuyla aynı kalsın diye mount sonrası okunur)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
      if (stored === "grid" || stored === "list") setViewMode(stored)
    } catch {
      // localStorage erişilemiyorsa varsayılan liste görünümü
    }
  }, [])

  const changeViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
    } catch {
      // yok say
    }
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

    // Filtre/arama değişiklikleri geçmişe yeni kayıt eklemez (Geri tuşu harf harf geri gitmesin)
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false })
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

  // Arama kutusu anında güncellenir; sunucuya istek son tuştan SEARCH_DEBOUNCE_MS sonra gider
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      updateUrl({ search: value.trim(), page: 1 })
    }, SEARCH_DEBOUNCE_MS)
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
    setViewMode: changeViewMode,
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
