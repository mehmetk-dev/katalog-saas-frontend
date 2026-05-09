"use client"

import { useEffect, useMemo } from "react"
import React from "react"
import type { ComponentType } from "react"

import type { Product } from "@/lib/actions/products"
import { UserProvider, type User } from "@/lib/contexts/user-context"
import type { TemplateProps } from "@/components/catalogs/templates/types"
import { getItemsPerPage } from "@/lib/constants"

// Static imports — no lazy loading, no ssr:false
// Templates MUST be statically imported so Playwright can render them immediately
import { CoverPage } from "@/components/catalogs/cover-page"
import { CategoryDivider } from "@/components/catalogs/category-divider"

import { ModernGridTemplate } from "@/components/catalogs/templates/modern-grid"
import { CompactListTemplate } from "@/components/catalogs/templates/compact-list"
import { MagazineTemplate } from "@/components/catalogs/templates/magazine"
import { MinimalistTemplate } from "@/components/catalogs/templates/minimalist"
import { BoldTemplate } from "@/components/catalogs/templates/bold"
import { ElegantCardsTemplate } from "@/components/catalogs/templates/elegant-cards"
import { ClassicCatalogTemplate } from "@/components/catalogs/templates/classic-catalog"
import { ShowcaseTemplate } from "@/components/catalogs/templates/showcase"
import { CatalogProTemplate } from "@/components/catalogs/templates/catalog-pro"
import { RetailTemplate } from "@/components/catalogs/templates/retail"
import { TechModernTemplate } from "@/components/catalogs/templates/tech-modern"
import { FashionLookbookTemplate } from "@/components/catalogs/templates/fashion-lookbook"
import { IndustrialTemplate } from "@/components/catalogs/templates/industrial"
import { LuxuryTemplate } from "@/components/catalogs/templates/luxury"
import { CleanWhiteTemplate } from "@/components/catalogs/templates/clean-white"
import { ProductTilesTemplate } from "@/components/catalogs/templates/product-tiles"

const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
  'modern-grid': ModernGridTemplate,
  'compact-list': CompactListTemplate,
  'list': CompactListTemplate,
  'magazine': MagazineTemplate,
  'minimalist': MinimalistTemplate,
  'minimal-gallery': MinimalistTemplate,
  'bold': BoldTemplate,
  'bold-grid': BoldTemplate,
  'elegant-cards': ElegantCardsTemplate,
  'elegant-showcase': ElegantCardsTemplate,
  'classic-catalog': ClassicCatalogTemplate,
  'classic-list': ClassicCatalogTemplate,
  'showcase': ShowcaseTemplate,
  'catalog-pro': CatalogProTemplate,
  'retail': RetailTemplate,
  'tech-modern': TechModernTemplate,
  'fashion-lookbook': FashionLookbookTemplate,
  'industrial': IndustrialTemplate,
  'luxury': LuxuryTemplate,
  'clean-white': CleanWhiteTemplate,
  'product-tiles': ProductTilesTemplate,
}

// A4 dimensions in pixels at 96 DPI
const A4_WIDTH = 794
const A4_HEIGHT = 1123

type RenderCatalog = Record<string, unknown>

