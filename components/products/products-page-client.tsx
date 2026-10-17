"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, Check, FileDown, GripVertical, Image as ImageIcon, Loader2, MoreHorizontal, Package, Percent, Plus, SearchX, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"

import { ProductsTable } from "./table/products-table"
import { ProductModal } from "./modals/product-modal"
import { ImportExportModal } from "./modals/import-export-modal"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

import { ProductStatsCards } from "./toolbar/stats-cards"
import { PRODUCTS_SEARCH_INPUT_ID, ProductsToolbar } from "./toolbar/toolbar"
import { ProductsFilterSheet } from "./filters/filter-sheet"
import { ActiveFilters } from "./filters/active-filters"
import { ProductsPagination } from "./table/pagination"
import { ProductsBulkPriceModal } from "./bulk/bulk-price-modal"
import { ProductsBulkActionsBar } from "./toolbar/bulk-actions-bar"
import { AddToCatalogDialog, BulkCategoryDialog, BulkStockDialog } from "./bulk/bulk-edit-dialogs"
import { PAGE_SIZE_OPTIONS } from "./products-page-utils"
import type { ProductsPageClientProps } from "./products-page-types"
import { useProductsPageController } from "./hooks/use-products-page-controller"
import type { ReorderStatus } from "./hooks/use-products-reorder"

