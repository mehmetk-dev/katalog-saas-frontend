import type { Catalog } from "@/lib/actions/catalogs"

/** slugify - Turkish character-aware URL slug generator */
export function slugify(text: string) {
    const trMap: Record<string, string> = {
        'ç': 'c', 'Ç': 'c',
        'ğ': 'g', 'Ğ': 'g',
        'ş': 's', 'Ş': 's',
        'ü': 'u', 'Ü': 'u',
        'ı': 'i', 'İ': 'i',
        'ö': 'o', 'Ö': 'o'
    }

    const safeText = text ? String(text) : ""

    return safeText
        .split('')
        .map(c => trMap[c] || c)
        .join('')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/** All design/content fields that make up the catalog data for save/autosave/publish */
export interface BuilderCatalogData {
    catalogName: string
    catalogDescription: string
    selectedProductIds: string[]
    layout: string
    primaryColor: string
    showPrices: boolean
    showDescriptions: boolean
    showAttributes: boolean
    showSku: boolean
    showUrls: boolean
    columnsPerRow: number
    backgroundColor: string
    backgroundImage: string | null
    backgroundImageFit: NonNullable<Catalog['background_image_fit']>
    backgroundGradient: string | null
    logoUrl: string | null
    logoPosition: Catalog['logo_position']
    logoSize: Catalog['logo_size']
    titlePosition: Catalog['title_position']
    productImageFit: NonNullable<Catalog['product_image_fit']>
    headerTextColor: string
    enableCoverPage: boolean
    coverImageUrl: string | null
    coverDescription: string | null
    enableCategoryDividers: boolean
    coverTheme: string
    isPublished: boolean
    showInSearch: boolean
}

/** Build the update payload from current state for updateCatalog/createCatalog calls */
export function buildCatalogPayload(data: BuilderCatalogData) {
    return {
        name: data.catalogName,
        description: data.catalogDescription,
        product_ids: data.selectedProductIds,
        layout: data.layout,
        primary_color: data.primaryColor,
        show_prices: data.showPrices,
        show_descriptions: data.showDescriptions,
        show_attributes: data.showAttributes,
        show_sku: data.showSku,
        show_urls: data.showUrls,
        columns_per_row: data.columnsPerRow,
        background_color: data.backgroundColor,
        background_image: data.backgroundImage,
        background_image_fit: data.backgroundImageFit,
        background_gradient: data.backgroundGradient,
        logo_url: data.logoUrl,
        logo_position: data.logoPosition,
        logo_size: data.logoSize,
        title_position: data.titlePosition,
        product_image_fit: data.productImageFit,
        header_text_color: data.headerTextColor,
        enable_cover_page: data.enableCoverPage,
        cover_image_url: data.coverImageUrl,
        cover_description: data.coverDescription,
        enable_category_dividers: data.enableCategoryDividers,
        cover_theme: data.coverTheme,
        show_in_search: data.showInSearch,
    }
}

/** Build the lastSavedState snapshot */
export function buildSavedStateSnapshot(data: BuilderCatalogData) {
    return {
        name: data.catalogName,
        description: data.catalogDescription,
        productIds: data.selectedProductIds,
        layout: data.layout,
        primaryColor: data.primaryColor,
        showPrices: data.showPrices,
        showDescriptions: data.showDescriptions,
        showAttributes: data.showAttributes,
        showSku: data.showSku,
        showUrls: data.showUrls,
        columnsPerRow: data.columnsPerRow,
        backgroundColor: data.backgroundColor,
        backgroundImage: data.backgroundImage,
        logoUrl: data.logoUrl,
        enableCoverPage: data.enableCoverPage,
        enableCategoryDividers: data.enableCategoryDividers,
        coverTheme: data.coverTheme,
        showInSearch: data.showInSearch,
        backgroundGradient: data.backgroundGradient,
    }
}
