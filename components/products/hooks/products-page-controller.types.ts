import type { Product, ProductStats } from "@/lib/actions/products"
import type { SortField, SortOrder, StockFilter, ViewMode } from "@/components/products/products-page-utils"

export interface ProductsMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductsPageState {
  products: Product[]
  metadata: ProductsMetadata
  stats: ProductStats
  search: string
  showLimitModal: boolean
  showProductModal: boolean
  editingProduct: Product | null
  selectedIds: string[]
  showBulkImageModal: boolean
  showImportModal: boolean
  showFilters: boolean
  showPriceModal: boolean
  showDeleteAlert: boolean
  viewMode: ViewMode
  sortField: SortField
  sortOrder: SortOrder
  stockFilter: StockFilter
  selectedCategory: string
  priceRange: [number, number]
  currentPage: number
  itemsPerPage: number
  priceChangeType: "increase" | "decrease"
  priceChangeMode: "percentage" | "fixed"
  priceChangeAmount: number
}

export interface ProductsPageDerived {
  categories: string[]
  priceStats: { min: number; max: number }
  hasActiveFilters: boolean
  paginatedProducts: Product[]
  totalPagesCount: number
  categoryStats: Array<[string, { count: number; totalValue: number }]>
}
