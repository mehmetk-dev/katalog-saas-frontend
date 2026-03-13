"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

import { ProductsTable } from "./table/products-table"
import { ProductModal } from "./modals/product-modal"
import { ImportExportModal } from "./modals/import-export-modal"
import { Button } from "@/components/ui/button"
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
import { ProductsPagination } from "./table/pagination"
import { ProductsBulkPriceModal } from "./bulk/bulk-price-modal"
import { ProductsBulkActionsBar } from "./toolbar/bulk-actions-bar"
import { DEFAULT_ITEMS_PER_PAGE, PAGE_SIZE_OPTIONS } from "./products-page-utils"
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
    priceStats,
    hasActiveFilters,
    paginatedProducts,
    totalPagesCount,
    categoryStats,
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
    selectCurrentPage,
    selectAllProducts,
    selectByCategory,
    downloadAllProducts,
    handleToolbarSelectAll,
    handleSearchChange,
    handleCategoryChange,
    handleItemsPerPageChange,
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
    setSortField,
    setSortOrder,
    setStockFilter,
    setPriceRange,
    setItemsPerPage,
    setPriceChangeType,
    setPriceChangeMode,
    setPriceChangeAmount,
    userPlan,
    maxProducts,
  } = useProductsPageController(props)

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-[calc(100vh-200px)] -m-4 sm:-m-6 p-4 sm:p-6 bg-gray-50 dark:bg-gray-950">
        <div className="space-y-3">
          <ProductStatsCards stats={stats} />

          <ProductsToolbar
            selectedCount={selectedIds.length}
            totalFilteredCount={metadata.total}
            onSelectAll={handleToolbarSelectAll}
            search={search}
            onSearchChange={handleSearchChange}
            onOpenFilters={() => setShowFilters(true)}
            hasActiveFilters={hasActiveFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onOpenImportExport={() => setShowImportModal(true)}
            onOpenBulkImageUpload={() => setShowBulkImageModal(true)}
            onOpenBulkPriceUpdate={() => setShowPriceModal(true)}
            onBulkDelete={handleBulkDelete}
            onAddTestProducts={handleTestImport}
            onAddProduct={handleAddProduct}
          />

          <ProductsFilterSheet
            open={showFilters}
            onOpenChange={setShowFilters}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortFieldChange={(field) => setSortField(field as typeof sortField)}
            onSortOrderChange={setSortOrder}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categories={categories}
            stockFilter={stockFilter}
            onStockFilterChange={(filter) => {
              setStockFilter(filter as typeof stockFilter)
              handlePageChange(1)
            }}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            maxPrice={priceStats.max}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearAllFilters}
            filteredCount={metadata.total}
          />
        </div>

        <div className={cn("transition-all duration-300", isPending && "opacity-50 pointer-events-none grayscale-[0.5]")}>
          <div className="mt-2">
            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{(t("products.deleteConfirmTitle") as string) || "Emin misiniz?"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {(t("products.deleteConfirmDesc", { count: selectedIds.length }) as string) || `Secili ${selectedIds.length} urunu silmek uzereisiniz.`}
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
              onProductsReorder={(newProducts: Product[]) => handleTableReorder(newProducts)}
              onReorderSuccess={async () => {
                // no-op: controller refreshes where needed
              }}
            />
          </div>

          <ProductsPagination
            currentPage={currentPage}
            totalPages={totalPagesCount}
            itemsPerPage={itemsPerPage}
            totalItems={metadata.total}
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
