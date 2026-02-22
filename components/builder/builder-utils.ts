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

// ─── Constants ────────────────────────────────────────────────────────────────

export const SPLIT_PREVIEW_SOFT_LIMIT = 1000

// ─── Pure Utility Functions ───────────────────────────────────────────────────

/** Lightweight fingerprint for large arrays — avoids O(n) comparison on every render.
 *  Uses length + 5 sample points + a rolling char-code checksum for collision resistance.
 *  Still O(1) since we only sample a fixed number of elements. */
export function arrayFingerprint(arr: string[]): string {
    const len = arr.length
    if (len === 0) return '0'
    if (len <= 3) return `${len}:${arr.join(',')}`

    const q1 = Math.floor(len / 4)
    const q2 = Math.floor(len / 2)
    const q3 = Math.floor(3 * len / 4)
    const samples = `${arr[0]}|${arr[q1]}|${arr[q2]}|${arr[q3]}|${arr[len - 1]}`

    let checksum = 0
    const step = Math.max(1, Math.floor(len / 8))
    for (let i = 0; i < len; i += step) {
        const id = arr[i]
        checksum = (checksum * 31 + id.charCodeAt(0) + id.charCodeAt(id.length - 1)) | 0
    }

    return `${len}:${samples}:${checksum}`
}

/** Normalize logo position to a valid value */
export function normalizeLogoPosition(
    position: Catalog['logo_position'] | null | undefined,
    hasLogo: boolean
): Catalog['logo_position'] {
    const allowedPositions: Array<NonNullable<Catalog['logo_position']>> = [
        'none',
        'header-left',
        'header-center',
        'header-right',
    ]

    if (!hasLogo) return 'none'
    if (position && allowedPositions.includes(position as NonNullable<Catalog['logo_position']>)) {
        return position
    }

    return 'header-left'
}

/** Convert hex color to rgba string */
export function hexToRgba(hex: string, alpha: number = 1): string {
    if (hex.startsWith('rgba')) return hex
    if (hex === 'transparent') return 'rgba(0, 0, 0, 0)'
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
        const r = parseInt(result[1], 16)
        const g = parseInt(result[2], 16)
        const b = parseInt(result[3], 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return `rgba(124, 58, 237, ${alpha})`
}

/** Resolve initial primary color from catalog data */
export function resolveInitialPrimaryColor(catalogPrimaryColor?: string | null): string {
    if (!catalogPrimaryColor) return 'rgba(124, 58, 237, 1)'
    if (catalogPrimaryColor.startsWith('rgba')) return catalogPrimaryColor
    if (catalogPrimaryColor === 'transparent') return 'rgba(0, 0, 0, 0)'
    return hexToRgba(catalogPrimaryColor)
}

/** Build the full initial state from catalog + user data */
export function buildInitialCatalogState(
    catalog: Catalog | null,
    userLogoUrl?: string | null
): BuilderCatalogData {
    const logoUrl = catalog?.logo_url || userLogoUrl || null
    return {
        catalogName: catalog?.name || '',
        catalogDescription: catalog?.description || '',
        selectedProductIds: catalog?.product_ids || [],
        layout: catalog?.layout || 'grid',
        primaryColor: resolveInitialPrimaryColor(catalog?.primary_color),
        showPrices: catalog?.show_prices ?? true,
        showDescriptions: catalog?.show_descriptions ?? true,
        showAttributes: catalog?.show_attributes ?? false,
        showSku: catalog?.show_sku ?? true,
        showUrls: catalog?.show_urls ?? false,
        columnsPerRow: catalog?.columns_per_row || 3,
        backgroundColor: catalog?.background_color || '#ffffff',
        backgroundImage: catalog?.background_image || null,
        backgroundImageFit: catalog?.background_image_fit || 'cover',
        backgroundGradient: catalog?.background_gradient || null,
        logoUrl,
        logoPosition: normalizeLogoPosition(catalog?.logo_position, Boolean(logoUrl)),
        logoSize: catalog?.logo_size || 'medium',
        titlePosition: catalog?.title_position || 'left',
        productImageFit: catalog?.product_image_fit || 'cover',
        headerTextColor: catalog?.header_text_color || '#000000',
        enableCoverPage: catalog?.enable_cover_page ?? false,
        coverImageUrl: catalog?.cover_image_url || null,
        coverDescription: catalog?.cover_description || null,
        enableCategoryDividers: catalog?.enable_category_dividers ?? false,
        coverTheme: catalog?.cover_theme || 'modern',
        isPublished: catalog?.is_published || false,
        showInSearch: catalog?.show_in_search ?? true,
    }
}

// ─── Preview Props Builder ────────────────────────────────────────────────────

/** Catalog design config — shared between editor, preview, and PDF export */
export interface CatalogDesignConfig {
    catalogName: string
    layout: string
    primaryColor: string
    headerTextColor: string
    showPrices: boolean
    showDescriptions: boolean
    showAttributes: boolean
    showSku: boolean
    showUrls: boolean
    productImageFit: NonNullable<Catalog['product_image_fit']>
    columnsPerRow: number
    backgroundColor: string
    backgroundImage: string | null
    backgroundImageFit: NonNullable<Catalog['background_image_fit']>
    backgroundGradient: string | null
    logoUrl: string | null
    logoPosition: Catalog['logo_position']
    logoSize: Catalog['logo_size']
    titlePosition: Catalog['title_position']
    enableCoverPage: boolean
    coverImageUrl: string | null
    coverDescription: string | null
    enableCategoryDividers: boolean
    coverTheme: string
}

/** Extract CatalogDesignConfig from full BuilderCatalogData */
export function extractDesignConfig(data: BuilderCatalogData): CatalogDesignConfig {
    return {
        catalogName: data.catalogName,
        layout: data.layout,
        primaryColor: data.primaryColor,
        headerTextColor: data.headerTextColor,
        showPrices: data.showPrices,
        showDescriptions: data.showDescriptions,
        showAttributes: data.showAttributes,
        showSku: data.showSku,
        showUrls: data.showUrls,
        productImageFit: data.productImageFit,
        columnsPerRow: data.columnsPerRow,
        backgroundColor: data.backgroundColor,
        backgroundImage: data.backgroundImage,
        backgroundImageFit: data.backgroundImageFit,
        backgroundGradient: data.backgroundGradient,
        logoUrl: data.logoUrl,
        logoPosition: data.logoPosition,
        logoSize: data.logoSize,
        titlePosition: data.titlePosition,
        enableCoverPage: data.enableCoverPage,
        coverImageUrl: data.coverImageUrl,
        coverDescription: data.coverDescription,
        enableCategoryDividers: data.enableCategoryDividers,
        coverTheme: data.coverTheme,
    }
}
