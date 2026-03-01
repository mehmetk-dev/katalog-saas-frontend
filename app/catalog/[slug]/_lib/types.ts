import type { Product } from "@/lib/actions/products"

export type CatalogPage =
    | { type: 'cover' }
    | { type: 'divider'; categoryName: string; firstProductImage: string | null }
    | { type: 'products'; products: Product[]; pageNumber: number; totalPages: number }
