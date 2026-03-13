import type { Product, ProductStats } from "@/lib/actions/products"

export type SortField = "name" | "price" | "stock" | "created_at" | "category" | "order"
export type SortOrder = "asc" | "desc"
export type ViewMode = "grid" | "list"
export type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"

export const DEFAULT_ITEMS_PER_PAGE = 12
export const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 100]

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
