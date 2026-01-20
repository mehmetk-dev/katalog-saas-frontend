import { Metadata } from "next"

import { getDashboardStats } from "@/lib/actions/catalogs"
import { AnalyticsClient } from "@/components/analytics/analytics-client"
import { getCatalogs } from "@/lib/actions/catalogs"

export const metadata: Metadata = {
    title: "Analitik",
    description: "Katalog performansınızı ve ziyaretçi istatistiklerinizi takip edin.",
}

export default async function AnalyticsPage() {
    const [stats, catalogs] = await Promise.all([
        getDashboardStats(),
        getCatalogs()
    ])

    return <AnalyticsClient stats={stats} catalogs={catalogs} />
}
