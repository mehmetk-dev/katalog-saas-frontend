"use client"

import type React from "react"
import { useState, useTransition, useMemo, useCallback, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { ProductsTable } from "./table/products-table"
import { ProductModal } from "./modals/product-modal"
import { ImportExportModal } from "./modals/import-export-modal"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslation } from "@/lib/i18n-provider"
import { Product, ProductStats, deleteProducts, bulkImportProducts, bulkUpdatePrices, addDummyProducts, getAllProductsForExport } from "@/lib/actions/products"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BulkImageUploadModal } from "@/components/products/bulk/bulk-image-upload-modal"
import { useUser } from "@/lib/user-context"

// Atomic Components
import { ProductStatsCards } from "./toolbar/stats-cards"
import { ProductsToolbar } from "./toolbar/toolbar"
import { ProductsFilterSheet } from "./filters/filter-sheet"
import { ProductsPagination } from "./table/pagination"
import { ProductsBulkPriceModal } from "./bulk/bulk-price-modal"
import { ProductsBulkActionsBar } from "./toolbar/bulk-actions-bar"

interface ProductsPageClientProps {
  initialProducts: Product[]
  initialMetadata: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  initialStats: ProductStats
  userPlan: "free" | "plus" | "pro"
  maxProducts: number
}

type SortField = "name" | "price" | "stock" | "created_at" | "category" | "order"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"
type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"

const DEFAULT_ITEMS_PER_PAGE = 12
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 100]

