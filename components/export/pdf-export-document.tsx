'use client'

import { useEffect, useMemo } from 'react'
import React from 'react'
import type { ComponentType } from 'react'

import type { Product } from '@/lib/actions/products'
import { UserProvider, type User } from '@/lib/contexts/user-context'
import type { TemplateProps } from '@/components/catalogs/templates/types'
import { PdfExportModeProvider } from '@/components/ui/product-image-gallery'
import { createCatalogPagesModel } from '@/components/builder/preview/use-catalog-pages'
import { waitForPdfExportAssets } from '@/lib/pdf-export-assets'
import { buildInitialCatalogState, type BuilderCatalogData } from '@/components/builder/builder-utils'
import type { Catalog } from '@/lib/actions/catalogs'
import { normalizeLayout } from '@/lib/catalog-layouts'

// Static imports — no lazy loading, no ssr:false
// Templates MUST be statically imported so Playwright can render them immediately
import { CoverPage } from '@/components/catalogs/cover-page'
import { CategoryDivider } from '@/components/catalogs/category-divider'

import { ModernGridTemplate } from '@/components/catalogs/templates/modern-grid'
import { CompactListTemplate } from '@/components/catalogs/templates/compact-list'
import { MagazineTemplate } from '@/components/catalogs/templates/magazine'
import { MinimalistTemplate } from '@/components/catalogs/templates/minimalist'
import { BoldTemplate } from '@/components/catalogs/templates/bold'
import { ElegantCardsTemplate } from '@/components/catalogs/templates/elegant-cards'
import { ClassicCatalogTemplate } from '@/components/catalogs/templates/classic-catalog'
import { ShowcaseTemplate } from '@/components/catalogs/templates/showcase'
import { CatalogProTemplate } from '@/components/catalogs/templates/catalog-pro'
import { RetailTemplate } from '@/components/catalogs/templates/retail'
import { TechModernTemplate } from '@/components/catalogs/templates/tech-modern'
import { FashionLookbookTemplate } from '@/components/catalogs/templates/fashion-lookbook'
import { IndustrialTemplate } from '@/components/catalogs/templates/industrial'
import { LuxuryTemplate } from '@/components/catalogs/templates/luxury'
import { CleanWhiteTemplate } from '@/components/catalogs/templates/clean-white'
import { ProductTilesTemplate } from '@/components/catalogs/templates/product-tiles'

/** Kanonik şablon adları; takma adlar normalizeLayout ile çözülür */
const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
    'modern-grid': ModernGridTemplate,
    'compact-list': CompactListTemplate,
    magazine: MagazineTemplate,
    minimalist: MinimalistTemplate,
    bold: BoldTemplate,
    'elegant-cards': ElegantCardsTemplate,
    'classic-catalog': ClassicCatalogTemplate,
    showcase: ShowcaseTemplate,
    'catalog-pro': CatalogProTemplate,
    retail: RetailTemplate,
    'tech-modern': TechModernTemplate,
    'fashion-lookbook': FashionLookbookTemplate,
    industrial: IndustrialTemplate,
    luxury: LuxuryTemplate,
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

/**
 * PDF, builder önizlemesiyle birebir aynı ayarlarla çizilmeli: varsayılanlar, sütun normalizasyonu ve
 * kullanıcı logosu yedeği builder'ın `buildInitialCatalogState` fonksiyonundan gelir.
 */
export function resolvePdfDesignSettings(catalog: RenderCatalog, userLogoUrl?: string | null): BuilderCatalogData {
    return buildInitialCatalogState(catalog as unknown as Catalog, userLogoUrl)
}

type CatalogPage =
    | { type: 'cover' }
    | { type: 'divider'; categoryName: string; firstProductImage?: string }
    | { type: 'products'; products: Product[]; pageNumber: number; totalPages: number }

