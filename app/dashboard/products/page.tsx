import { Suspense } from "react"
import { Metadata } from "next"

import { getProducts, getProductStats } from "@/lib/actions/products"
import { getCurrentUser } from "@/lib/actions/auth"
import { ProductsPageClient } from "@/components/products/products-page-client"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Ürünler",
  description: "Ürün envanterinizi yönetin, düzenleyin ve kataloglara ekleyin.",
}

const DEFAULT_PRODUCTS_PAGE_SIZE = 12
const PRODUCTS_PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 100]

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; category?: string; search?: string }>
}) {
  const params = await searchParams
  const requestedPage = Number.parseInt(params.page || "1", 10)
  const requestedLimit = Number.parseInt(params.limit || String(DEFAULT_PRODUCTS_PAGE_SIZE), 10)

  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const limit = PRODUCTS_PAGE_SIZE_OPTIONS.includes(requestedLimit)
    ? requestedLimit
    : DEFAULT_PRODUCTS_PAGE_SIZE
  const category = params.category || "all"
  const search = params.search || ""

  let productsResponse: import('@/lib/actions/products').ProductsResponse = { products: [], metadata: { total: 0, page: 1, limit: DEFAULT_PRODUCTS_PAGE_SIZE, totalPages: 1 } };
  let statsResponse = { total: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };
  let user: any = null;

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
