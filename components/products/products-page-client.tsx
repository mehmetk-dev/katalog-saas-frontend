"use client"

import type React from "react"
import { useState, useTransition, useMemo, useCallback, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"

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

export function ProductsPageClient({ initialProducts, userPlan, maxProducts }: ProductsPageClientProps) {
  const { t, language } = useTranslation()
  const { refreshUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>(initialProducts)

  // Server-side güncellemeleri (revalidatePath sonrası) client state'e yansıt
  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  const [search, setSearch] = useState("")
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

  // Filtreleme State
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)

  // Fiyat Güncelleme State
  const [priceChangeType, setPriceChangeType] = useState<"increase" | "decrease">("increase")
  const [priceChangeMode, setPriceChangeMode] = useState<"percentage" | "fixed">("percentage")
  const [priceChangeAmount, setPriceChangeAmount] = useState<number>(10)

  const isFreeUser = userPlan === "free"
  const isAtLimit = isFreeUser && products.length >= maxProducts

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

  // Filtreleme ve sıralama mantığı
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // Arama filtresi
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      )
    }

    // Kategori filtresi
    if (selectedCategory !== "all") {
      if (selectedCategory === "Kategorisiz" || selectedCategory === t("products.uncategorized")) {
        result = result.filter(p => !p.category || p.category === "Kategorisiz" || p.category === t("products.uncategorized"))
      } else {
        result = result.filter(p => p.category === selectedCategory)
      }
    }

    // Stok filtresi
    if (stockFilter !== "all") {
      result = result.filter(p => {
        if (stockFilter === "out_of_stock") return p.stock === 0
        if (stockFilter === "low_stock") return p.stock > 0 && p.stock < 10
        if (stockFilter === "in_stock") return p.stock >= 10
        return true
      })
    }

    // Fiyat aralığı filtresi
    result = result.filter(p => {
      const price = Number(p.price) || 0
      return price >= priceRange[0] && price <= priceRange[1]
    })

    // Sıralama
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "price":
          comparison = (Number(a.price) || 0) - (Number(b.price) || 0)
          break
        case "stock":
          comparison = a.stock - b.stock
          break
        case "category":
          comparison = (a.category || "").localeCompare(b.category || "")
          break
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case "order":
          comparison = (a.order || 0) - (b.order || 0)
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [products, search, selectedCategory, stockFilter, priceRange, sortField, sortOrder, t])

  const hasActiveFilters = search !== "" || selectedCategory !== "all" || stockFilter !== "all" || priceRange[0] !== 0 || priceRange[1] !== priceStats.max

  // Sayfalama
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedProducts.slice(start, start + itemsPerPage)
  }, [filteredAndSortedProducts, currentPage, itemsPerPage])

  // İstatistikler
  const stats = useMemo(() => ({
    total: products.length,
    inStock: products.filter(p => p.stock >= 10).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (Number(p.price) || 0) * p.stock, 0)
  }), [products])

  // Kategori bazlı istatistikler
  const categoryStats = useMemo(() => {
    const statsMap: Record<string, { count: number; totalValue: number }> = {}
    products.forEach(p => {
      const cat = (p.category || t("products.uncategorized")) as string
      if (!statsMap[cat]) statsMap[cat] = { count: 0, totalValue: 0 }
      statsMap[cat].count++
      statsMap[cat].totalValue += (Number(p.price) || 0) * p.stock
    })
    return Object.entries(statsMap).sort((a, b) => b[1].count - a[1].count)
  }, [products, t])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

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
        const updatedProducts = await bulkUpdatePrices(
          selectedIds,
          priceChangeType,
          priceChangeMode,
          priceChangeAmount
        )

        // Ürünleri güncelle
        const updatedMap = new Map(updatedProducts.map((p: Product) => [p.id, p]))
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
  }

  const selectCurrentPage = () => {
    const pageIds = paginatedProducts.map(p => p.id)
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
            totalFilteredCount={filteredAndSortedProducts.length}
            onSelectAll={(checked) => {
              if (checked) {
                setSelectedIds(filteredAndSortedProducts.map(p => p.id))
              } else {
                setSelectedIds([])
              }
            }}
            search={search}
            onSearchChange={(value) => {
              setSearch(value)
              setCurrentPage(1)
            }}
            onOpenFilters={() => setShowFilters(true)}
            hasActiveFilters={hasActiveFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size)
              setCurrentPage(1)
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
            onCategoryChange={(cat) => { setSelectedCategory(cat); setCurrentPage(1) }}
            categories={categories}
            stockFilter={stockFilter}
            onStockFilterChange={(filter) => { setStockFilter(filter as StockFilter); setCurrentPage(1) }}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            maxPrice={priceStats.max}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearAllFilters}
            filteredCount={filteredAndSortedProducts.length}
          />
        </div>

        {/* Ürün Listesi */}
        <div className="mt-2">
          <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{(t("products.deleteConfirmTitle") as string) || "Emin misiniz?"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {(t("products.deleteConfirmDesc", { count: selectedIds.length }) as string) || `Seçili ${selectedIds.length} ürünü silmek üzeresiniz.Bu işlem geri alınamaz.`}
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
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredAndSortedProducts.length}
          onPageChange={handlePageChange}
          onItemsPerPageChange={(size) => {
            setItemsPerPage(size)
            setCurrentPage(1)
          }}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />

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
              // Optimistic update (optional now but good for perceived speed)
              setProducts([...imported, ...products])
              router.refresh() // Force server re-fetch to ensure sync
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
            const updatedProducts = await getProducts()
            setProducts(updatedProducts)
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