const parsePageFromQuery = (value: string | null) => {
  const parsed = Number.parseInt(value || "1", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const parseLimitFromQuery = (value: string | null) => {
  const parsed = Number.parseInt(value || String(DEFAULT_ITEMS_PER_PAGE), 10)
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_ITEMS_PER_PAGE
}

import { useRouter, useSearchParams } from "next/navigation"

export function ProductsPageClient({ initialProducts, initialMetadata, initialStats, userPlan, maxProducts }: ProductsPageClientProps) {
  const { t, language } = useTranslation()
  const { refreshUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [metadata, setMetadata] = useState(initialMetadata)
  const [stats, setStats] = useState<ProductStats>(initialStats)

  // Server-side güncellemeleri (revalidatePath sonrası) client state'e yansıt
  useEffect(() => {
    setProducts(initialProducts)
    setMetadata(initialMetadata)
    setStats(initialStats)
  }, [initialProducts, initialMetadata, initialStats])

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  // Modallar State
  const [showBulkImageModal, setShowBulkImageModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  // Filtreleme State (URL'den al veya default)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [currentPage, setCurrentPage] = useState(parsePageFromQuery(searchParams.get("page")))
  const [itemsPerPage, setItemsPerPage] = useState(parseLimitFromQuery(searchParams.get("limit")))

  // Fiyat Güncelleme State
  const [priceChangeType, setPriceChangeType] = useState<"increase" | "decrease">("increase")
  const [priceChangeMode, setPriceChangeMode] = useState<"percentage" | "fixed">("percentage")
  const [priceChangeAmount, setPriceChangeAmount] = useState<number>(10)

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

  // Ürünler sayfası açıldığında varsayılan görünümü her zaman liste (normal) yap
  useEffect(() => {
    setViewMode("list")
  }, [])

  // URL Güncelleme Yardımcısı
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

  // URL'deki action parametrelerini kontrol et (import veya new)
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

  // Sayfa değişiminde URL'yi güncelle
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    updateUrl({ page })
  }, [updateUrl])

  // Kategorileri çıkar
  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category).filter(Boolean))] as string[]
  }, [products])

  // Fiyat aralığını hesapla
  const priceStats = useMemo(() => {
    const prices = products.map(p => Number(p.price) || 0)
    return {
      min: Math.min(...prices, 0),
      max: Math.max(...prices, 100000)
    }
  }, [products])

  const hasActiveFilters = search !== "" || selectedCategory !== "all" || stockFilter !== "all" || priceRange[0] !== 0 || priceRange[1] !== priceStats.max

  const paginatedProducts = products
  const totalPagesCount = metadata.totalPages

  // Kategori bazlı istatistikler
  const categoryStats = useMemo(() => {
    const statsMap: Record<string, { count: number; totalValue: number }> = {}
    products.forEach(p => {
      const cat = (p.category || (t && t("products.uncategorized") ? t("products.uncategorized") : "Kategorisiz")) as string
      if (!statsMap[cat]) statsMap[cat] = { count: 0, totalValue: 0 }
      statsMap[cat].count++
      statsMap[cat].totalValue += (Number(p.price) || 0) * p.stock
    })
    return Object.entries(statsMap).sort((a, b) => b[1].count - a[1].count)
  }, [products, t])

  const handleAddProduct = () => {
    if (willExceedProductLimit(1)) {
      toast.error(getLimitErrorMessage(1))
      setShowLimitModal(true)
    } else {
      setEditingProduct(null)
      setShowProductModal(true)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const handleProductSaved = (savedProduct: Product) => {
    if (editingProduct) {
      setProducts(products.map((p) => (p.id === savedProduct.id ? savedProduct : p)))
    } else {
      setProducts([savedProduct, ...products])
      adjustMetadataTotal(1)
      refreshUser()
    }
    setShowProductModal(false)
    setEditingProduct(null)
  }

  const handleProductDeleted = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
    setSelectedIds(selectedIds.filter((i) => i !== id))
    adjustMetadataTotal(-1)
    refreshUser()
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    setShowDeleteAlert(true)
  }

  const executeBulkDelete = () => {
    startTransition(async () => {
      try {
        await deleteProducts(selectedIds)
        setProducts(products.filter((p) => !selectedIds.includes(p.id)))
        adjustMetadataTotal(-selectedIds.length)
        setSelectedIds([])
        toast.success(t('toasts.productsDeleted', { count: selectedIds.length }) as string)
        setShowDeleteAlert(false)
        refreshUser()
      } catch {
        toast.error(t('toasts.errorOccurred') as string)
      }
    })
  }

  const handleBulkPriceUpdate = () => {
    if (selectedIds.length === 0) {
      toast.error(t('toasts.selectProductFirst') as string)
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

        // Ürünleri güncelle (yeni formatta gelmiş olabilir)
        const updatedList = Array.isArray(updatedResponse) ? updatedResponse : []

        const updatedMap = new Map(updatedList.map((p) => [p.id, p]))
        setProducts(products.map(p => updatedMap.get(p.id) || p))

        setShowPriceModal(false)
        setSelectedIds([])

        toast.success(t('toasts.operationComplete') as string)
      } catch {
        toast.error(t('toasts.priceUpdateFailed') as string)
      }
    })
  }

  const handleTestImport = () => {
    const TEST_PRODUCTS_BATCH_COUNT = 10
    if (willExceedProductLimit(TEST_PRODUCTS_BATCH_COUNT)) {
      toast.error(getLimitErrorMessage(TEST_PRODUCTS_BATCH_COUNT))
      setShowLimitModal(true)
      return
    }

    startTransition(async () => {
      try {
        const addedProducts = await addDummyProducts(language as 'tr' | 'en', userPlan)
        setProducts([...addedProducts, ...products])
        adjustMetadataTotal(addedProducts.length)
        toast.success(t('toasts.testProductsAdded') as string)
        refreshUser()
      } catch {
        toast.error(t('toasts.testProductsFailed') as string)
      }
    })
  }

  const clearAllFilters = () => {
    setSearch("")
    setSelectedCategory("all")
    setStockFilter("all")
    setPriceRange([0, priceStats.max])
    setCurrentPage(1)
    updateUrl({ search: "", category: "all", page: 1 })
  }

  const selectCurrentPage = () => {
    const pageIds = paginatedProducts.map((p: Product) => p.id)
    const newSelectedIds = Array.from(new Set([...selectedIds, ...pageIds]))
    setSelectedIds(newSelectedIds)
  }

  const selectAllProducts = () => {
    setSelectedIds(products.map(p => p.id))
  }

  const selectByCategory = (category: string) => {
    const categoryIds = products
      .filter(p => (p.category || (t("products.uncategorized") as string)) === category)
      .map(p => p.id)
    const newSelectedIds = Array.from(new Set([...selectedIds, ...categoryIds]))
    setSelectedIds(newSelectedIds)
  }

  const downloadAllProducts = async () => {
    try {
      toast.loading(t("products.importExport.exportLoading") as string || "Ürünler hazırlanıyor...", { id: "export-loading" })

      // Tüm ürünleri backend'den çek (server action — callback geçilemez)
      const allProducts = await getAllProductsForExport()

      toast.dismiss("export-loading")

      if (!allProducts.length) {
        toast.error(t("products.importExport.noProductsExport") as string || "Dışa aktarılacak ürün yok")
        return
      }

      const normalizeExportValue = (value: unknown) => {
        const normalized = String(value ?? "").trim()
        const lowered = normalized.toLowerCase()
        if (!normalized || lowered === "null" || lowered === "undefined" || lowered === "n/a" || lowered === "-") {
          return ""
        }
        return normalized
      }

      const hasAnyValue = (values: Array<unknown>) =>
        values.some((value) => normalizeExportValue(value).length > 0)

      const columnDefs = [
        {
          key: "name",
          header: t("products.importExport.systemFields.name") as string,
          value: (product: Product) => product.name || "",
          required: true,
        },
        {
          key: "sku",
          header: t("products.importExport.systemFields.sku") as string,
          value: (product: Product) => normalizeExportValue(product.sku),
          required: false,
        },
        {
          key: "description",
          header: t("products.importExport.systemFields.description") as string,
          value: (product: Product) => normalizeExportValue(product.description),
          required: false,
        },
        {
          key: "price",
          header: t("products.importExport.systemFields.price") as string,
          value: (product: Product) => String(product.price ?? ""),
          required: true,
        },
        {
          key: "stock",
          header: t("products.importExport.systemFields.stock") as string,
          value: (product: Product) => String(product.stock ?? ""),
          required: true,
        },
        {
          key: "category",
          header: t("products.importExport.systemFields.category") as string,
          value: (product: Product) => normalizeExportValue(product.category),
          required: false,
        },
        {
          key: "coverImage",
          header: t("products.importExport.systemFields.coverImage") as string,
          value: (product: Product) => normalizeExportValue(product.image_url),
          required: false,
        },
        {
          key: "additionalImages",
          header: t("products.importExport.systemFields.additionalImages") as string,
          value: (product: Product) => (product.images || [])
            .map((img: string) => normalizeExportValue(img))
            .filter((img: string) => img && img !== normalizeExportValue(product.image_url))
            .join("|"),
          required: false,
        },
        {
          key: "productUrl",
          header: t("products.importExport.systemFields.productUrl") as string,
          value: (product: Product) => normalizeExportValue(product.product_url),
          required: false,
        },
      ]

      const activeColumns = columnDefs.filter((column) =>
        column.required || hasAnyValue(allProducts.map((product) => column.value(product))),
      )

      // Collect all unique custom attribute names that actually have values
      const customAttrNames = new Set<string>()
      allProducts.forEach((product) => {
        if (!Array.isArray(product.custom_attributes)) return

        product.custom_attributes.forEach((attr: { name?: string; value?: string | null }) => {
          const attrName = normalizeExportValue(attr?.name)
          const attrValue = normalizeExportValue(attr?.value)
          if (attrName && attrValue) {
            customAttrNames.add(attrName)
          }
        })
      })
      const customAttrList = Array.from(customAttrNames)

      // CSV Headers
      const headers = [
        ...activeColumns.map((column) => column.header),
        ...customAttrList,
      ]

      // CSV Rows
      const rows = allProducts.map((product) => {
        const baseValues = activeColumns.map((column) => column.value(product))

        const customAttrValues = customAttrList.map(attrName => {
          if (!Array.isArray(product.custom_attributes)) return ""
          const attr = product.custom_attributes.find((a: { name: string }) => a.name === attrName)
          if (!attr) return ""
          const val = (attr as { value?: string }).value || ""
          const unit = (attr as { unit?: string }).unit || ""
          return unit ? `${val} ${unit}` : val
        })

        const fields = [...baseValues, ...customAttrValues]

        return fields.map(field => {
          const stringValue = String(field ?? "").replace(/"/g, '""')
          return `"${stringValue}"`
        })
      })

      // BOM for UTF-8 Excel compatibility
      const bom = "\uFEFF"
      const csvContent = bom + [headers.map(h => `"${h}"`), ...rows].map(e => e.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(t("products.importExport.productsExported", { count: allProducts.length }) as string || `${allProducts.length} ürün dışa aktarıldı`)
    } catch (error) {
      toast.dismiss("export-loading")
      toast.error(t("toasts.processingError") as string || "Dışa aktarma sırasında hata oluştu")
      console.error("Export error:", error)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-[calc(100vh-200px)] -m-4 sm:-m-6 p-4 sm:p-6 bg-gray-50 dark:bg-gray-950">
        <div className="space-y-3">
          {/* KPI Kartları */}
          <ProductStatsCards stats={stats} />

          {/* Toolbar */}
          <ProductsToolbar
            selectedCount={selectedIds.length}
            totalFilteredCount={metadata.total}
            onSelectAll={async (checked) => {
              if (checked) {
                try {
                  toast.loading(t('common.loading') as string || 'Tüm ürünler seçiliyor...', { id: 'select-all' });
                  const { getAllProductIds } = await import('@/lib/actions/products');
                  const allIds = await getAllProductIds();
                  if (allIds && allIds.length > 0) {
                    setSelectedIds(allIds);
                    toast.success(t('products.allSelected', { count: allIds.length }) as string || `Toplam ${allIds.length} ürün seçildi`, { id: 'select-all' });
                  } else {
                    setSelectedIds(products.map(p => p.id));
                    toast.dismiss('select-all');
                  }
                } catch (error) {
                  setSelectedIds(products.map(p => p.id));
                  toast.dismiss('select-all');
                }
              } else {
                setSelectedIds([])
              }
            }}
            search={search}
            onSearchChange={(value) => {
              setSearch(value)
              setCurrentPage(1)
              updateUrl({ search: value, page: 1 })
            }}
            onOpenFilters={() => setShowFilters(true)}
            hasActiveFilters={hasActiveFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(size) => {
              const safeSize = PAGE_SIZE_OPTIONS.includes(size) ? size : DEFAULT_ITEMS_PER_PAGE
              setItemsPerPage(safeSize)
              setCurrentPage(1)
              updateUrl({ limit: safeSize, page: 1 })
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onOpenImportExport={() => setShowImportModal(true)}
            onOpenBulkImageUpload={() => setShowBulkImageModal(true)}
            onOpenBulkPriceUpdate={() => setShowPriceModal(true)}
            onBulkDelete={handleBulkDelete}
            onAddTestProducts={handleTestImport}
            onAddProduct={handleAddProduct}
          />

          {/* Filtre ve Sıralama Drawer */}
          <ProductsFilterSheet
            open={showFilters}
            onOpenChange={setShowFilters}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortFieldChange={(field) => setSortField(field as SortField)}
            onSortOrderChange={setSortOrder}
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => {
              setSelectedCategory(cat);
              setCurrentPage(1);
              updateUrl({ category: cat, page: 1 })
            }}
            categories={categories}
            stockFilter={stockFilter}
            onStockFilterChange={(filter) => { setStockFilter(filter as StockFilter); setCurrentPage(1) }}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            maxPrice={priceStats.max}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearAllFilters}
            filteredCount={metadata.total}
          />
        </div>

        {/* Ürün Listesi ve Sayfalama */}
        <div className={cn(
          "transition-all duration-300",
          isPending && "opacity-50 pointer-events-none grayscale-[0.5]"
        )}>
          <div className="mt-2">
            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{(t("products.deleteConfirmTitle") as string) || "Emin misiniz?"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {(t("products.deleteConfirmDesc", { count: selectedIds.length }) as string) || `Seçili ${selectedIds.length} ürünü silmek üzeresiniz. Bu işlem geri alınamaz.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel") as string}</AlertDialogCancel>
                  <AlertDialogAction onClick={executeBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t("common.delete") as string}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <ProductsTable
              products={paginatedProducts}
              allProducts={products}
              search=""
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              onEdit={handleEditProduct}
              onDeleted={handleProductDeleted}
              viewMode={viewMode}
              onProductsReorder={(newProducts) => {
                setProducts(newProducts)
                // Sürükle-bırak yapıldığında otomatik olarak manuel sıralamaya geç
                if (sortField !== "order") {
                  setSortField("order")
                  setSortOrder("asc")
                  toast.info((t("products.switchedToManualSort") as string) || "Manuel sıralamaya geçildi")
                }
              }}
              onReorderSuccess={() => router.refresh()}
            />
          </div>

          {/* Sayfalama */}
          <ProductsPagination
            currentPage={currentPage}
            totalPages={totalPagesCount}
            itemsPerPage={itemsPerPage}
            totalItems={metadata.total}
            onPageChange={handlePageChange}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size)
              setCurrentPage(1)
              updateUrl({ limit: size, page: 1 })
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>

        {/* Modallar */}
        <ProductModal
          open={showProductModal}
          onOpenChange={setShowProductModal}
          product={editingProduct}
          onSaved={handleProductSaved}
          allCategories={categories}
          userPlan={userPlan === 'pro' ? 'pro' : userPlan === 'plus' ? 'plus' : 'free'}
          maxProducts={maxProducts}
          currentProductCount={metadata.total}
        />

        <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("products.limits.title") as string}</DialogTitle>
              <DialogDescription>
                {t("products.limits.description", { max: maxProducts.toString() }) as string}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowLimitModal(false)}>
                {t("common.cancel") as string}
              </Button>
              <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                <Link href="/pricing">{t("products.limits.upgrade") as string}</Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <ImportExportModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          hideTrigger
          onImport={async (productsToImport) => {
            try {
              const incomingCount = Array.isArray(productsToImport) ? productsToImport.length : 0
              if (willExceedProductLimit(incomingCount)) {
                throw new Error(getLimitErrorMessage(incomingCount))
              }

              const imported = await bulkImportProducts(productsToImport as Array<Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>>)
              const importedList = Array.isArray(imported) ? imported : []
              setProducts([...importedList, ...products])
              adjustMetadataTotal(importedList.length)
              // Stats'ı yeni ürünlere göre güncelle (server refresh beklemeden)
              setStats(prev => {
                let deltaInStock = 0, deltaLowStock = 0, deltaOutOfStock = 0
                importedList.forEach(p => {
                  const stock = typeof p.stock === 'number' ? p.stock : parseInt(String(p.stock || 0))
                  if (stock >= 10) deltaInStock++
                  else if (stock > 0 && stock < 10) deltaLowStock++
                  else deltaOutOfStock++
                })
                return {
                  ...prev,
                  total: prev.total + importedList.length,
                  inStock: prev.inStock + deltaInStock,
                  lowStock: prev.lowStock + deltaLowStock,
                  outOfStock: prev.outOfStock + deltaOutOfStock,
                }
              })
              router.refresh()
              refreshUser()
            } catch (error) {
              console.error('Bulk import failed:', error)
              throw error
            }
          }}
          onExport={downloadAllProducts}
          productCount={products.length}
          currentProductCount={metadata.total}
          maxProducts={maxProducts}
          isLoading={isPending}
          userPlan={userPlan === 'pro' ? 'pro' : userPlan === 'free' ? 'free' : 'plus'}
        />

        <ProductsBulkPriceModal
          open={showPriceModal}
          onOpenChange={setShowPriceModal}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          paginatedProducts={paginatedProducts}
          allProducts={products}
          categories={categories}
          categoryStats={categoryStats}
          priceChangeType={priceChangeType}
          onPriceChangeTypeChange={setPriceChangeType}
          priceChangeMode={priceChangeMode}
          onPriceChangeModeChange={setPriceChangeMode}
          priceChangeAmount={priceChangeAmount}
          onPriceChangeAmountChange={setPriceChangeAmount}
          onUpdate={handleBulkPriceUpdate}
          isPending={isPending}
          onSelectCurrentPage={selectCurrentPage}
          onSelectAllProducts={selectAllProducts}
          onSelectByCategory={selectByCategory}
        />

        <BulkImageUploadModal
          open={showBulkImageModal}
          onOpenChange={setShowBulkImageModal}
          products={products}
          onSuccess={async () => {
            const { getProducts } = await import('@/lib/actions/products')
            const response = await getProducts({ page: currentPage, limit: itemsPerPage, search, category: selectedCategory })
            setProducts(response.products)
            setMetadata(response.metadata)
            setShowBulkImageModal(false)
            toast.success(t('toasts.photosUpdated') as string)
          }}
        />

        <ProductsBulkActionsBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onBulkPriceUpdate={() => setShowPriceModal(true)}
          onBulkDelete={handleBulkDelete}
          isPending={isPending}
        />
      </div>
    </TooltipProvider>
  )
}
