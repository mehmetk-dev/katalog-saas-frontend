import { Suspense } from "react"
import { Metadata } from "next"
import { z } from "zod"

import { getProducts, getProductStats } from "@/lib/actions/products"
import { getCurrentUser } from "@/lib/actions/auth"
import { ProductsPageClient } from "@/components/products/products-page-client"
import { ExcelPageClient } from "@/components/excel/excel-page-client"
import { Skeleton } from "@/components/ui/skeleton"
import { DEFAULT_ITEMS_PER_PAGE, PAGE_SIZE_OPTIONS, mapSortFieldToProductSort, type SortField, type SortOrder, type StockFilter } from "@/components/products/products-page-utils"

export const metadata: Metadata = {
  title: "Ürünler",
  description: "Ürün envanterinizi yönetin, düzenleyin ve kataloglara ekleyin.",
}

const DEFAULT_PRODUCTS_PAGE_SIZE = DEFAULT_ITEMS_PER_PAGE

const searchParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().refine(
    (v) => PAGE_SIZE_OPTIONS.includes(v),
    { message: "Invalid page size" }
  ).default(DEFAULT_PRODUCTS_PAGE_SIZE),
  category: z.string().default("all"),
  search: z.string().default(""),
  stockFilter: z.enum(["all", "in_stock", "low_stock", "out_of_stock"]).default("all"),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(["order", "created_at", "name", "price", "stock", "category"]).default("order"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
})

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string; limit?: string; category?: string; search?: string; stockFilter?: StockFilter; minPrice?: string; maxPrice?: string; sortBy?: SortField; sortOrder?: SortOrder }>
}) {
  const rawParams = await searchParams
  if (rawParams.view === "table") return <ProductsTableView page={rawParams.page} />

  const parsed = searchParamsSchema.safeParse(rawParams)
  const { page, limit, category, search, stockFilter, minPrice, maxPrice, sortBy, sortOrder } = parsed.success
    ? parsed.data
    : { page: 1, limit: DEFAULT_PRODUCTS_PAGE_SIZE, category: "all", search: "", stockFilter: "all" as const, minPrice: undefined, maxPrice: undefined, sortBy: "order" as const, sortOrder: "asc" as const }

  let productsResponse: import('@/lib/actions/products').ProductsResponse = { products: [], metadata: { total: 0, page: 1, limit: DEFAULT_PRODUCTS_PAGE_SIZE, totalPages: 1 } };
  let statsResponse = { total: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };
  let user: { plan?: string; maxProducts?: number } | null = null;

  try {
    const [pRes, sRes, uRes] = await Promise.all([
      getProducts({ page, limit, category, search, stockFilter, minPrice, maxPrice, sortBy: mapSortFieldToProductSort(sortBy), sortOrder }),
      getProductStats(),
      getCurrentUser(),
    ]);
    if (pRes) productsResponse = pRes;
    if (sRes) statsResponse = sRes;
    if (uRes) user = uRes;
  } catch (error) {
    console.error("[ProductsPage] Error fetching data:", error);
  }

  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPageClient
        initialProducts={productsResponse.products}
        initialMetadata={productsResponse.metadata}
        initialStats={statsResponse}
        initialAllCategories={productsResponse.allCategories || []}
        userPlan={(user?.plan as "free" | "plus" | "pro") || "free"}
        maxProducts={user?.maxProducts || 50}
      />
    </Suspense>
  )
}

// Tablo görünümü (eski Excel Düzenleyici): hücre hücre düzenleme, kaydedince toplu yazılır
const TABLE_PAGE_SIZE = 100

async function ProductsTableView({ page: rawPage }: { page?: string }) {
  const requestedPage = Number.parseInt(rawPage || "1", 10)
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

  let productsResponse: import('@/lib/actions/products').ProductsResponse = { products: [], metadata: { total: 0, page: 1, limit: TABLE_PAGE_SIZE, totalPages: 1 } }
  let user: { plan?: string } | null = null

  try {
    const [pRes, uRes] = await Promise.all([getProducts({ page, limit: TABLE_PAGE_SIZE }), getCurrentUser()])
    if (pRes) productsResponse = pRes
    if (uRes) user = uRes
  } catch (error) {
    console.error("[ProductsPage] Error fetching table data:", error)
  }

  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ExcelPageClient
        initialProducts={productsResponse.products}
        initialMetadata={productsResponse.metadata}
        userPlan={(user?.plan as "free" | "plus" | "pro") || "free"}
      />
    </Suspense>
  )
}

function ProductsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
