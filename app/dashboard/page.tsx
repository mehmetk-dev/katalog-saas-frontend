import { Metadata } from "next"
import { getCurrentUser } from "@/lib/actions/auth"
import { getCatalogs, getDashboardStats } from "@/lib/actions/catalogs"
import { getProducts } from "@/lib/actions/products"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export const metadata: Metadata = {
  title: "Panel",
  description: "Kataloglarınızı, ürünlerinizi ve istatistiklerinizi yönetin.",
}

export default async function DashboardPage() {
  const [user, catalogs, products, stats] = await Promise.all([
    getCurrentUser(),
    getCatalogs(),
    getProducts(),
    getDashboardStats(),
  ])

  return <DashboardClient
    initialCatalogs={catalogs}
    initialProducts={products}
    initialStats={stats}
  />
}

