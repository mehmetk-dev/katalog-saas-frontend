"use client"

import { Button } from "@/components/ui/button"
import { PRODUCT_COLUMNS } from "@/components/products/hooks/use-product-columns"
import { useProductsTable } from "./hooks/use-products-table"
import { useProductCatalogs } from "./hooks/use-product-catalogs"
import { ProductGridView } from "./views/product-grid-view"
import { ProductListView } from "./views/product-list-view"
import { type ProductsPageSelection, type ProductsTableProps } from "./types"

export type { ProductsTableProps }

export function ProductsTable(props: ProductsTableProps) {
  const { onEdit, viewMode = "list", products, selectedIds, onSelectedIdsChange, selectAll, visibleColumns = PRODUCT_COLUMNS, onInlineUpdate } = props
  const tableState = useProductsTable(props)
  const productCatalogs = useProductCatalogs(
    products.map((p) => p.id),
    viewMode === "list" && visibleColumns.includes("catalogs"),
  )

  // Boş/sonuçsuz durumlar sayfa seviyesinde (ProductsPageClient) ele alınır
  if (products.length === 0) return null

  const selected = new Set(selectedIds)
  const pageIds = products.map((p) => p.id)
  const selectedOnPage = pageIds.filter((id) => selected.has(id)).length
  const pageSelection: ProductsPageSelection = {
    checked: selectedOnPage === 0 ? false : selectedOnPage === pageIds.length ? true : "indeterminate",
    onToggle: (checked) => {
      if (checked) onSelectedIdsChange([...selectedIds, ...pageIds.filter((id) => !selected.has(id))])
      else onSelectedIdsChange(selectedIds.filter((id) => !pageIds.includes(id)))
    },
  }

  const viewProps = {
    ...tableState,
    products,
    onEdit,
    sort: props.sort,
    pageSelection,
    visibleColumns,
    productCatalogs,
    onInlineUpdate,
  }
  const t = tableState.t

  // Gmail düzeni: sayfanın tamamı seçilince filtreye uyan tüm ürünleri seçme önerisi
  const showSelectAllBanner = !!selectAll && selectedOnPage === pageIds.length && selectAll.totalCount > pageIds.length
  const everythingSelected = !!selectAll && selectedIds.length >= selectAll.totalCount

  return (
    <>
      {showSelectAllBanner && (
        <div role="status" className="mb-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
          {everythingSelected ? (
            <>
              <span>{t("products.allMatchingSelected", { count: selectAll.totalCount })}</span>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => onSelectedIdsChange([])}>
                {t("products.clearSelection")}
              </Button>
            </>
          ) : (
            <>
              <span>{t("products.pageSelected", { count: pageIds.length })}</span>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => selectAll.onSelectAll(true)}>
                {t("products.selectAllMatching", { count: selectAll.totalCount })}
              </Button>
            </>
          )}
        </div>
      )}
      {viewMode === "grid" ? <ProductGridView {...viewProps} /> : <ProductListView {...viewProps} />}
    </>
  )
}
