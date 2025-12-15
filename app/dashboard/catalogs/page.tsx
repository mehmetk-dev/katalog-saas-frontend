import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CatalogsPageClient } from "@/components/catalogs/catalogs-page-client"

export default async function CatalogsPage() {
  const supabase = await createServerSupabaseClient()

  // Get current user first
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <CatalogsPageClient initialCatalogs={[]} userProducts={[]} userPlan="free" />
  }

  // CRITICAL: Filter by user_id for data isolation!
  const { data: catalogs } = await supabase
    .from("catalogs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", user.id)

  const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single()
  const userPlan = (profile?.plan || "free") as "free" | "plus" | "pro"

  return <CatalogsPageClient initialCatalogs={catalogs || []} userProducts={products || []} userPlan={userPlan} />
}
