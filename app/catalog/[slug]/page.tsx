import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Metadata } from "next"

import { getPublicCatalog, getPublicCatalogMeta } from "@/lib/actions/catalogs"
import { getCatalogShareUrl } from "@/lib/catalog-url"
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
    return { title: "Katalog Bulunamadı", robots: { index: false, follow: false } }
  }

  const description = meta.description || `${meta.name} kataloğunu görüntüleyin`
  const url = getCatalogShareUrl(slug)
  // Paylaşım önizlemesi (WhatsApp, LinkedIn...) için kapak > logo > site varsayılanı.
  // openGraph alt sayfada tamamen ezildiği için varsayılan görsel de burada verilmeli.
  const image = meta.cover_image_url || meta.logo_url || "/og-image.webp"

  return {
    title: meta.name,
    description,
    alternates: { canonical: url },
    robots: meta.show_in_search === false ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url,
      title: meta.name,
      description,
      images: [{ url: image, alt: meta.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.name,
      description,
      images: [image],
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
