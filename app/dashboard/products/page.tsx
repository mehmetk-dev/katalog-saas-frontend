import { Suspense } from "react"
import { Metadata } from "next"
import { z } from "zod"

import { getProducts, getProductStats } from "@/lib/actions/products"
import { getCurrentUser } from "@/lib/actions/auth"
import { ProductsPageClient } from "@/components/products/products-page-client"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Ürünler",
  description: "Ürün envanterinizi yönetin, düzenleyin ve kataloglara ekleyin.",
}

const DEFAULT_PRODUCTS_PAGE_SIZE = 12
const PRODUCTS_PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 100] as const

const searchParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().refine(
    (v) => PRODUCTS_PAGE_SIZE_OPTIONS.includes(v as (typeof PRODUCTS_PAGE_SIZE_OPTIONS)[number]),
    { message: "Invalid page size" }
  ).default(DEFAULT_PRODUCTS_PAGE_SIZE),
  category: z.string().default("all"),
  search: z.string().default(""),
})

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; category?: string; search?: string }>
}) {
  const rawParams = await searchParams
  const parsed = searchParamsSchema.safeParse(rawParams)
  const { page, limit, category, search } = parsed.success ? parsed.data : { page: 1, limit: DEFAULT_PRODUCTS_PAGE_SIZE, category: "all", search: "" }

  let productsResponse: import('@/lib/actions/products').ProductsResponse = { products: [], metadata: { total: 0, page: 1, limit: DEFAULT_PRODUCTS_PAGE_SIZE, totalPages: 1 } };
  let statsResponse = { total: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };
  let user: { plan?: string; maxProducts?: number } | null = null;

  try {
    const [pRes, sRes, uRes] = await Promise.all([
      getProducts({ page, limit, category, search }),
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
