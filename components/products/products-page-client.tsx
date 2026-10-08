"use client"

import Link from "next/link"
import { FileDown, Image as ImageIcon, MoreHorizontal, Package, Percent, Plus, SearchX, Sparkles } from "lucide-react"
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
import type { Product } from "@/lib/actions/products"

import { ProductStatsCards } from "./toolbar/stats-cards"
import { ProductsToolbar } from "./toolbar/toolbar"
import { ProductsFilterSheet } from "./filters/filter-sheet"
import { ActiveFilters } from "./filters/active-filters"
import type { SortableColumn } from "./table/types"
import { ProductsPagination } from "./table/pagination"
import { ProductsBulkPriceModal } from "./bulk/bulk-price-modal"
import { ProductsBulkActionsBar } from "./toolbar/bulk-actions-bar"
import { PAGE_SIZE_OPTIONS } from "./products-page-utils"
import type { ProductsPageClientProps } from "./products-page-types"
import { useProductsPageController } from "./hooks/use-products-page-controller"

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
    handleSortFieldChange,
    handleSortOrderChange,
    handleStockFilterChange,
    handlePriceRangeChange,
    handleTableReorder,
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
  } = useProductsPageController(props)

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (stockFilter !== "all" ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] > 0 ? 1 : 0)

  const handleColumnSort = (field: SortableColumn) => {
    if (field === sortField) handleSortOrderChange(sortOrder === "asc" ? "desc" : "asc")
    else handleSortFieldChange(field)
  }

  const tr = (key: string, params?: Record<string, unknown>) => t(key, params) as string

  return (
    <TooltipProvider>
      <div className="space-y-5">
        <PageHeader
          title={tr("sidebar.products")}
          description={tr("products.pageDescription", { count: metadata.total })}
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleTestImport}>
                    <Sparkles />
                    {tr("products.addTestProducts")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleAddProduct}>
                <Plus className="size-4" />
                {tr("products.addProduct")}
              </Button>
            </>
          }
        />

        <ProductStatsCards stats={stats} />

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
          />
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

        <ProductsFilterSheet
          open={showFilters}
          onOpenChange={setShowFilters}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortFieldChange={(field) => handleSortFieldChange(field as typeof sortField)}
          onSortOrderChange={handleSortOrderChange}
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
                  </div>
                }
              />
            )
          ) : (
            <ProductsTable
              products={paginatedProducts}
              allProducts={products}
              search=""
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              onEdit={handleEditProduct}
              onDeleted={handleProductDeleted}
              onSaved={handleProductSaved}
              viewMode={viewMode}
              reorderOffset={(currentPage - 1) * itemsPerPage}
              onProductsReorder={(newProducts: Product[]) => handleTableReorder(newProducts)}
              sort={{ field: sortField, order: sortOrder, onSort: handleColumnSort }}
            />
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
          onBulkDelete={handleBulkDelete}
          isPending={isPending}
        />
      </div>
    </TooltipProvider>
  )
}
