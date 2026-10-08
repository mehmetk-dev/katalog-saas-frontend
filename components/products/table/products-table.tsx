"use client"

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

  const { filteredProducts, allProducts } = tableState

  // Boş/sonuçsuz durumlar sayfa seviyesinde (ProductsPageClient) ele alınır
  if (filteredProducts.length === 0 && allProducts.length === 0) return null

  const viewProps = {
    ...tableState,
    products: props.products,
    onEdit,
    sort: props.sort,
  }

  if (viewMode === "grid") {
    return <ProductGridView {...viewProps} />
  }

  return <ProductListView {...viewProps} />
}
