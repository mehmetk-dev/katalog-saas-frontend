import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Metadata } from "next"

import { getCatalog } from "@/lib/actions/catalogs"
import { getProducts, getProductsByIds, type Product } from "@/lib/actions/products"
import { BuilderPageClient } from "@/components/builder/builder-page-client"
import { BuilderSkeleton } from "./loading"

const BUILDER_INITIAL_PAGE_SIZE = 24
/** Kataloğun ilk bu kadar ürünü sayfayla birlikte gelir (önizlemenin ilk anda dolu açılması için);
 *  kalanı istemcide arka planda yüklenir. */
const BUILDER_SERVER_SELECTED_LIMIT = 1000

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
  // Katalog → seçili ürünler zinciri ile ürün seçicinin ilk sayfası paralel çekilir.
  // Önceden seçili ürünler ancak sayfa açıldıktan sonra istemciden isteniyordu; o arada
  // önizleme boş, "Katalogdaki ürünler" sayısı eksik görünüyordu.
  const catalogPromise = (async () => {
    if (!catalogId) return { catalog: null, selectedProducts: [] as Product[] }
    const catalog = await getCatalog(catalogId)
    const ids = catalog?.product_ids?.slice(0, BUILDER_SERVER_SELECTED_LIMIT) ?? []
    // Başarısız olursa istemci aynı ürünleri kendisi yükler
    const selectedProducts = ids.length > 0 ? await getProductsByIds(ids).catch(() => [] as Product[]) : []
    return { catalog, selectedProducts }
  })()

  const [{ catalog, selectedProducts }, initialProductsResponse] = await Promise.all([
    catalogPromise,
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
      products={mergeProducts(selectedProducts, initialProductsResponse.products || [])}
      initialProductsResponse={initialProductsResponse}
    />
  )
}

function mergeProducts(first: Product[], second: Product[]): Product[] {
  const seen = new Set(first.map((product) => product.id))
  return [...first, ...second.filter((product) => !seen.has(product.id))]
}
