"use client"

import { useCallback } from "react"
import { toast } from "sonner"

import {
  addDummyProducts,
  bulkUpdatePrices,
  deleteProducts,
  type Product,
  type ProductStats,
} from "@/lib/actions/products"
import { calculateStatsDelta } from "@/components/products/products-page-utils"

interface UseProductsBulkActionsParams {
  t: (key: string, params?: Record<string, unknown>) => string
  language: string
  userPlan: "free" | "plus" | "pro"
  refreshUser: () => Promise<void>
  startTransition: (callback: () => void) => void
  products: Product[]
  selectedIds: string[]
  editingProduct: Product | null
  priceChangeType: "increase" | "decrease"
  priceChangeMode: "percentage" | "fixed"
  priceChangeAmount: number
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  setStats: React.Dispatch<React.SetStateAction<ProductStats>>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  setShowLimitModal: React.Dispatch<React.SetStateAction<boolean>>
  setShowProductModal: React.Dispatch<React.SetStateAction<boolean>>
  setEditingProduct: React.Dispatch<React.SetStateAction<Product | null>>
  setShowDeleteAlert: React.Dispatch<React.SetStateAction<boolean>>
  setShowPriceModal: React.Dispatch<React.SetStateAction<boolean>>
  adjustMetadataTotal: (delta: number) => void
  getLimitErrorMessage: (incomingCount: number) => string
  willExceedProductLimit: (incomingCount: number) => boolean
}

export function useProductsBulkActions({
  t,
  language,
  userPlan,
  refreshUser,
  startTransition,
  products,
  selectedIds,
  editingProduct,
  priceChangeType,
  priceChangeMode,
  priceChangeAmount,
  setProducts,
  setStats,
  setSelectedIds,
  setShowLimitModal,
  setShowProductModal,
  setEditingProduct,
  setShowDeleteAlert,
  setShowPriceModal,
  adjustMetadataTotal,
  getLimitErrorMessage,
  willExceedProductLimit,
}: UseProductsBulkActionsParams) {
  const handleAddProduct = useCallback(() => {
    if (willExceedProductLimit(1)) {
      toast.error(getLimitErrorMessage(1))
      setShowLimitModal(true)
      return
    }
    setEditingProduct(null)
    setShowProductModal(true)
  }, [willExceedProductLimit, getLimitErrorMessage, setShowLimitModal, setEditingProduct, setShowProductModal])

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }, [setEditingProduct, setShowProductModal])

  const handleProductSaved = useCallback((savedProduct: Product) => {
    if (editingProduct) {
      setProducts(products.map((p) => (p.id === savedProduct.id ? savedProduct : p)))
    } else {
      setProducts([savedProduct, ...products])
      adjustMetadataTotal(1)
      void refreshUser()
    }
    setShowProductModal(false)
    setEditingProduct(null)
  }, [editingProduct, products, setProducts, adjustMetadataTotal, refreshUser, setShowProductModal, setEditingProduct])

  const handleProductDeleted = useCallback((id: string) => {
    setProducts(products.filter((p) => p.id !== id))
    setSelectedIds(selectedIds.filter((i) => i !== id))
    adjustMetadataTotal(-1)
    void refreshUser()
  }, [products, selectedIds, setProducts, setSelectedIds, adjustMetadataTotal, refreshUser])

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return
    setShowDeleteAlert(true)
  }, [selectedIds.length, setShowDeleteAlert])

  const executeBulkDelete = useCallback(() => {
    startTransition(async () => {
      try {
        await deleteProducts(selectedIds)
        setProducts(products.filter((p) => !selectedIds.includes(p.id)))
        adjustMetadataTotal(-selectedIds.length)
        setSelectedIds([])
        toast.success(t("toasts.productsDeleted", { count: selectedIds.length }) as string)
        setShowDeleteAlert(false)
        await refreshUser()
      } catch {
        toast.error(t("toasts.errorOccurred") as string)
      }
    })
  }, [startTransition, selectedIds, products, setProducts, adjustMetadataTotal, setSelectedIds, t, setShowDeleteAlert, refreshUser])

  const handleBulkPriceUpdate = useCallback(() => {
    if (selectedIds.length === 0) {
      toast.error(t("toasts.selectProductFirst") as string)
      return
    }

    startTransition(async () => {
      try {
        const updatedResponse = await bulkUpdatePrices(
          selectedIds,
          priceChangeType,
          priceChangeMode,
          priceChangeAmount
        )

        const updatedList = Array.isArray(updatedResponse) ? updatedResponse : []
        const updatedMap = new Map(updatedList.map((p) => [p.id, p]))
        setProducts(products.map((p) => updatedMap.get(p.id) || p))
        setShowPriceModal(false)
        setSelectedIds([])
        toast.success(t("toasts.operationComplete") as string)
      } catch {
        toast.error(t("toasts.priceUpdateFailed") as string)
      }
    })
  }, [selectedIds, t, startTransition, priceChangeType, priceChangeMode, priceChangeAmount, setProducts, products, setShowPriceModal, setSelectedIds])

  const handleTestImport = useCallback(() => {
    const TEST_PRODUCTS_BATCH_COUNT = 10
    if (willExceedProductLimit(TEST_PRODUCTS_BATCH_COUNT)) {
      toast.error(getLimitErrorMessage(TEST_PRODUCTS_BATCH_COUNT))
      setShowLimitModal(true)
      return
    }

    startTransition(async () => {
      try {
        const addedProducts = await addDummyProducts(language as "tr" | "en", userPlan)
        const addedList = Array.isArray(addedProducts) ? addedProducts : []
        setProducts([...addedList, ...products])
        adjustMetadataTotal(addedList.length)

        const delta = calculateStatsDelta(addedList)
        setStats((prev) => ({
          ...prev,
          total: prev.total + delta.total,
          inStock: prev.inStock + delta.inStock,
          lowStock: prev.lowStock + delta.lowStock,
          outOfStock: prev.outOfStock + delta.outOfStock,
          totalValue: prev.totalValue + delta.totalValue,
        }))

        toast.success(t("toasts.testProductsAdded") as string)
        await refreshUser()
      } catch {
        toast.error(t("toasts.testProductsFailed") as string)
      }
    })
  }, [willExceedProductLimit, getLimitErrorMessage, setShowLimitModal, startTransition, language, userPlan, setProducts, products, adjustMetadataTotal, setStats, t, refreshUser])

  return {
    handleAddProduct,
    handleEditProduct,
    handleProductSaved,
    handleProductDeleted,
    handleBulkDelete,
    executeBulkDelete,
    handleBulkPriceUpdate,
    handleTestImport,
  }
}
