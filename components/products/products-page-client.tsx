"use client"

import type React from "react"
import { useState, useTransition, useMemo, useCallback, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { ProductsTable } from "./products-table"
import { ProductModal } from "./product-modal"
import { ImportExportModal } from "./import-export-modal"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslation } from "@/lib/i18n-provider"
import { Product, deleteProducts, bulkImportProducts, bulkUpdatePrices, addDummyProducts } from "@/lib/actions/products"
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
import { BulkImageUploadModal } from "@/components/products/bulk-image-upload-modal"
import { useUser } from "@/lib/user-context"

// Atomic Components
import { ProductStatsCards } from "./stats-cards"
import { ProductsToolbar } from "./toolbar"
import { ProductsFilterSheet } from "./filter-sheet"
import { ProductsPagination } from "./pagination"
import { ProductsBulkPriceModal } from "./bulk-price-modal"
import { ProductsBulkActionsBar } from "./bulk-actions-bar"

interface ProductsPageClientProps {
  initialProducts: Product[]
  initialMetadata: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  userPlan: "free" | "plus" | "pro"
  maxProducts: number
}

type SortField = "name" | "price" | "stock" | "created_at" | "category" | "order"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"
type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"

const DEFAULT_ITEMS_PER_PAGE = 12
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 100]

import { useRouter, useSearchParams } from "next/navigation"

export function ProductsPageClient({ initialProducts, initialMetadata, userPlan, maxProducts }: ProductsPageClientProps) {
  const { t, language } = useTranslation()
  const { refreshUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [metadata, setMetadata] = useState(initialMetadata)

  // Server-side güncellemeleri (revalidatePath sonrası) client state'e yansıt
  useEffect(() => {
    setProducts(initialProducts)
    setMetadata(initialMetadata)
  }, [initialProducts, initialMetadata])

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
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"))
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get("limit") || DEFAULT_ITEMS_PER_PAGE.toString()))

  // Fiyat Güncelleme State
  const [priceChangeType, setPriceChangeType] = useState<"increase" | "decrease">("increase")
  const [priceChangeMode, setPriceChangeMode] = useState<"percentage" | "fixed">("percentage")
  const [priceChangeAmount, setPriceChangeAmount] = useState<number>(10)

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

  const isFreeUser = userPlan === "free"
  const isAtLimit = isFreeUser && metadata.total >= maxProducts

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

  // Filtreleme ve sıralama mantığı (Client-side'da sadece ek filtreler için kalabilir ama şimdilik sunucu verisini kullanıyoruz)
  const stats = useMemo(() => ({
    total: metadata.total,
    inStock: products.filter(p => p.stock >= 10).length, // Bu istatistikler tüm liste için değil sadece mevcut sayfa için olur, eğer tam istatistik istenirse backend'den gelmeli
    lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (Number(p.price) || 0) * p.stock, 0)
  }), [products, metadata])

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
    if (isAtLimit) {
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
      refreshUser()
    }
    setShowProductModal(false)
    setEditingProduct(null)
  }

  const handleProductDeleted = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
    setSelectedIds(selectedIds.filter((i) => i !== id))
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
        const responseData = updatedResponse as any;
        const updatedList = (Array.isArray(responseData) ? responseData : (responseData.products || [])) as Product[];

        const updatedMap = new Map(updatedList.map((p) => [p.id, p]))
        setProducts(products.map(p => updatedMap.get(p.id) || p))

        setShowPriceModal(false)
        setSelectedIds([])

        toast.success(t('toasts.operationComplete') as string)
      } catch (error) {
        toast.error(t('toasts.priceUpdateFailed') as string)
      }
    })
  }

  const handleTestImport = () => {
    if (isAtLimit) {
      setShowLimitModal(true)
      return
    }

    startTransition(async () => {
      try {
        const addedProducts = await addDummyProducts(language as 'tr' | 'en', userPlan)
        setProducts([...addedProducts, ...products])
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

  const downloadAllProducts = () => {
    // CSV Headerları
    const headers = ["Name", "SKU", "Description", "Price", "Stock", "Category", "Image URL", "Product URL"]

    // CSV Satırları - Virgül içeren metinleri korumak için çift tırnak içine alıyoruz
    const rows = products.map(p => {
      // Tüm görselleri topla ve pipe (|) ile birleştir
      const allImages = [
        ...(p.image_url ? [p.image_url] : []),
        ...(p.images || [])
      ]
      const imagesString = Array.from(new Set(allImages)).filter(Boolean).join("|");

      const fields = [
        p.name,
        p.sku || "",
        p.description || "",
        p.price,
        p.stock,
        p.category || "",
        imagesString,
        p.product_url || ""
      ]

      // Her alanı temizle ve tırnak içine al
      return fields.map(field => {
        const stringValue = String(field || "").replace(/"/g, '""') // Çift tırnakları escape et
        return `"${stringValue}"`
      })
    })

    const csvContent = [headers.map(h => `"${h}"`), ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            onSelectAll={(checked) => {
              if (checked) {
                setSelectedIds(products.map(p => p.id))
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
              setItemsPerPage(size)
              setCurrentPage(1)
              updateUrl({ limit: size, page: 1 })
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
              const imported = await bulkImportProducts(productsToImport as Array<Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>>)
              const importedList = Array.isArray(imported) ? imported : (imported as any).products || [];
              setProducts([...importedList, ...products])
              router.refresh()
              refreshUser()
            } catch (error) {
              console.error('Bulk import failed:', error)
              throw error
            }
          }}
          onExport={downloadAllProducts}
          productCount={products.length}
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
