"use client"

import React from "react"
import type { ComponentType } from "react"

import type { BuilderCatalogData } from "@/components/builder/builder-utils"
import { CategoryDivider } from "@/components/catalogs/category-divider"
import { CoverPage } from "@/components/catalogs/cover-page"
import { BoldTemplate } from "@/components/catalogs/templates/bold"
import { CatalogProTemplate } from "@/components/catalogs/templates/catalog-pro"
import { ClassicCatalogTemplate } from "@/components/catalogs/templates/classic-catalog"
import { CleanWhiteTemplate } from "@/components/catalogs/templates/clean-white"
import { CompactListTemplate } from "@/components/catalogs/templates/compact-list"
import { ElegantCardsTemplate } from "@/components/catalogs/templates/elegant-cards"
import { FashionLookbookTemplate } from "@/components/catalogs/templates/fashion-lookbook"
import { IndustrialTemplate } from "@/components/catalogs/templates/industrial"
import { LuxuryTemplate } from "@/components/catalogs/templates/luxury"
import { MagazineTemplate } from "@/components/catalogs/templates/magazine"
import { MinimalistTemplate } from "@/components/catalogs/templates/minimalist"
import { ModernGridTemplate } from "@/components/catalogs/templates/modern-grid"
import { ProductTilesTemplate } from "@/components/catalogs/templates/product-tiles"
import { RetailTemplate } from "@/components/catalogs/templates/retail"
import { ShowcaseTemplate } from "@/components/catalogs/templates/showcase"
import { TechModernTemplate } from "@/components/catalogs/templates/tech-modern"
import type { TemplateProps } from "@/components/catalogs/templates/types"
import { normalizeLayout } from "@/lib/catalog-layouts"
import type { CatalogPage } from "../_lib/types"

/** Statik şablon tablosu (kanonik adlar) — public ziyaretçide dinamik import titremesini önler. */
const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
    "modern-grid": ModernGridTemplate,
    "compact-list": CompactListTemplate,
    magazine: MagazineTemplate,
    minimalist: MinimalistTemplate,
    bold: BoldTemplate,
    "elegant-cards": ElegantCardsTemplate,
    "classic-catalog": ClassicCatalogTemplate,
    showcase: ShowcaseTemplate,
    "catalog-pro": CatalogProTemplate,
    retail: RetailTemplate,
    "tech-modern": TechModernTemplate,
    "fashion-lookbook": FashionLookbookTemplate,
    industrial: IndustrialTemplate,
    luxury: LuxuryTemplate,
    "clean-white": CleanWhiteTemplate,
    "product-tiles": ProductTilesTemplate,
}

interface PageRendererProps {
    page: CatalogPage
    design: BuilderCatalogData
    /** 1'den başlar; builder önizlemesi gibi kapak/ayraç sayfaları da sayılır */
    pageNumber: number
    totalPages: number
    productCount: number
    isExporting: boolean
}

/** Tek bir katalog sayfası: kapak, kategori ayracı veya ürün şablonu (builder ile aynı props). */
export const PageRenderer = React.memo(function PageRenderer({
    page,
    design,
    pageNumber,
    totalPages,
    productCount,
    isExporting,
}: PageRendererProps) {
    if (page.type === "cover") {
        return (
            <CoverPage
                catalogName={design.catalogName}
                coverImageUrl={design.coverImageUrl ?? undefined}
                coverDescription={design.coverDescription || design.catalogDescription || undefined}
                logoUrl={design.logoUrl ?? undefined}
                primaryColor={design.primaryColor}
                productCount={productCount}
                isExporting={isExporting}
                theme={design.coverTheme}
            />
        )
    }

    if (page.type === "divider") {
        return (
            <CategoryDivider
                categoryName={page.categoryName}
                firstProductImage={page.firstProductImage}
                primaryColor={design.primaryColor}
                theme={design.coverTheme}
            />
        )
    }

    const TemplateComponent = TEMPLATE_MAP[normalizeLayout(design.layout)] ?? ModernGridTemplate

    return (
        <TemplateComponent
            products={page.products}
            catalogName={design.catalogName}
            primaryColor={design.primaryColor}
            headerTextColor={design.headerTextColor}
            showPrices={design.showPrices}
            showDescriptions={design.showDescriptions}
            showAttributes={design.showAttributes}
            showSku={design.showSku}
            showUrls={design.showUrls}
            productImageFit={design.productImageFit}
            isFreeUser={false}
            pageNumber={pageNumber}
            totalPages={totalPages}
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
    )
})
