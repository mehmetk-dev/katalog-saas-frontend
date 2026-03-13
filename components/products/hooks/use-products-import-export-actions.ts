"use client"

import { useCallback } from "react"
import { toast } from "sonner"

import { bulkImportProducts, getAllProductsForExport, type Product, type ProductStats } from "@/lib/actions/products"
import { downloadProductsCsv } from "@/components/products/export/download-products-csv"
import { calculateStatsDelta } from "@/components/products/products-page-utils"

interface UseProductsImportExportActionsParams {
  t: (key: string, params?: Record<string, unknown>) => string
  products: Product[]
  currentPage: number
  itemsPerPage: number
  search: string
  selectedCategory: string
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  setStats: React.Dispatch<React.SetStateAction<ProductStats>>
  setMetadata: React.Dispatch<React.SetStateAction<{ total: number; page: number; limit: number; totalPages: number }>>
  setShowBulkImageModal: React.Dispatch<React.SetStateAction<boolean>>
  adjustMetadataTotal: (delta: number) => void
  refreshUser: () => Promise<void>
  routerRefresh: () => void
  willExceedProductLimit: (incomingCount: number) => boolean
  getLimitErrorMessage: (incomingCount: number) => string
}

export function useProductsImportExportActions({
  t,
  products,
  currentPage,
  itemsPerPage,
  search,
  selectedCategory,
  setProducts,
  setStats,
  setMetadata,
  setShowBulkImageModal,
  adjustMetadataTotal,
  refreshUser,
  routerRefresh,
  willExceedProductLimit,
  getLimitErrorMessage,
}: UseProductsImportExportActionsParams) {
  const downloadAllProducts = useCallback(async () => {
    try {
      toast.loading(t("importExport.exportLoading") as string || "Urunler hazirlaniyor...", { id: "export-loading" })
      const allProducts = await getAllProductsForExport()
      toast.dismiss("export-loading")

      if (!allProducts.length) {
        toast.error(t("importExport.noProductsExport") as string || "Disa aktarilacak urun yok")
        return
      }

      const exportedCount = downloadProductsCsv(allProducts, (key, params) => String(t(key, params)))
      toast.success(t("importExport.productsExported", { count: exportedCount }) as string || `${exportedCount} urun disa aktarildi`)
    } catch (error) {
      toast.dismiss("export-loading")
      toast.error(t("toasts.processingError") as string || "Disa aktarma sirasinda hata olustu")
      if (process.env.NODE_ENV === "development") console.error("Export error:", error)
    }
  }, [t])

  const handleImportProducts = useCallback(async (productsToImport: unknown) => {
    const incomingCount = Array.isArray(productsToImport) ? productsToImport.length : 0
    if (willExceedProductLimit(incomingCount)) {
      throw new Error(getLimitErrorMessage(incomingCount))
    }

    const imported = await bulkImportProducts(productsToImport as Array<Omit<Product, "id" | "user_id" | "created_at" | "updated_at">>)
    const importedList = Array.isArray(imported) ? imported : []
    setProducts([...importedList, ...products])
    adjustMetadataTotal(importedList.length)

    const delta = calculateStatsDelta(importedList)
    setStats((prev) => ({
      ...prev,
      total: prev.total + delta.total,
      inStock: prev.inStock + delta.inStock,
      lowStock: prev.lowStock + delta.lowStock,
      outOfStock: prev.outOfStock + delta.outOfStock,
      totalValue: prev.totalValue + delta.totalValue,
    }))

    routerRefresh()
    await refreshUser()
  }, [willExceedProductLimit, getLimitErrorMessage, setProducts, products, adjustMetadataTotal, setStats, routerRefresh, refreshUser])

  const handleBulkImageUploadSuccess = useCallback(async () => {
    const { getProducts } = await import("@/lib/actions/products")
    const response = await getProducts({ page: currentPage, limit: itemsPerPage, search, category: selectedCategory })
    setProducts(response.products)
    setMetadata(response.metadata)
    setShowBulkImageModal(false)
    toast.success(t("toasts.photosUpdated") as string)
  }, [currentPage, itemsPerPage, search, selectedCategory, setProducts, setMetadata, setShowBulkImageModal, t])

  return {
    downloadAllProducts,
    handleImportProducts,
    handleBulkImageUploadSuccess,
  }
}
