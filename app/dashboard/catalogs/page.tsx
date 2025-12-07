import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CatalogsPageClient } from "@/components/catalogs/catalogs-page-client"

export default async function CatalogsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: catalogs } = await supabase.from("catalogs").select("*").order("created_at", { ascending: false })

  return <CatalogsPageClient initialCatalogs={catalogs || []} />
}
