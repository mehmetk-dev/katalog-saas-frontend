import { Metadata } from "next"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSessionUser } from "@/lib/supabase/session-user"
import { CatalogsPageClient } from "@/components/catalogs/catalogs-page-client"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import { getPlanLimits, type PlanType } from "@/lib/constants"

const CATALOG_PRODUCT_SELECT = "id,name,price,image_url,images,category,description,sku,product_url,custom_attributes"
const PRODUCT_ID_CHUNK_SIZE = 75
/** Kart önizlemesi yalnızca ilk sayfayı gösterir */
const PREVIEW_PRODUCTS_PER_CATALOG = 6

export const metadata: Metadata = {
  title: "Kataloglar",
  description: "Oluşturduğunuz tüm katalogları yönetin, düzenleyin ve paylaşın.",
}

async function fetchPreviewProducts(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  catalogs: Catalog[],
): Promise<Product[]> {
  const productIds = Array.from(new Set(
    catalogs.flatMap((catalog) =>
      Array.isArray(catalog.product_ids) ? catalog.product_ids.slice(0, PREVIEW_PRODUCTS_PER_CATALOG) : []
    )
  ))

  if (productIds.length === 0) return []

  const chunks: string[][] = []
  for (let i = 0; i < productIds.length; i += PRODUCT_ID_CHUNK_SIZE) {
    chunks.push(productIds.slice(i, i + PRODUCT_ID_CHUNK_SIZE))
  }

  const results = await Promise.all(chunks.map(async (chunk) => {
    const { data, error } = await supabase
      .from("products")
      .select(CATALOG_PRODUCT_SELECT)
      .eq("user_id", userId)
      .in("id", chunk)

    if (error) throw error
    return (data || []) as Product[]
  }))

  return results.flat()
}

export default async function CatalogsPage() {
  const supabase = await createServerSupabaseClient()

  const { user } = await getSessionUser(supabase)

  if (!user) {
    return <CatalogsPageClient initialCatalogs={[]} userProducts={[]} userPlan="free" />
  }

  // CRITICAL: Filter by user_id for data isolation!
  const [catalogsResult, profileResult] = await Promise.all([
    supabase
      .from("catalogs")
      .select("*")
      .eq("user_id", user.id)
      // Backend'deki plan kilidi (is_disabled) bu sıraya göre hesaplanır; aynı sıra kullanılmalı
      .order("updated_at", { ascending: false }),
    supabase
      .from("users")
      .select("plan")
      .eq("id", user.id)
      .single(),
  ])

  const userPlan = (profileResult.data?.plan || "free") as PlanType
  const { maxCatalogs } = getPlanLimits(userPlan)
  // Plan düşürülünce limit dışında kalan kataloglar düzenlenemez/yayınlanamaz (backend 403 döner)
  const catalogs = ((catalogsResult.data || []) as Catalog[]).map((catalog, index) => ({
    ...catalog,
    is_disabled: index >= maxCatalogs,
  }))
  const previewProducts = await fetchPreviewProducts(supabase, user.id, catalogs)
  // Kart yalnızca ürün sayısını ve ilk sayfanın ürünlerini kullanır; tam diziyi (10 bin ürünlü
  // katalogda ~400 KB) tarayıcıya göndermeye gerek yok
  const listCatalogs = catalogs.map((catalog) => {
    const productIds = Array.isArray(catalog.product_ids) ? catalog.product_ids : []
    return { ...catalog, product_ids: productIds.slice(0, PREVIEW_PRODUCTS_PER_CATALOG), product_count: new Set(productIds).size }
  })

  return <CatalogsPageClient initialCatalogs={listCatalogs} userProducts={previewProducts} userPlan={userPlan} />
}
