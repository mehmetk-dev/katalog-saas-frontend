"use client"

import { Package } from "lucide-react"

import { useProductsTable } from "./hooks/use-products-table"
import { ProductGridView } from "./views/product-grid-view"
import { ProductListView } from "./views/product-list-view"
import { type ProductsTableProps } from "./types"

export type { ProductsTableProps }

export function ProductsTable(props: ProductsTableProps) {
  const {
    onEdit,
    viewMode = "list",
  } = props

  const tableState = useProductsTable(props)

  const {
    t,
    filteredProducts,
    allProducts,
  } = tableState

  // Empty state
  if (filteredProducts.length === 0 && allProducts.length === 0) {
    return (
      <div className="border rounded-xl p-12 text-center bg-gradient-to-b from-muted/50 to-transparent">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Package className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{t("products.noProducts")}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t("products.noProductsDesc")}</p>
      </div>
    )
  }

  const viewProps = {
    ...tableState,
    products: props.products,
    onEdit,
  }

  if (viewMode === "grid") {
    return <ProductGridView {...viewProps} />
  }

  return <ProductListView {...viewProps} />
}
