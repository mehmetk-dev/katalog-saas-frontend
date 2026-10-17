"use client"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useUser } from "@/lib/contexts/user-context"
import type { ProductsPageClientProps } from "@/components/products/products-page-types"
import { useProductsPageState } from "./use-products-page-state"
import { useProductsPageDerived } from "./use-products-page-derived"
import { useProductsPageActions } from "./use-products-page-actions"
import { useProductsReorder } from "./use-products-reorder"
import { useProductsExtraActions } from "./use-products-extra-actions"
import { useProductColumns } from "./use-product-columns"
import { defaultSortOrder, nextColumnSort, normalizeSortOrder } from "@/components/products/products-page-utils"
import type { SortableColumn } from "@/components/products/table/types"

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

  const { reorderStatus, handleMove } = useProductsReorder({
    t: (key, params) => String(t(key, params)),
    currentPage: state.currentPage,
    totalPages: state.metadata.totalPages,
    setProducts: state.setProducts,
    routerRefresh: () => state.router.refresh(),
  })

  const extraActions = useProductsExtraActions({
    t: (key, params) => String(t(key, params)),
    products: state.products,
    selectedIds: state.selectedIds,
    setProducts: state.setProducts,
    setSelectedIds: state.setSelectedIds,
    routerRefresh: () => state.router.refresh(),
  })

  const { visibleColumns, toggleColumn } = useProductColumns()

  const applySort = (field: typeof state.sortField, order: typeof state.sortOrder) => {
    const nextOrder = normalizeSortOrder(field, order)
    if (field === state.sortField && nextOrder === state.sortOrder) return
    state.setSortField(field)
    state.setSortOrder(nextOrder)
    state.setCurrentPage(1)
    // Varsayılan (manuel, artan) URL'de tutulmaz
    state.updateUrl({
      sortBy: field === "order" ? null : field,
      sortOrder: field === "order" ? null : nextOrder,
      page: 1,
    })
  }

  const handleSortFieldChange = (field: typeof state.sortField) => applySort(field, defaultSortOrder(field))
  const handleSortOrderChange = (order: typeof state.sortOrder) => applySort(state.sortField, order)
  const handleSortChange = (field: typeof state.sortField, order: typeof state.sortOrder) => applySort(field, order)
  const handleColumnSort = (column: SortableColumn) => {
    const next = nextColumnSort({ field: state.sortField, order: state.sortOrder }, column)
    applySort(next.field, next.order)
  }

  const handleStockFilterChange = (filter: typeof state.stockFilter) => {
    state.setStockFilter(filter)
    state.setCurrentPage(1)
    state.updateUrl({ stockFilter: filter, page: 1 })
  }

  const handlePriceRangeChange = (range: [number, number]) => {
    state.setPriceRange(range)
    state.setCurrentPage(1)
    // 0 = sınır yok
    state.updateUrl({
      minPrice: range[0] > 0 ? range[0] : null,
      maxPrice: range[1] > 0 ? range[1] : null,
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
    hasActiveFilters: derived.hasActiveFilters,
    paginatedProducts: derived.paginatedProducts,
    totalPagesCount: derived.totalPagesCount,
    filteredCount: derived.filteredCount,

    handlePageChange: state.handlePageChange,
    handleSearchChange: state.handleSearchChange,
    handleCategoryChange: state.handleCategoryChange,
    handleItemsPerPageChange: state.handleItemsPerPageChange,
    handleSortFieldChange,
    handleSortOrderChange,
    handleSortChange,
    handleColumnSort,
    handleMove,
    reorderStatus,
    handleStockFilterChange,
    handlePriceRangeChange,

    ...actions,
    ...extraActions,
    visibleColumns,
    toggleColumn,

    setSelectedIds: state.setSelectedIds,
    setShowLimitModal: state.setShowLimitModal,
    setShowProductModal: state.setShowProductModal,
    setShowBulkImageModal: state.setShowBulkImageModal,
    setShowImportModal: state.setShowImportModal,
    setShowFilters: state.setShowFilters,
    setShowPriceModal: state.setShowPriceModal,
    setShowDeleteAlert: state.setShowDeleteAlert,
    setViewMode: state.setViewMode,
    setStockFilter: state.setStockFilter,
    setPriceRange: state.setPriceRange,
    setItemsPerPage: state.setItemsPerPage,
    setPriceChangeType: state.setPriceChangeType,
    setPriceChangeMode: state.setPriceChangeMode,
    setPriceChangeAmount: state.setPriceChangeAmount,
  }
}
