import { notFound } from "next/navigation"
import { Metadata } from "next"

import { getPublicCatalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"

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
    title: catalog.name,
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

  // Tipi burada kesinleştirerek derleyiciyi rahatlatalım (Explicit casting)
  const products = (catalog.products as Product[]) || []

  return (
    <PublicCatalogClient
      catalog={catalog}
      products={products}
    />
  )
}
