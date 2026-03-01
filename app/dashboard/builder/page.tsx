import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Metadata } from "next"

import { getCatalog } from "@/lib/actions/catalogs"
import { getProducts } from "@/lib/actions/products"
import { BuilderPageClient } from "@/components/builder/builder-page-client"
import { Skeleton } from "@/components/ui/skeleton"

// PERF: Reduced from 10_000 → 2_000. For most users 2K covers all products.
// Users with more products should use search/filter in the editor.
// Backend caps per-page to 1000, so PAGE_SIZE is set to match.
// TODO: Implement server-side search + incremental loading in the builder
//       to avoid sending the full product list in the SSR payload.
const BUILDER_MAX_PRODUCTS = 2_000
const BUILDER_PAGE_SIZE = 1_000

async function getBuilderProducts(maxProducts: number = BUILDER_MAX_PRODUCTS) {
  const firstPage = await getProducts({ page: 1, limit: Math.min(BUILDER_PAGE_SIZE, maxProducts) })

  const firstProducts = firstPage.products || []
  const totalAvailable = firstPage.metadata?.total || firstProducts.length
  const effectivePageSize = firstPage.metadata?.limit || Math.min(BUILDER_PAGE_SIZE, maxProducts)
  const targetCount = Math.min(totalAvailable, maxProducts)
  const totalPagesToFetch = Math.ceil(targetCount / effectivePageSize)

  if (totalPagesToFetch <= 1) {
    return {
      products: firstProducts.slice(0, targetCount),
      totalAvailable,
      isTruncated: totalAvailable > maxProducts,
    }
  }

  const remainingPageRequests = []
  for (let page = 2; page <= totalPagesToFetch; page += 1) {
    remainingPageRequests.push(getProducts({ page, limit: effectivePageSize }))
  }

  const remainingPages = await Promise.all(remainingPageRequests)
  const mergedProducts = [
    ...firstProducts,
    ...remainingPages.flatMap((res) => res.products || []),
  ].slice(0, targetCount)

  return {
    products: mergedProducts,
    totalAvailable,
    isTruncated: totalAvailable > maxProducts,
  }
}

export const metadata: Metadata = {
  title: "Katalog Oluşturucu",
  description: "Sürükle-bırak editörü ile profesyonel kataloglar oluşturun.",
}

interface BuilderPageProps {
  searchParams: Promise<{ id?: string }>
}

// PERF: Page shell renders instantly; data loading streams via Suspense.
// Previously the entire data fetch blocked the page from rendering.
export default async function CatalogBuilderPage({ searchParams }: BuilderPageProps) {
  const params = await searchParams
  const catalogId = params.id

  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <BuilderDataLoader catalogId={catalogId} />
    </Suspense>
  )
}

/** Async server component — handles data fetching inside Suspense boundary.
 *  This lets Next.js stream the skeleton immediately while data loads. */
async function BuilderDataLoader({ catalogId }: { catalogId?: string }) {
  const [catalog, productsPayload] = await Promise.all([
    catalogId ? getCatalog(catalogId) : null,
    getBuilderProducts(),
  ])

  // Eğer ID verilmiş ama katalog bulunamıyorsa, yeni katalog sayfasına yönlendir
  if (catalogId && !catalog) {
    redirect("/dashboard/builder")
  }

  // Check limits if creating new catalog
  if (!catalogId) {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single()
      const plan = (profile?.plan || "free") as "free" | "plus" | "pro"

      const { maxCatalogs } = (await import("@/lib/constants")).getPlanLimits(plan)

      if (Number.isFinite(maxCatalogs)) {
        const { count } = await supabase.from("catalogs").select("id", { count: "exact", head: true }).eq("user_id", user.id)
        if ((count || 0) >= maxCatalogs) {
          redirect("/dashboard/catalogs?limit_reached=true")
        }
      }
    }
  }

  return (
    <BuilderPageClient
      catalog={catalog}
      products={productsPayload.products}
      productTotalCount={productsPayload.totalAvailable}
      isProductListTruncated={productsPayload.isTruncated}
    />
  )
}

function BuilderSkeleton() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6">
      <div className="h-14 border-b bg-background flex items-center justify-between px-4">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="flex-1 flex">
        <div className="w-1/2 border-r p-6">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="w-1/2 p-6">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  )
}
