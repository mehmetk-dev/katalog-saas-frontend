import type { Product, ProductSortField, ProductStats } from "@/lib/actions/products"

export type SortField = "name" | "price" | "stock" | "created_at" | "category" | "order"
export type SortOrder = "asc" | "desc"
export type ViewMode = "grid" | "list"
export type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"

export const DEFAULT_ITEMS_PER_PAGE = 12
export const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 100]

const SORT_FIELDS: SortField[] = ["name", "price", "stock", "created_at", "category", "order"]
const STOCK_FILTERS: StockFilter[] = ["all", "in_stock", "low_stock", "out_of_stock"]

export function mapSortFieldToProductSort(sortField: SortField): ProductSortField {
  return sortField === "order" ? "display_order" : sortField
}

export function parseSortFieldFromQuery(value: string | null): SortField {
  return SORT_FIELDS.includes(value as SortField) ? (value as SortField) : "order"
}

export function parseSortOrderFromQuery(value: string | null): SortOrder {
  return value === "desc" ? "desc" : "asc"
}

export function parseStockFilterFromQuery(value: string | null): StockFilter {
  return STOCK_FILTERS.includes(value as StockFilter) ? (value as StockFilter) : "all"
}

export function parsePriceFromQuery(value: string | null): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function buildProductOrderPayload(products: Product[], reorderOffset = 0): { id: string; order: number }[] {
  const existingOrders = products
    .map((product) => Number(product.order))
    .filter((order) => Number.isInteger(order) && order >= 0)
  const hasUsableOrders = existingOrders.length === products.length && new Set(existingOrders).size === existingOrders.length && existingOrders.some((order) => order > 0)
  const orderSlots = hasUsableOrders ? [...existingOrders].sort((a, b) => a - b) : []

  return products.map((product, index) => ({
    id: product.id,
    order: orderSlots[index] ?? reorderOffset + index,
  }))
}

/** CSV formula injection protection for cells starting with risky prefixes. */
export function sanitizeCsvCell(value: string): string {
  const trimmed = value.trim()
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`
  }
  return trimmed
}

/** Calculate stats delta for newly added products. */
export function calculateStatsDelta(productList: Product[]): Omit<ProductStats, "totalValue"> & { totalValue: number } {
  let inStock = 0
  let lowStock = 0
  let outOfStock = 0
  let totalValue = 0

  productList.forEach((p) => {
    const stock = typeof p.stock === "number" ? p.stock : parseInt(String(p.stock || 0))
    const price = typeof p.price === "number" ? p.price : parseFloat(String(p.price || 0))

    if (stock >= 10) inStock++
    else if (stock > 0 && stock < 10) lowStock++
    else outOfStock++

    totalValue += stock * price
  })

  return { total: productList.length, inStock, lowStock, outOfStock, totalValue }
}

export function parsePageFromQuery(value: string | null): number {
  const parsed = Number.parseInt(value || "1", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function parseLimitFromQuery(value: string | null): number {
  const parsed = Number.parseInt(value || String(DEFAULT_ITEMS_PER_PAGE), 10)
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_ITEMS_PER_PAGE
}
