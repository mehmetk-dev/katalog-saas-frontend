import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Metadata } from "next"

import { getPublicCatalog, getPublicCatalogMeta } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"

import { PublicCatalogClient } from "./public-catalog-client"
import CatalogLoading from "./loading"


interface PublicCatalogPageProps {
  params: Promise<{ slug: string }>
}

// Lightweight metadata — only fetches catalog name/description, no products
export async function generateMetadata({ params }: PublicCatalogPageProps): Promise<Metadata> {
  const { slug } = await params
  const meta = await getPublicCatalogMeta(slug)

  if (!meta) {
    return { title: "Katalog Bulunamadı" }
  }

  return {
    title: meta.name,
    description: meta.description || `${meta.name} kataloğunu görüntüleyin`,
    robots: meta.show_in_search === false ? { index: false, follow: true } : undefined,
    openGraph: {
      title: meta.name,
      description: meta.description || undefined,
    },
  }
}

// Heavy component — fetches full catalog with products
async function CatalogContent({ slug }: { slug: string }) {
  const catalog = await getPublicCatalog(slug)

  if (!catalog || !catalog.is_published) {
    notFound()
  }

  const products = (catalog.products as Product[]) || []

  return (
    <PublicCatalogClient
      catalog={catalog}
      products={products}
    />
  )
}

export default async function PublicCatalogPage({ params }: PublicCatalogPageProps) {
  const { slug } = await params

  return (
    <Suspense fallback={<CatalogLoading />}>
      <CatalogContent slug={slug} />
    </Suspense>
  )
}
