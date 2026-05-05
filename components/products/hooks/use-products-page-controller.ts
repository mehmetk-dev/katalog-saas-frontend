"use client"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useUser } from "@/lib/contexts/user-context"
import type { ProductsPageClientProps } from "@/components/products/products-page-types"
import { useProductsPageState } from "./use-products-page-state"
import { useProductsPageDerived } from "./use-products-page-derived"
import { useProductsPageActions } from "./use-products-page-actions"

export function useProductsPageController(props: ProductsPageClientProps) {
  const { t, language } = useTranslation()
  const { refreshUser } = useUser()

  const state = useProductsPageState({
    ...props,
    t: (key, params) => String(t(key, params)),
  })

  const derived = useProductsPageDerived({
    products: state.products,
    initialAllCategories: props.initialAllCategories || [],
    search: state.search,
    selectedCategory: state.selectedCategory,
    stockFilter: state.stockFilter,
    priceRange: state.priceRange,
    metadataTotal: state.metadata.total,
    metadataTotalPages: state.metadata.totalPages,
    t: (key, params) => String(t(key, params)),
  })

  const actions = useProductsPageActions({
    t: (key, params) => String(t(key, params)),
    language,
    userPlan: props.userPlan,
    refreshUser,
    routerRefresh: () => state.router.refresh(),
    startTransition: state.startTransition,
    products: state.products,
    selectedIds: state.selectedIds,
    paginatedProducts: derived.paginatedProducts,
    selectedCategory: state.selectedCategory,
    stockFilter: state.stockFilter,
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
    search: state.search,
    priceRange: state.priceRange,
    hasMaxPriceFilter: state.searchParams.has("maxPrice"),
    priceStatsMax: derived.priceStats.max,
    priceChangeType: state.priceChangeType,
    priceChangeMode: state.priceChangeMode,
    priceChangeAmount: state.priceChangeAmount,
    sortField: state.sortField,
    sortOrder: state.sortOrder,
    editingProduct: state.editingProduct,
    setProducts: state.setProducts,
    setStats: state.setStats,
    setMetadata: state.setMetadata,
    setSelectedIds: state.setSelectedIds,
    setShowLimitModal: state.setShowLimitModal,
    setShowProductModal: state.setShowProductModal,
    setEditingProduct: state.setEditingProduct,
    setShowDeleteAlert: state.setShowDeleteAlert,
    setShowPriceModal: state.setShowPriceModal,
    setShowBulkImageModal: state.setShowBulkImageModal,
    setSortField: state.setSortField,
    setSortOrder: state.setSortOrder,
    setSearch: state.setSearch,
    setSelectedCategory: state.setSelectedCategory,
    setStockFilter: state.setStockFilter,
    setPriceRange: state.setPriceRange,
    setCurrentPage: state.setCurrentPage,
    adjustMetadataTotal: state.adjustMetadataTotal,
    getLimitErrorMessage: state.getLimitErrorMessage,
    willExceedProductLimit: state.willExceedProductLimit,
    updateUrl: state.updateUrl,
  })

  const handleSortFieldChange = (field: typeof state.sortField) => {
    const nextSortOrder = field === "order" ? "asc" : "desc"
    state.setSortField(field)
    state.setSortOrder(nextSortOrder)
    state.setCurrentPage(1)
    state.updateUrl({ sortBy: field, sortOrder: nextSortOrder, page: 1 })
  }

  const handleSortOrderChange = (order: typeof state.sortOrder) => {
    state.setSortOrder(order)
    state.setCurrentPage(1)
    state.updateUrl({ sortOrder: order, page: 1 })
  }

  const handleStockFilterChange = (filter: typeof state.stockFilter) => {
    state.setStockFilter(filter)
    state.setCurrentPage(1)
    state.updateUrl({ stockFilter: filter, page: 1 })
  }

  const handlePriceRangeChange = (range: [number, number]) => {
    state.setPriceRange(range)
    state.setCurrentPage(1)
    const shouldClearMax = derived.priceStats.max > 0 && range[1] >= derived.priceStats.max
    state.updateUrl({
      minPrice: range[0] > 0 ? range[0] : null,
      maxPrice: range[1] > 0 && !shouldClearMax ? range[1] : null,
      page: 1,
    })
  }

  return {
    t,
    userPlan: props.userPlan,
    maxProducts: props.maxProducts,

    products: state.products,
    metadata: state.metadata,
    stats: state.stats,
    search: state.search,
    showLimitModal: state.showLimitModal,
    showProductModal: state.showProductModal,
    editingProduct: state.editingProduct,
    selectedIds: state.selectedIds,
    isPending: state.isPending,
    showBulkImageModal: state.showBulkImageModal,
    showImportModal: state.showImportModal,
    showFilters: state.showFilters,
    showPriceModal: state.showPriceModal,
    showDeleteAlert: state.showDeleteAlert,
    viewMode: state.viewMode,
    sortField: state.sortField,
    sortOrder: state.sortOrder,
    stockFilter: state.stockFilter,
    selectedCategory: state.selectedCategory,
    priceRange: state.priceRange,
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
    priceChangeType: state.priceChangeType,
    priceChangeMode: state.priceChangeMode,
    priceChangeAmount: state.priceChangeAmount,

    categories: derived.categories,
    priceStats: derived.priceStats,
    hasActiveFilters: derived.hasActiveFilters,
    paginatedProducts: derived.paginatedProducts,
    totalPagesCount: derived.totalPagesCount,
    filteredCount: derived.filteredCount,
    categoryStats: derived.categoryStats,

    handlePageChange: state.handlePageChange,
    handleSearchChange: state.handleSearchChange,
    handleCategoryChange: state.handleCategoryChange,
    handleItemsPerPageChange: state.handleItemsPerPageChange,
    handleSortFieldChange,
    handleSortOrderChange,
    handleStockFilterChange,
    handlePriceRangeChange,

    ...actions,

    setSelectedIds: state.setSelectedIds,
    setShowLimitModal: state.setShowLimitModal,
    setShowProductModal: state.setShowProductModal,
    setShowBulkImageModal: state.setShowBulkImageModal,
    setShowImportModal: state.setShowImportModal,
    setShowFilters: state.setShowFilters,
    setShowPriceModal: state.setShowPriceModal,
    setShowDeleteAlert: state.setShowDeleteAlert,
    setViewMode: state.setViewMode,
    setSortField: state.setSortField,
    setSortOrder: state.setSortOrder,
    setStockFilter: state.setStockFilter,
    setPriceRange: state.setPriceRange,
    setItemsPerPage: state.setItemsPerPage,
    setPriceChangeType: state.setPriceChangeType,
    setPriceChangeMode: state.setPriceChangeMode,
    setPriceChangeAmount: state.setPriceChangeAmount,
  }
}
