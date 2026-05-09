import { Metadata } from "next"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CatalogsPageClient } from "@/components/catalogs/catalogs-page-client"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"

const CATALOG_PRODUCT_SELECT = "id,name,price,image_url,images,category,description,sku,product_url,custom_attributes"
const PRODUCT_ID_CHUNK_SIZE = 75

export const metadata: Metadata = {
  title: "Kataloglar",
  description: "Oluşturduğunuz tüm katalogları yönetin, düzenleyin ve paylaşın.",
}

async function fetchCatalogProducts(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  catalogs: Catalog[],
): Promise<Product[]> {
  const productIds = Array.from(new Set(
    catalogs.flatMap((catalog) => Array.isArray(catalog.product_ids) ? catalog.product_ids : [])
  ))

  if (productIds.length === 0) return []

  const products: Product[] = []
  for (let i = 0; i < productIds.length; i += PRODUCT_ID_CHUNK_SIZE) {
    const chunk = productIds.slice(i, i + PRODUCT_ID_CHUNK_SIZE)
    const { data, error } = await supabase
      .from("products")
      .select(CATALOG_PRODUCT_SELECT)
      .eq("user_id", userId)
      .in("id", chunk)

    if (error) throw error
    products.push(...((data || []) as Product[]))
  }

  return products
}

export default async function CatalogsPage() {
  const supabase = await createServerSupabaseClient()

  // Get current user first
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <CatalogsPageClient initialCatalogs={[]} userProducts={[]} userPlan="free" />
  }

  // CRITICAL: Filter by user_id for data isolation!
  const [catalogsResult, profileResult] = await Promise.all([
    supabase
      .from("catalogs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("plan")
      .eq("id", user.id)
      .single(),
  ])

  const userPlan = (profileResult.data?.plan || "free") as "free" | "plus" | "pro"
  const catalogs = (catalogsResult.data || []) as Catalog[]
  const catalogProducts = await fetchCatalogProducts(supabase, user.id, catalogs)

  return <CatalogsPageClient initialCatalogs={catalogs} userProducts={catalogProducts} userPlan={userPlan} />
}
