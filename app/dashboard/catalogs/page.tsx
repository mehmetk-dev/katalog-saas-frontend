import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CatalogsPageClient } from "@/components/catalogs/catalogs-page-client"

export default async function CatalogsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: catalogs } = await supabase.from("catalogs").select("*").order("created_at", { ascending: false })
  const { data: products } = await supabase.from("products").select("*")

  const { data: profile } = await supabase.from("users").select("plan").eq("id", (await supabase.auth.getUser()).data.user?.id).single()
  const userPlan = (profile?.plan || "free") as "free" | "plus" | "pro"

  return <CatalogsPageClient initialCatalogs={catalogs || []} userProducts={products || []} userPlan={userPlan} />
}
