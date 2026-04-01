"use client"

import type { Product, ProductStats } from "@/lib/actions/products"

import { useProductsSelectionActions } from "./use-products-selection-actions"
import { useProductsBulkActions } from "./use-products-bulk-actions"
import { useProductsImportExportActions } from "./use-products-import-export-actions"

interface UseProductsPageActionsParams {
  t: (key: string, params?: Record<string, unknown>) => string
  language: string
  userPlan: "free" | "plus" | "pro"
  refreshUser: () => Promise<void>
  routerRefresh: () => void
  startTransition: (callback: () => void) => void
  products: Product[]
  selectedIds: string[]
  paginatedProducts: Product[]
  selectedCategory: string
  currentPage: number
  itemsPerPage: number
  search: string
  priceStatsMax: number
  priceChangeType: "increase" | "decrease"
  priceChangeMode: "percentage" | "fixed"
  priceChangeAmount: number
  sortField: string
  editingProduct: Product | null
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  setStats: React.Dispatch<React.SetStateAction<ProductStats>>
  setMetadata: React.Dispatch<React.SetStateAction<{ total: number; page: number; limit: number; totalPages: number }>>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  setShowLimitModal: React.Dispatch<React.SetStateAction<boolean>>
  setShowProductModal: React.Dispatch<React.SetStateAction<boolean>>
  setEditingProduct: React.Dispatch<React.SetStateAction<Product | null>>
  setShowDeleteAlert: React.Dispatch<React.SetStateAction<boolean>>
  setShowPriceModal: React.Dispatch<React.SetStateAction<boolean>>
  setShowBulkImageModal: React.Dispatch<React.SetStateAction<boolean>>
  setSortField: React.Dispatch<React.SetStateAction<"name" | "price" | "stock" | "created_at" | "category" | "order">>
  setSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>
  setSearch: React.Dispatch<React.SetStateAction<string>>
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>
  setStockFilter: React.Dispatch<React.SetStateAction<"all" | "in_stock" | "low_stock" | "out_of_stock">>
  setPriceRange: React.Dispatch<React.SetStateAction<[number, number]>>
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  adjustMetadataTotal: (delta: number) => void
  getLimitErrorMessage: (incomingCount: number) => string
  willExceedProductLimit: (incomingCount: number) => boolean
  updateUrl: (newParams: Record<string, string | number | null>) => void
}

export function useProductsPageActions(params: UseProductsPageActionsParams) {
  const selectionActions = useProductsSelectionActions({
    t: params.t,
    products: params.products,
    selectedIds: params.selectedIds,
    paginatedProducts: params.paginatedProducts,
    sortField: params.sortField,
    priceStatsMax: params.priceStatsMax,
    setSelectedIds: params.setSelectedIds,
    setProducts: params.setProducts,
    setSortField: params.setSortField,
    setSortOrder: params.setSortOrder,
    setSearch: params.setSearch,
    setSelectedCategory: params.setSelectedCategory,
    setStockFilter: params.setStockFilter,
    setPriceRange: params.setPriceRange,
    setCurrentPage: params.setCurrentPage,
    updateUrl: params.updateUrl,
  })

  const bulkActions = useProductsBulkActions({
    t: params.t,
    language: params.language,
    userPlan: params.userPlan,
    refreshUser: params.refreshUser,
    startTransition: params.startTransition,
    products: params.products,
    selectedIds: params.selectedIds,
    editingProduct: params.editingProduct,
    priceChangeType: params.priceChangeType,
    priceChangeMode: params.priceChangeMode,
    priceChangeAmount: params.priceChangeAmount,
    setProducts: params.setProducts,
    setStats: params.setStats,
    setSelectedIds: params.setSelectedIds,
    setShowLimitModal: params.setShowLimitModal,
    setShowProductModal: params.setShowProductModal,
    setEditingProduct: params.setEditingProduct,
    setShowDeleteAlert: params.setShowDeleteAlert,
    setShowPriceModal: params.setShowPriceModal,
    adjustMetadataTotal: params.adjustMetadataTotal,
    getLimitErrorMessage: params.getLimitErrorMessage,
    willExceedProductLimit: params.willExceedProductLimit,
  })

  const importExportActions = useProductsImportExportActions({
    t: params.t,
    products: params.products,
    currentPage: params.currentPage,
    itemsPerPage: params.itemsPerPage,
    search: params.search,
    selectedCategory: params.selectedCategory,
    setProducts: params.setProducts,
    setStats: params.setStats,
    setMetadata: params.setMetadata,
    setShowBulkImageModal: params.setShowBulkImageModal,
    adjustMetadataTotal: params.adjustMetadataTotal,
    refreshUser: params.refreshUser,
    routerRefresh: params.routerRefresh,
    willExceedProductLimit: params.willExceedProductLimit,
    getLimitErrorMessage: params.getLimitErrorMessage,
  })

  return {
    ...selectionActions,
    ...bulkActions,
    ...importExportActions,
  }
}
