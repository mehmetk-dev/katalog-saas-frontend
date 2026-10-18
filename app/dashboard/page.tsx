import { getCatalogs, getDashboardStats } from "@/lib/actions/catalogs"
import { getProducts, getProductsByIds } from "@/lib/actions/products"
import { pickRecentCatalogs } from "@/components/dashboard/recent-catalogs"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

import { SEO_CONFIG } from "@/lib/services/seo"

export const metadata = SEO_CONFIG.dashboard

export default async function DashboardPage() {
  const catalogsPromise = getCatalogs()
  const [catalogs, productsResponse, stats, catalogPreviewImages] = await Promise.all([
    catalogsPromise,
    // Yalnızca toplam ürün sayısı gerekiyor
    getProducts({ limit: 1 }),
    // Analitik alınamazsa ana sayfa yine açılsın
    getDashboardStats().catch(() => null),
    // Katalog listesi gelir gelmez istenir; istatistiklerin bitmesini beklemez
    catalogsPromise.then(getCatalogPreviewImages, () => ({})),
  ])

  return (
    <DashboardClient
      initialCatalogs={catalogs}
      totalProductCount={productsResponse.metadata.total}
      initialStats={stats}
      catalogPreviewImages={catalogPreviewImages}
    />
  )
}

/**
 * Son kataloglar listesinde kapak görseli olmayanlar için ilk ürünün görseli.
 * Yalnızca listede görünen (en fazla 5) kataloğun ilk ürünü çekilir; hata olursa önizlemesiz devam edilir.
 */
async function getCatalogPreviewImages(catalogs: Awaited<ReturnType<typeof getCatalogs>>): Promise<Record<string, string>> {
  const firstProductByCatalog = new Map<string, string>()
  for (const catalog of pickRecentCatalogs(Array.isArray(catalogs) ? catalogs : [])) {
    const firstId = catalog.product_ids?.[0]
    if (!catalog.cover_image_url && firstId) firstProductByCatalog.set(catalog.id, firstId)
  }
  if (firstProductByCatalog.size === 0) return {}

  try {
    const products = await getProductsByIds([...new Set(firstProductByCatalog.values())])
    const imageById = new Map(products.map((p) => [p.id, p.image_url || p.images?.[0]]))
    const result: Record<string, string> = {}
    for (const [catalogId, productId] of firstProductByCatalog) {
      const image = imageById.get(productId)
      if (image) result[catalogId] = image
    }
    return result
  } catch {
    return {}
  }
}
