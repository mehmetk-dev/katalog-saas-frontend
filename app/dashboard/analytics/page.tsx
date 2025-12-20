import { getDashboardStats } from "@/lib/actions/catalogs"
import { AnalyticsClient } from "@/components/analytics/analytics-client"
import { getCatalogs } from "@/lib/actions/catalogs"

export default async function AnalyticsPage() {
    const [stats, catalogs] = await Promise.all([
        getDashboardStats(),
        getCatalogs()
    ])

    return <AnalyticsClient stats={stats} catalogs={catalogs} />
}