export function buildPages(catalog: RenderCatalog, products: Product[], uncategorizedLabel = 'Kategorisiz'): CatalogPage[] {
    const design = resolvePdfDesignSettings(catalog)
    const pageModel = createCatalogPagesModel({
        products,
        layout: design.layout,
        columnsPerRow: design.columnsPerRow,
        enableCoverPage: design.enableCoverPage,
        enableCategoryDividers: design.enableCategoryDividers,
        categoryOrder: design.categoryOrder,
        uncategorizedLabel,
    })

    return pageModel.getAllPages().map((page, index) => {
        if (page.type !== 'products') return page
        return {
            ...page,
            pageNumber: index + 1,
            totalPages: pageModel.totalPages,
        }
    })
}

export function PdfExportDocument({ catalog, products, user }: PdfExportDocumentProps) {
    useEffect(() => {
        let cancelled = false

        async function markReadyAfterAssets() {
            try {
                await waitForPdfExportAssets(document)

                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
                await new Promise<void>((resolve) => setTimeout(resolve, 500))
            } catch {
                // swallow — still proceed to mark ready
            }

            if (!cancelled) {
                ;(window as typeof window & { __PDF_EXPORT_READY?: boolean }).__PDF_EXPORT_READY =
                    true
            }
        }

        void markReadyAfterAssets()

        return () => {
            cancelled = true
        }
    }, [])

    const design = useMemo(() => resolvePdfDesignSettings(catalog, user?.logo_url), [catalog, user?.logo_url])
    const isFreeUser = user?.plan === 'free'

    const pages = useMemo(() => buildPages(catalog, products), [catalog, products])
    const TemplateComponent = TEMPLATE_MAP[normalizeLayout(design.layout)] ?? ModernGridTemplate

    return (
        <UserProvider initialUser={user}>
            <PdfExportModeProvider>
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
                                        catalogName={design.catalogName}
                                        coverImageUrl={design.coverImageUrl ?? undefined}
                                        coverDescription={design.coverDescription || design.catalogDescription || undefined}
                                        logoUrl={design.logoUrl ?? undefined}
                                        primaryColor={design.primaryColor}
                                        productCount={products.length}
                                        isExporting
                                        theme={design.coverTheme}
                                    />
                                )}
                                {page.type === 'divider' && (
                                    <CategoryDivider
                                        categoryName={page.categoryName}
                                        firstProductImage={page.firstProductImage}
                                        primaryColor={design.primaryColor}
                                        theme={design.coverTheme}
                                    />
                                )}
                                {page.type === 'products' && (
                                    <TemplateComponent
                                        products={page.products}
                                        primaryColor={design.primaryColor}
                                        catalogName={design.catalogName}
                                        pageNumber={page.pageNumber}
                                        totalPages={page.totalPages}
                                        isFreeUser={isFreeUser}
                                        headerTextColor={design.headerTextColor}
                                        showPrices={design.showPrices}
                                        showDescriptions={design.showDescriptions}
                                        showAttributes={design.showAttributes}
                                        showSku={design.showSku}
                                        showUrls={design.showUrls}
                                        productImageFit={design.productImageFit}
                                        columnsPerRow={design.columnsPerRow}
                                        logoUrl={design.logoUrl ?? undefined}
                                        logoPosition={design.logoPosition ?? undefined}
                                        logoSize={design.logoSize}
                                        titlePosition={design.titlePosition}
                                        backgroundColor={design.backgroundColor}
                                        backgroundImage={design.backgroundImage}
                                        backgroundImageFit={design.backgroundImageFit}
                                        backgroundGradient={design.backgroundGradient}
                                    />
                                )}

                                {isFreeUser && (
                                    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center opacity-5 mix-blend-multiply">
                                        <div className="rotate-[-30deg] border-8 border-gray-400 p-8 text-8xl font-black text-gray-400">
                                            FOGCATALOG
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </main>
            </PdfExportModeProvider>
            {/* Yalnızca sayfa kırılımı ve gölge: şablonların overflow/h-full davranışına dokunulmaz.
                Önceden tüm .overflow-hidden/.h-full ezildiği için görseller yazının üstüne taşıyor ve
                alt bilgiler ayrı bir PDF sayfasına düşüyordu. */}
            <style>{`
        @page { size: A4; margin: 0; }
        .pdf-export-print .catalog-page-wrapper {
          break-after: page;
          page-break-after: always;
          break-inside: avoid;
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