export function ProductsPageClient(props: ProductsPageClientProps) {
  const {
    t,
    products,
    metadata,
    stats,
    search,
    showLimitModal,
    showProductModal,
    editingProduct,
    selectedIds,
    isPending,
    showBulkImageModal,
    showImportModal,
    showFilters,
    showPriceModal,
    showDeleteAlert,
    viewMode,
    sortField,
    sortOrder,
    stockFilter,
    selectedCategory,
    priceRange,
    currentPage,
    itemsPerPage,
    priceChangeType,
    priceChangeMode,
    priceChangeAmount,
    categories,
    hasActiveFilters,
    paginatedProducts,
    totalPagesCount,
    filteredCount,
    handlePageChange,
    handleAddProduct,
    handleEditProduct,
    handleProductSaved,
    handleProductDeleted,
    handleBulkDelete,
    executeBulkDelete,
    handleBulkPriceUpdate,
    handleTestImport,
    clearAllFilters,
    downloadAllProducts,
    handleToolbarSelectAll,
    handleSearchChange,
    handleCategoryChange,
    handleItemsPerPageChange,
    handleSortChange,
    handleColumnSort,
    handleMove,
    reorderStatus,
    handleStockFilterChange,
    handlePriceRangeChange,
    handleImportProducts,
    handleBulkImageUploadSuccess,
    setSelectedIds,
    setShowLimitModal,
    setShowProductModal,
    setShowBulkImageModal,
    setShowImportModal,
    setShowFilters,
    setShowPriceModal,
    setShowDeleteAlert,
    setViewMode,
    setPriceChangeType,
    setPriceChangeMode,
    setPriceChangeAmount,
    userPlan,
    maxProducts,
    isBulkWorking,
    handleInlineUpdate,
    handleBulkCategory,
    handleBulkStock,
    handleAddToCatalog,
    handleExportSelected,
    visibleColumns,
    toggleColumn,
  } = useProductsPageController(props)

  const [bulkDialog, setBulkDialog] = useState<"category" | "stock" | "catalog" | null>(null)

  // Klavye kısayolları: "/" arama, "N" yeni ürün. Yazı alanındayken veya bir pencere açıkken çalışmaz.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return
      if (document.querySelector('[role="dialog"], [role="menu"], [role="alertdialog"]')) return
      if (e.key === "/") {
        e.preventDefault()
        document.getElementById(PRODUCTS_SEARCH_INPUT_ID)?.focus()
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        handleAddProduct()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleAddProduct])
  const closeBulkDialog = (open: boolean) => { if (!open) setBulkDialog(null) }

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (stockFilter !== "all" ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] > 0 ? 1 : 0)

  const canReorder = sortField === "order" && products.length > 1

  const tr = (key: string, params?: Record<string, unknown>) => t(key, params) as string

  return (
    <TooltipProvider>
      {/* Seçim varken alttaki toplu işlem çubuğu sayfalamanın üstüne binmesin */}
      <div className={cn("space-y-5", selectedIds.length > 0 && "pb-20")}>
        <PageHeader
          title={tr("sidebar.products")}
          description={
            Number.isFinite(maxProducts)
              ? tr("products.pageDescriptionWithLimit", { count: metadata.total.toLocaleString("tr-TR"), max: maxProducts.toLocaleString("tr-TR") })
              : tr("products.pageDescription", { count: metadata.total })
          }
          actions={
            <>
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <FileDown className="size-4" />
                <span className="hidden sm:inline">{tr("products.importExportShort")}</span>
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label={tr("products.moreTools")} title={tr("products.moreTools")}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowBulkImageModal(true)}>
                    <ImageIcon />
                    {tr("products.bulkImageUpload")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowPriceModal(true)}>
                    <Percent />
                    {tr("products.bulkPriceUpdate")}
                  </DropdownMenuItem>
                  {/* Örnek ürünler yalnızca boş hesapta anlamlı; dolu hesapta gerçek verinin arasına karışmasın */}
                  {metadata.total === 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleTestImport}>
                        <Sparkles />
                        {tr("products.addTestProducts")}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleAddProduct} title={tr("products.shortcuts.newProduct")}>
                <Plus className="size-4" />
                {tr("products.addProduct")}
              </Button>
            </>
          }
        />

        <ProductStatsCards stats={stats} stockFilter={stockFilter} onStockFilterChange={handleStockFilterChange} />

        <div className="space-y-3">
          <ProductsToolbar
            selectedCount={selectedIds.length}
            totalFilteredCount={filteredCount}
            onSelectAll={handleToolbarSelectAll}
            search={search}
            onSearchChange={handleSearchChange}
            onOpenFilters={() => setShowFilters(true)}
            activeFilterCount={activeFilterCount}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            stockFilter={stockFilter}
            onStockFilterChange={handleStockFilterChange}
            priceRange={priceRange}
            onPriceRangeChange={handlePriceRangeChange}
            onClearFilters={clearAllFilters}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
          />
          {/* Geniş ekranda seçili filtreler zaten araç çubuğundaki düğmelerde yazıyor */}
          <div className="xl:hidden">
          <ActiveFilters
            search={search}
            selectedCategory={selectedCategory}
            stockFilter={stockFilter}
            priceRange={priceRange}
            onClearSearch={() => handleSearchChange("")}
            onClearCategory={() => handleCategoryChange("all")}
            onClearStock={() => handleStockFilterChange("all")}
            onClearPrice={() => handlePriceRangeChange([0, 0])}
            onClearAll={clearAllFilters}
          />
          </div>
        </div>

        <ProductsFilterSheet
          open={showFilters}
          onOpenChange={setShowFilters}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          categories={categories}
          stockFilter={stockFilter}
          onStockFilterChange={(filter) => handleStockFilterChange(filter as typeof stockFilter)}
          priceRange={priceRange}
          onPriceRangeChange={handlePriceRangeChange}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
          filteredCount={filteredCount}
        />

        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tr("products.deleteConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{tr("products.deleteConfirmDesc", { count: selectedIds.length })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tr("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={executeBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {tr("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className={cn("transition-opacity", isPending && "pointer-events-none opacity-60")}>
          {products.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={SearchX}
                title={tr("products.noResults")}
                description={tr("products.noResultsDesc")}
                action={<Button variant="outline" onClick={clearAllFilters}>{tr("products.clearFilters")}</Button>}
              />
            ) : (
              <EmptyState
                icon={Package}
                title={tr("products.noProducts")}
                description={tr("products.noProductsDesc")}
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={handleAddProduct}>
                      <Plus className="size-4" />
                      {tr("products.addProduct")}
                    </Button>
                    <Button variant="outline" onClick={() => setShowImportModal(true)}>
                      <FileDown className="size-4" />
                      {tr("products.importExportShort")}
                    </Button>
                    <Button variant="ghost" onClick={handleTestImport} disabled={isPending}>
                      <Sparkles className="size-4" />
                      {tr("products.tryWithSamples")}
                    </Button>
                  </div>
                }
              />
            )
          ) : (
            <>
            {canReorder && <ReorderHint status={reorderStatus} t={tr} />}
            <ProductsTable
              products={paginatedProducts}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              onEdit={handleEditProduct}
              onDeleted={handleProductDeleted}
              onSaved={handleProductSaved}
              viewMode={viewMode}
              reorder={{
                enabled: canReorder,
                onMove: handleMove,
                isFirstPage: currentPage <= 1,
                isLastPage: currentPage >= totalPagesCount,
              }}
              sort={{ field: sortField, order: sortOrder, onSort: handleColumnSort }}
              selectAll={{ totalCount: filteredCount, onSelectAll: handleToolbarSelectAll }}
              visibleColumns={visibleColumns}
              onInlineUpdate={handleInlineUpdate}
            />
            </>
          )}

          <ProductsPagination
            currentPage={currentPage}
            totalPages={totalPagesCount}
            itemsPerPage={itemsPerPage}
            totalItems={filteredCount}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>

        <ProductModal
          open={showProductModal}
          onOpenChange={setShowProductModal}
          product={editingProduct}
          onSaved={handleProductSaved}
          allCategories={categories}
          userPlan={userPlan === "pro" ? "pro" : userPlan === "plus" ? "plus" : "free"}
          maxProducts={maxProducts}
          currentProductCount={metadata.total}
        />

        <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("products.limits.title") as string}</DialogTitle>
              <DialogDescription>{t("products.limits.description", { max: maxProducts.toString() }) as string}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowLimitModal(false)}>
                {t("common.cancel") as string}
              </Button>
              <Button asChild className="bg-primary text-primary-foreground">
                <Link href="/pricing">{t("products.limits.upgrade") as string}</Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <ImportExportModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          hideTrigger
          onImport={handleImportProducts}
          onExport={downloadAllProducts}
          productCount={products.length}
          currentProductCount={metadata.total}
          maxProducts={maxProducts}
          isLoading={isPending}
          userPlan={userPlan === "pro" ? "pro" : userPlan === "free" ? "free" : "plus"}
        />

        <ProductsBulkPriceModal
          open={showPriceModal}
          onOpenChange={setShowPriceModal}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          paginatedProducts={paginatedProducts}
          priceChangeType={priceChangeType}
          onPriceChangeTypeChange={setPriceChangeType}
          priceChangeMode={priceChangeMode}
          onPriceChangeModeChange={setPriceChangeMode}
          priceChangeAmount={priceChangeAmount}
          onPriceChangeAmountChange={setPriceChangeAmount}
          onUpdate={handleBulkPriceUpdate}
          isPending={isPending}
        />

        <BulkImageUploadModal
          open={showBulkImageModal}
          onOpenChange={setShowBulkImageModal}
          products={products}
          onSuccess={handleBulkImageUploadSuccess}
        />

        <ProductsBulkActionsBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onBulkPriceUpdate={() => setShowPriceModal(true)}
          onBulkCategory={() => setBulkDialog("category")}
          onBulkStock={() => setBulkDialog("stock")}
          onAddToCatalog={() => setBulkDialog("catalog")}
          onExportSelected={handleExportSelected}
          onBulkDelete={handleBulkDelete}
          isPending={isPending || isBulkWorking}
        />

        <BulkCategoryDialog
          open={bulkDialog === "category"}
          onOpenChange={closeBulkDialog}
          count={selectedIds.length}
          isWorking={isBulkWorking}
          categories={categories}
          onSubmit={handleBulkCategory}
        />
        <BulkStockDialog
          open={bulkDialog === "stock"}
          onOpenChange={closeBulkDialog}
          count={selectedIds.length}
          isWorking={isBulkWorking}
          onSubmit={handleBulkStock}
        />
        <AddToCatalogDialog
          open={bulkDialog === "catalog"}
          onOpenChange={closeBulkDialog}
          count={selectedIds.length}
          isWorking={isBulkWorking}
          onSubmit={handleAddToCatalog}
        />
      </div>
    </TooltipProvider>
  )
}

