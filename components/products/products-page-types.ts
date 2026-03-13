import type { Product, ProductStats } from "@/lib/actions/products"

export interface ProductsPageClientProps {
  initialProducts: Product[]
  initialMetadata: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  initialStats: ProductStats
  initialAllCategories?: string[]
  userPlan: "free" | "plus" | "pro"
  maxProducts: number
}
