"use client"

import React from "react"
import type { ComponentType } from "react"
import type { Catalog } from "@/lib/actions/catalogs"
import type { TemplateProps } from "@/components/catalogs/templates/types"
import type { CatalogPage } from "../_lib/types"
import { DEFAULT_PRIMARY_COLOR } from "../_lib/constants"

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

/** Static template lookup – avoids dynamic import flash for public visitors. */
const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
    'modern-grid': ModernGridTemplate,
    'compact-list': CompactListTemplate,
    'magazine': MagazineTemplate,
    'minimalist': MinimalistTemplate,
    'bold': BoldTemplate,
    'elegant-cards': ElegantCardsTemplate,
    'classic-catalog': ClassicCatalogTemplate,
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

interface PageRendererProps {
    page: CatalogPage
    catalog: Catalog
    filteredProductCount: number
    isExporting: boolean
}

/** Renders a single catalog page: cover, category divider, or product template. */
export const PageRenderer = React.memo(function PageRenderer({
    page,
    catalog,
    filteredProductCount,
    isExporting,
}: PageRendererProps) {
    const primaryColor = catalog.primary_color || DEFAULT_PRIMARY_COLOR

    if (page.type === 'cover') {
        return (
            <CoverPage
                catalogName={catalog.name}
                coverImageUrl={catalog.cover_image_url}
                coverDescription={catalog.cover_description}
                logoUrl={catalog.logo_url}
                primaryColor={primaryColor}
                productCount={filteredProductCount}
                isExporting={isExporting}
                theme={catalog.cover_theme}
            />
        )
    }

    if (page.type === 'divider') {
        return (
            <CategoryDivider
                categoryName={page.categoryName}
                firstProductImage={page.firstProductImage}
                primaryColor={primaryColor}
                theme={catalog.cover_theme}
            />
        )
    }

    const TemplateComponent = TEMPLATE_MAP[catalog.layout] ?? ModernGridTemplate

    const props: TemplateProps = {
        products: page.products,
        catalogName: catalog.name,
        primaryColor,
        headerTextColor: catalog.header_text_color || undefined,
        showPrices: catalog.show_prices !== false,
        showDescriptions: catalog.show_descriptions !== false,
        showAttributes: catalog.show_attributes !== false,
        showSku: catalog.show_sku !== false,
        showUrls: catalog.show_urls || false,
        productImageFit: (catalog.product_image_fit as 'cover' | 'contain' | 'fill') || 'cover',
        isFreeUser: false,
        pageNumber: page.pageNumber,
        totalPages: page.totalPages,
        columnsPerRow: catalog.columns_per_row || 3,
        logoUrl: catalog.logo_url,
        logoPosition: catalog.logo_position || 'header-left',
        logoSize: catalog.logo_size,
        titlePosition: catalog.title_position || 'left',
    }

    return <TemplateComponent {...props} />
})