interface PdfExportDocumentProps {
  catalog: RenderCatalog
  products: Product[]
  user: User
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

// -- Page types --
type CatalogPage =
  | { type: 'cover' }
  | { type: 'divider'; categoryName: string; firstProductImage?: string }
  | { type: 'products'; products: Product[]; pageNumber: number; totalPages: number }

function buildPages(
  catalog: RenderCatalog,
  products: Product[],
): CatalogPage[] {
  const layout = stringValue(catalog.layout, 'modern-grid')
  const columnsPerRow = numberValue(catalog.columns_per_row, 3)
  const enableCoverPage = booleanValue(catalog.enable_cover_page, false)
  const enableCategoryDividers = booleanValue(catalog.enable_category_dividers, false)
  const categoryOrder = Array.isArray(catalog.category_order) ? catalog.category_order.map(String) : []

  const itemsPerPage = getItemsPerPage(layout, columnsPerRow)
  const pages: CatalogPage[] = []

  if (enableCoverPage) {
    pages.push({ type: 'cover' })
  }

  const addProductPages = (prods: Product[]) => {
    for (let i = 0; i < prods.length; i += itemsPerPage) {
      pages.push({
        type: 'products',
        products: prods.slice(i, i + itemsPerPage),
        pageNumber: 0,
        totalPages: 0,
      })
    }
  }

  if (enableCategoryDividers && products.length > 0) {
    const grouped = new Map<string, Product[]>()
    for (const product of products) {
      const cat = product.category || 'Kategorisiz'
      const arr = grouped.get(cat)
      if (arr) arr.push(product)
      else grouped.set(cat, [product])
    }

    const keys = Array.from(grouped.keys())
    if (categoryOrder.length > 0) {
      const orderIndex = new Map<string, number>()
      categoryOrder.forEach((k, i) => orderIndex.set(k, i))
      keys.sort((a, b) => {
        const ia = orderIndex.get(a) ?? -1
        const ib = orderIndex.get(b) ?? -1
        if (ia === -1 && ib === -1) return 0
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      })
    }

    for (const categoryName of keys) {
      const prods = grouped.get(categoryName)!
      pages.push({
        type: 'divider',
        categoryName,
        firstProductImage: prods[0]?.image_url ?? undefined,
      })
      addProductPages(prods)
    }
  } else {
    addProductPages(products)
  }

  // Assign sequential page numbers
  let counter = 1
  const totalProductPages = pages.filter(p => p.type === 'products').length
  for (const page of pages) {
    if (page.type === 'products') {
      page.pageNumber = counter
      page.totalPages = totalProductPages
      counter++
    }
  }

  return pages
}

export function PdfExportDocument({ catalog, products, user }: PdfExportDocumentProps) {
  useEffect(() => {
    let cancelled = false

    async function markReadyAfterAssets() {
      await document.fonts?.ready.catch(() => undefined)

      const images = Array.from(document.images)
      const CONCURRENT_IMAGE_LOAD = 6
      for (let i = 0; i < images.length; i += CONCURRENT_IMAGE_LOAD) {
        if (cancelled) return
        const chunk = images.slice(i, i + CONCURRENT_IMAGE_LOAD)
        await Promise.all(chunk.map((img) => img.decode?.().catch(() => undefined)))
      }

      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

      if (!cancelled) {
        requestAnimationFrame(() => {
          ;(window as typeof window & { __PDF_EXPORT_READY?: boolean }).__PDF_EXPORT_READY = true
        })
      }
    }

    void markReadyAfterAssets()

    return () => {
      cancelled = true
    }
  }, [])

  const layout = stringValue(catalog.layout, 'modern-grid')
  const primaryColor = stringValue(catalog.primary_color, '#7c3aed')
  const catalogName = stringValue(catalog.name, 'Katalog')
  const isFreeUser = user?.plan === 'free'

  const pages = useMemo(() => buildPages(catalog, products), [catalog, products])
  const TemplateComponent = (TEMPLATE_MAP[layout] ?? ModernGridTemplate) as ComponentType<TemplateProps>

  return (
    <UserProvider initialUser={user}>
      <main className="pdf-export-print bg-white">
        {pages.map((page, index) => (
          <div
            key={`page-${index}`}
            className="catalog-page-wrapper relative"
            style={{ width: A4_WIDTH, height: A4_HEIGHT }}
          >
            <div
              className="catalog-page catalog-light overflow-hidden bg-white"
              style={{ width: A4_WIDTH, height: A4_HEIGHT }}
            >
              {page.type === 'cover' && (
                <CoverPage
                  catalogName={catalogName}
                  coverImageUrl={stringValue(catalog.cover_image_url)}
                  coverDescription={stringValue(catalog.cover_description)}
                  logoUrl={stringValue(catalog.logo_url)}
                  primaryColor={primaryColor}
                  productCount={products.length}
                  theme={stringValue(catalog.theme)}
                />
              )}
              {page.type === 'divider' && (
                <CategoryDivider
                  categoryName={page.categoryName}
                  firstProductImage={page.firstProductImage}
                  primaryColor={primaryColor}
                  theme={stringValue(catalog.theme)}
                />
              )}
              {page.type === 'products' && (
                <TemplateComponent
                  products={page.products}
                  primaryColor={primaryColor}
                  catalogName={catalogName}
                  pageNumber={page.pageNumber}
                  totalPages={page.totalPages}
                  isFreeUser={isFreeUser}
                  headerTextColor={stringValue(catalog.header_text_color, '#ffffff')}
                  showPrices={booleanValue(catalog.show_prices, true)}
                  showDescriptions={booleanValue(catalog.show_descriptions, true)}
                  showAttributes={booleanValue(catalog.show_attributes, true)}
                  showSku={booleanValue(catalog.show_sku, true)}
                  showUrls={booleanValue(catalog.show_urls, false)}
                  productImageFit={stringValue(catalog.product_image_fit, 'cover') as 'cover' | 'contain' | 'fill'}
                  columnsPerRow={numberValue(catalog.columns_per_row, 2)}
                  logoUrl={stringValue(catalog.logo_url)}
                  logoPosition={stringValue(catalog.logo_position, 'top-left')}
                  logoSize={stringValue(catalog.logo_size, 'medium')}
                  titlePosition={stringValue(catalog.title_position, 'center') as 'left' | 'center' | 'right'}
                  backgroundColor={stringValue(catalog.background_color, '#ffffff')}
                  backgroundImage={stringValue(catalog.background_image) || null}
                  backgroundImageFit={stringValue(catalog.background_image_fit, 'cover') as 'cover' | 'contain' | 'fill'}
                  backgroundGradient={stringValue(catalog.background_gradient) || null}
                />
              )}

              {isFreeUser && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-multiply opacity-15">
                  <div className="text-8xl font-black text-gray-400 rotate-[-30deg] border-8 border-gray-400 p-8">FOGCATALOG</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>
      <style>{`
        .pdf-export-print,
        .pdf-export-print .overflow-hidden,
        .pdf-export-print .overflow-auto {
          overflow: visible !important;
        }
        .pdf-export-print .h-full {
          height: auto !important;
        }
        .pdf-export-print .catalog-page-wrapper {
          break-after: page;
          page-break-after: always;
          margin-bottom: 0 !important;
        }
        .pdf-export-print .catalog-page-wrapper:last-child {
          break-after: auto;
          page-break-after: auto;
        }
        .pdf-export-print .catalog-page {
          box-shadow: none !important;
        }
      `}</style>
    </UserProvider>
  )
}
