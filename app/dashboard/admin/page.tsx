import { redirect } from "next/navigation"

import { checkIsAdmin } from "@/lib/actions/admin"
import { AdminDashboardClient } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
    const isAdmin = await checkIsAdmin()

    if (!isAdmin) {
        redirect("/dashboard")
    }

    return <AdminDashboardClient />
}
