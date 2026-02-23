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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; category?: string; search?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || "1") || 1)
  const limit = Math.min(1000, Math.max(1, parseInt(params.limit || "12") || 12))
  const category = params.category || "all"
  const search = params.search || ""

  const [productsResponse, statsResponse, user] = await Promise.all([
    getProducts({ page, limit, category, search }),
    getProductStats(),
    getCurrentUser(),
  ])

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
