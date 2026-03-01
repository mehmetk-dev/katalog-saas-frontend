import type { Catalog } from "@/lib/actions/catalogs"

// Re-export canonical slugify from lib/helpers
export { slugify } from "@/lib/utils/helpers"

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
    categoryOrder: string[]
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
        category_order: data.categoryOrder,
        cover_theme: data.coverTheme,
        show_in_search: data.showInSearch,
    }
}

/** Build the lastSavedState snapshot
 *  FIX(F11): Must include ALL fields compared in hasUnsavedChanges */
export function buildSavedStateSnapshot(data: BuilderCatalogData) {
    return {
        name: data.catalogName,
        description: data.catalogDescription,
        productIds: data.selectedProductIds,
        layout: data.layout,
        primaryColor: data.primaryColor,
        headerTextColor: data.headerTextColor,
        showPrices: data.showPrices,
        showDescriptions: data.showDescriptions,
        showAttributes: data.showAttributes,
        showSku: data.showSku,
        showUrls: data.showUrls,
        columnsPerRow: data.columnsPerRow,
        backgroundColor: data.backgroundColor,
        backgroundImage: data.backgroundImage,
        backgroundImageFit: data.backgroundImageFit,
        backgroundGradient: data.backgroundGradient,
        logoUrl: data.logoUrl,
        logoPosition: data.logoPosition,
        logoSize: data.logoSize,
        titlePosition: data.titlePosition,
        productImageFit: data.productImageFit,
        enableCoverPage: data.enableCoverPage,
        coverImageUrl: data.coverImageUrl,
        coverDescription: data.coverDescription,
        enableCategoryDividers: data.enableCategoryDividers,
        categoryOrder: data.categoryOrder,
        coverTheme: data.coverTheme,
        showInSearch: data.showInSearch,
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

// ─── Color Utilities (F14: consolidated) ──────────────────────────────────────

/** Parse color string (hex or rgba) to RGB components */
export function parseColor(color: string) {
    if (color.startsWith('rgba') || color.startsWith('rgb')) {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: match[4] ? parseFloat(match[4]) : 1
            }
        }
    } else if (color.startsWith('#')) {
        const hex = color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return { r, g, b, a: 1 }
    }
    return { r: 124, g: 58, b: 237, a: 1 } // default indigo
}

/** Convert RGB values to hex string */
export function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }).join('')}`
}

/** Convert hex color to rgba string */
export function hexToRgba(hex: string, alpha: number = 1): string {
    if (hex.startsWith('rgba')) return hex
    if (hex === 'transparent') return 'rgba(0, 0, 0, 0)'
    const parsed = parseColor(hex)
    return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`
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
        categoryOrder: catalog?.category_order ?? [],
        coverTheme: catalog?.cover_theme || 'modern',
        isPublished: catalog?.is_published || false,
        showInSearch: catalog?.show_in_search ?? true,
    }
}

// ─── Preview Props Builder ────────────────────────────────────────────────────

/** Catalog design config — shared between editor, preview, and PDF export
 *  FIX(F12): Derived from BuilderCatalogData via Omit — single source of truth */
export type CatalogDesignConfig = Omit<BuilderCatalogData,
    'catalogDescription' | 'selectedProductIds' | 'isPublished' | 'showInSearch'
>

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
        categoryOrder: data.categoryOrder,
        coverTheme: data.coverTheme,
    }
}
