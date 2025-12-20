import { Suspense } from "react"
import { redirect } from "next/navigation"

import { getCatalog } from "@/lib/actions/catalogs"
import { getProducts } from "@/lib/actions/products"
import { BuilderPageClient } from "@/components/builder/builder-page-client"
import { Skeleton } from "@/components/ui/skeleton"

interface BuilderPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function CatalogBuilderPage({ searchParams }: BuilderPageProps) {
  const params = await searchParams
  const catalogId = params.id

  const [catalog, products] = await Promise.all([
    catalogId ? getCatalog(catalogId) : null,
    getProducts()
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

      if (plan === "free") {
        const { count } = await supabase.from("catalogs").select("*", { count: "exact", head: true }).eq("user_id", user.id)
        if ((count || 0) >= 1) {
          redirect("/dashboard/catalogs?limit_reached=true")
        }
      }
      // Add similar checks for plus plan if needed
      if (plan === "plus") {
        const { count } = await supabase.from("catalogs").select("*", { count: "exact", head: true }).eq("user_id", user.id)
        if ((count || 0) >= 10) {
          redirect("/dashboard/catalogs?limit_reached=true")
        }
      }
    }
  }

  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <BuilderPageClient catalog={catalog} products={products} />
    </Suspense>
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
