import { redirect } from "next/navigation"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { AdminDashboardClient } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/admin/login")
    }

    const { data: profile } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single()

    if (!profile?.is_admin) {
        redirect("/admin/login")
    }

    return <AdminDashboardClient />
}
