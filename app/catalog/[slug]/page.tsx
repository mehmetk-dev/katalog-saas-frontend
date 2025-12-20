import { notFound } from "next/navigation"
import { Metadata } from "next"

import { getPublicCatalog } from "@/lib/actions/catalogs"
import { createClient } from "@/lib/supabase/server"

import { PublicCatalogClient } from "./public-catalog-client"


interface PublicCatalogPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PublicCatalogPageProps): Promise<Metadata> {
  const { slug } = await params
  const catalog = await getPublicCatalog(slug)

  if (!catalog) {
    return { title: "Katalog Bulunamadı" }
  }

  return {
    title: `${catalog.name} | CatalogPro`,
    description: catalog.description || `${catalog.name} kataloğunu görüntüleyin`,
    openGraph: {
      title: catalog.name,
      description: catalog.description || undefined,
    },
  }
}

export default async function PublicCatalogPage({ params }: PublicCatalogPageProps) {
  const { slug } = await params
  const catalog = await getPublicCatalog(slug)

  if (!catalog) {
    notFound()
  }

  // Katalog yayınlanmamışsa 404
  if (!catalog.is_published) {
    notFound()
  }

  // Ürünleri getir
  const supabase = await createClient()
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", catalog.product_ids || [])

  // Ürünleri catalog.product_ids sırasına göre sırala
  const orderedProducts = catalog.product_ids
    ?.map(id => products?.find(p => p.id === id))
    .filter(Boolean) || []

  return (
    <PublicCatalogClient
      catalog={catalog}
      products={orderedProducts}
    />
  )
}
