"use client"

import { useEffect } from "react"

import { CatalogPreview } from "@/components/builder/preview/catalog-preview"
import type { Product } from "@/lib/actions/products"
import { UserProvider, type User } from "@/lib/contexts/user-context"

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

export function PdfExportDocument({ catalog, products, user }: PdfExportDocumentProps) {
  useEffect(() => {
    let cancelled = false

    async function markReadyAfterAssets() {
      await document.fonts?.ready.catch(() => undefined)
      const images = Array.from(document.images)
      await Promise.all(images.map((image) => image.decode?.().catch(() => undefined)))
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

  return (
    <UserProvider initialUser={user}>
      <main className="pdf-export-print bg-white">
        <CatalogPreview
          catalogName={stringValue(catalog.name, "Katalog")}
          products={products}
          layout={stringValue(catalog.layout, "modern-grid")}
          primaryColor={stringValue(catalog.primary_color, "#7c3aed")}
          headerTextColor={stringValue(catalog.header_text_color, "#ffffff")}
          showPrices={booleanValue(catalog.show_prices, true)}
          showDescriptions={booleanValue(catalog.show_descriptions, true)}
          showAttributes={booleanValue(catalog.show_attributes, true)}
          showSku={booleanValue(catalog.show_sku, true)}
          showUrls={booleanValue(catalog.show_urls, false)}
          productImageFit={stringValue(catalog.product_image_fit, "cover") as "cover" | "contain" | "fill"}
          columnsPerRow={numberValue(catalog.columns_per_row, 2)}
          logoUrl={stringValue(catalog.logo_url)}
          logoPosition={stringValue(catalog.logo_position, "top-left")}
          logoSize={stringValue(catalog.logo_size, "medium")}
          titlePosition={stringValue(catalog.title_position, "center") as "left" | "center" | "right"}
          enableCoverPage={booleanValue(catalog.enable_cover_page, false)}
          coverImageUrl={stringValue(catalog.cover_image_url)}
          coverDescription={stringValue(catalog.cover_description)}
          enableCategoryDividers={booleanValue(catalog.enable_category_dividers, false)}
          categoryOrder={Array.isArray(catalog.category_order) ? catalog.category_order.map(String) : []}
          backgroundColor={stringValue(catalog.background_color, "#ffffff")}
          backgroundImage={stringValue(catalog.background_image) || null}
          backgroundImageFit={stringValue(catalog.background_image_fit, "cover") as "cover" | "contain" | "fill"}
          backgroundGradient={stringValue(catalog.background_gradient) || null}
          theme={stringValue(catalog.theme)}
          isExporting
        />
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
