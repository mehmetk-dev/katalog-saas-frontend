import { getCatalogs, getDashboardStats } from "@/lib/actions/catalogs"
import { getProducts } from "@/lib/actions/products"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

import { SEO_CONFIG } from "@/lib/services/seo"

export const metadata = SEO_CONFIG.dashboard

export default async function DashboardPage() {
  const [catalogs, productsResponse, stats] = await Promise.all([
    getCatalogs(),
    // Yalnızca toplam ürün sayısı gerekiyor
    getProducts({ limit: 1 }),
    // Analitik alınamazsa ana sayfa yine açılsın
    getDashboardStats().catch(() => null),
  ])

  return (
    <DashboardClient
      initialCatalogs={catalogs}
      totalProductCount={productsResponse.metadata.total}
      initialStats={stats}
    />
  )
}
