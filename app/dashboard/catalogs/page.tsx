import { Metadata } from "next"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CatalogsPageClient } from "@/components/catalogs/catalogs-page-client"
import type { Product } from "@/lib/actions/products"

export const metadata: Metadata = {
  title: "Kataloglar",
  description: "Oluşturduğunuz tüm katalogları yönetin, düzenleyin ve paylaşın.",
}

export default async function CatalogsPage() {
  const supabase = await createServerSupabaseClient()

  // Get current user first
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <CatalogsPageClient initialCatalogs={[]} userProducts={[]} userPlan="free" />
  }

  // CRITICAL: Filter by user_id for data isolation!
  // PERF: Run all 3 queries in parallel instead of sequentially
  const [catalogsResult, productsResult, profileResult] = await Promise.all([
    supabase
      .from("catalogs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id,name,price,image_url,images,category,description,sku,product_url,custom_attributes")
      .eq("user_id", user.id),
    supabase
      .from("users")
      .select("plan")
      .eq("id", user.id)
      .single(),
  ])

  const userPlan = (profileResult.data?.plan || "free") as "free" | "plus" | "pro"

  return <CatalogsPageClient initialCatalogs={catalogsResult.data || []} userProducts={(productsResult.data || []) as Product[]} userPlan={userPlan} />
}
