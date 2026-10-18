import type { Product, ProductMove, ProductSortField, ProductStats } from "@/lib/actions/products"
import { parseLocalizedNumber } from "@/lib/utils/number-input"

export type SortField = "name" | "price" | "stock" | "created_at" | "category" | "order"
export type SortOrder = "asc" | "desc"
export type ViewMode = "grid" | "list"
/** "table" ayrı bir ekran (?view=table): hücre hücre düzenleme + AI toplu işlem */
export type ProductsView = ViewMode | "table"
export const PRODUCTS_TABLE_HREF = "/dashboard/products?view=table"
/** Liste/ızgara tercihi; tablodan dönüşte de buradan okunur */
export const PRODUCTS_VIEW_MODE_STORAGE_KEY = "products-view-mode"
export type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"

// 24: grid görünümünün 2/3/4/6 sütunlu düzenlerinde son satır boş kalmaz
export const DEFAULT_ITEMS_PER_PAGE = 24
export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96]

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

/**
 * Fiyat filtresi kutusundaki metni sayıya çevirir (0 = sınır yok). Türkçe yazım desteklenir:
 * "1.500" → 1500, "1.500,50" → 1500.5 (Number("1.500") 1,5 TL'ye filtreliyordu).
 */
export function parsePriceFilterInput(value: string, language: string = "tr"): number {
  const parsed = parseLocalizedNumber(value, language)
  return parsed !== null && parsed > 0 ? parsed : 0
}

/** [min, max] aralığını düzeltir: ikisi de girilmiş ve ters ise yer değiştirir (0 = sınır yok) */
export function normalizePriceRange([min, max]: [number, number]): [number, number] {
  return min > 0 && max > 0 && min > max ? [max, min] : [min, max]
}

/** Manuel sıra her zaman artandır; URL'de "order + desc" gelse bile artan kabul edilir. */
export function normalizeSortOrder(sortField: SortField, sortOrder: SortOrder): SortOrder {
  return sortField === "order" ? "asc" : sortOrder
}

/** Sütun başlığına tıklama döngüsü: artan → azalan → manuel sıra. */
export function nextColumnSort(current: { field: SortField; order: SortOrder }, column: SortField): { field: SortField; order: SortOrder } {
  if (current.field !== column) return { field: column, order: defaultSortOrder(column) }
  const firstOrder = defaultSortOrder(column)
  if (current.order === firstOrder) return { field: column, order: firstOrder === "asc" ? "desc" : "asc" }
  return { field: "order", order: "asc" }
}

/** Metin sütunları A→Z, sayısal/tarih sütunları büyükten küçüğe başlar. */
export function defaultSortOrder(field: SortField): SortOrder {
  return field === "order" || field === "name" || field === "category" ? "asc" : "desc"
}

/**
 * Sunucudaki taşımanın görünen sayfaya iyimser yansıması.
 * first/last: ürün bu sayfada kalıyorsa başa/sona alınır, başka sayfaya gidiyorsa listeden çıkar
 * (yenileme sonrası sunucudan doğru sayfa gelir).
 */
export function applyLocalMove(
  products: Product[],
  move: ProductMove,
  page: { isFirst: boolean; isLast: boolean }
): Product[] {
  const source = products.find((p) => p.id === move.id)
  if (!source) return products
  const rest = products.filter((p) => p.id !== move.id)

  if (move.position === "first") return page.isFirst ? [source, ...rest] : rest
  if (move.position === "last") return page.isLast ? [...rest, source] : rest

  const targetIndex = rest.findIndex((p) => p.id === move.targetId)
  if (targetIndex === -1) return products
  const insertAt = move.position === "before" ? targetIndex : targetIndex + 1
  return [...rest.slice(0, insertAt), source, ...rest.slice(insertAt)]
}

/**
 * Sürüklenen ürünü hedefin önüne mi arkasına mı bırakacağımızı belirler.
 * Yukarıdan aşağı taşırken hedefin arkasına, aşağıdan yukarı taşırken önüne gider
 * (imleç konumu verilirse o kazanır).
 */
export function resolveDropPosition(
  products: Product[],
  sourceId: string,
  targetId: string,
  pointerAfterMidpoint?: boolean
): "before" | "after" {
  if (pointerAfterMidpoint !== undefined) return pointerAfterMidpoint ? "after" : "before"
  const sourceIndex = products.findIndex((p) => p.id === sourceId)
  const targetIndex = products.findIndex((p) => p.id === targetId)
  return sourceIndex !== -1 && sourceIndex < targetIndex ? "after" : "before"
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