const REORDER_HINT_DISMISSED_KEY = "products.reorderHintDismissed"

/** Manuel sıradayken tablonun üstündeki ipucu (bir kez kapatılabilir) + kaydetme durumu */
function ReorderHint({ status, t }: { status: ReorderStatus; t: (key: string) => string }) {
  // SSR'da gizli başlar; localStorage okunduktan sonra gerekiyorsa gösterilir (hydration uyumsuzluğu olmasın)
  const [hintVisible, setHintVisible] = useState(false)

  useEffect(() => {
    try {
      setHintVisible(localStorage.getItem(REORDER_HINT_DISMISSED_KEY) !== "1")
    } catch {
      setHintVisible(true)
    }
  }, [])

  const dismissHint = () => {
    setHintVisible(false)
    try {
      localStorage.setItem(REORDER_HINT_DISMISSED_KEY, "1")
    } catch {
      // Gizli sekme vb.: yalnızca bu oturumda gizlenir
    }
  }

  if (!hintVisible && status === "idle") return null

  return (
    <div className="mb-2 flex min-h-6 items-center justify-between gap-3 text-xs text-muted-foreground">
      {hintVisible ? (
        <span className="flex items-center gap-1.5">
          <GripVertical className="size-3.5 shrink-0" />
          <span className="hidden md:inline">{t("products.reorder.hint")}</span>
          {/* Mobilde tutamaç yok; sıralama ⋯ menüsünden */}
          <span className="md:hidden">{t("products.reorder.hintMobile")}</span>
          <button
            type="button"
            onClick={dismissHint}
            aria-label={t("products.reorder.dismissHint")}
            title={t("products.reorder.dismissHint")}
            className="ml-0.5 flex size-5 items-center justify-center rounded hover:bg-muted hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ) : (
        <span />
      )}
      <span aria-live="polite" className="flex shrink-0 items-center gap-1">
        {status === "saving" && (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            {t("products.reorder.saving")}
          </>
        )}
        {status === "saved" && (
          <>
            <Check className="size-3.5 text-success" />
            {t("products.reorder.saved")}
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="size-3.5 text-destructive" />
            {t("products.reorder.failedShort")}
          </>
        )}
      </span>
    </div>
  )
}
