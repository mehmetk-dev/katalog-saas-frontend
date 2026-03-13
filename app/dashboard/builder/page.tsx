import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Metadata } from "next"

import { getCatalog } from "@/lib/actions/catalogs"
import { getProducts } from "@/lib/actions/products"
import { BuilderPageClient } from "@/components/builder/builder-page-client"
import { Skeleton } from "@/components/ui/skeleton"

const BUILDER_INITIAL_PAGE_SIZE = 24

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
  const [catalog, initialProductsResponse] = await Promise.all([
    catalogId ? getCatalog(catalogId) : null,
    getProducts({ page: 1, limit: BUILDER_INITIAL_PAGE_SIZE }),
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
      products={initialProductsResponse.products || []}
      initialProductsResponse={initialProductsResponse}
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
