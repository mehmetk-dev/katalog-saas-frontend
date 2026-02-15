import { getCatalogs, getDashboardStats } from "@/lib/actions/catalogs"
import { getProducts } from "@/lib/actions/products"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

import { SEO_CONFIG } from "@/lib/seo"

export const metadata = SEO_CONFIG.dashboard

export default async function DashboardPage() {
  const [catalogs, productsResponse, stats] = await Promise.all([
    getCatalogs(),
    getProducts({ limit: 4 }),
    getDashboardStats(),
  ])

  return (
    <DashboardClient
      initialCatalogs={catalogs}
      initialProducts={productsResponse.products}
      totalProductCount={productsResponse.metadata.total}
      initialStats={stats}
    />
  )
}


