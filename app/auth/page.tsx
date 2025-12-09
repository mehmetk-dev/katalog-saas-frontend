import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthPageClient } from "@/components/auth/auth-page-client"

export default async function AuthPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  /*
  if (user) {
    redirect("/dashboard")
  }
  */

  return <AuthPageClient />
}
