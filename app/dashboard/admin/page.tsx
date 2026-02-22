import { redirect } from "next/navigation"

// Old admin path — redirect to new /admin
export default function LegacyAdminPage() {
    redirect("/admin")
}
