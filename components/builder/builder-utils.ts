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

/** Katalog taslağı: kaydedilen, geri alınabilen her alan (yayın durumu hariç) */
export type CatalogDraft = Omit<BuilderCatalogData, 'isPublished'>

export function toDraft(data: BuilderCatalogData): CatalogDraft {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isPublished, ...draft } = data
    return draft
}

function sameFieldValue(a: unknown, b: unknown): boolean {
    if (a === b) return true
    if (Array.isArray(a) && Array.isArray(b)) return arrayFingerprint(a) === arrayFingerprint(b)
    return false
}

/** İki taslak aynı mı? Diziler önce referansla, değilse sıralı parmak iziyle karşılaştırılır. */
export function draftsEqual(a: CatalogDraft, b: CatalogDraft): boolean {
    if (a === b) return true
    return DRAFT_KEYS.every((key) => sameFieldValue(a[key], b[key]))
}

export function patchChangesDraft(draft: CatalogDraft, patch: Partial<CatalogDraft>): boolean {
    return (Object.keys(patch) as Array<keyof CatalogDraft>).some((key) => !sameFieldValue(draft[key], patch[key]))
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SPLIT_PREVIEW_SOFT_LIMIT = 1000

// ─── Pure Utility Functions ───────────────────────────────────────────────────

/** Order-sensitive O(n) fingerprint for large arrays.
 *  Avoids allocating/sorting copies while still detecting adjacent reorders. */
export function arrayFingerprint(arr: string[]): string {
    const len = arr.length
    if (len === 0) return '0'
    let checksum = 2166136261

    for (let i = 0; i < len; i++) {
        const id = arr[i]
        checksum ^= i + 1
        checksum = Math.imul(checksum, 16777619)

        for (let j = 0; j < id.length; j++) {
            checksum ^= id.charCodeAt(j)
            checksum = Math.imul(checksum, 16777619)
        }
    }

    return `${len}:${checksum >>> 0}`
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
        layout: catalog?.layout || 'modern-grid',
        primaryColor: resolveInitialPrimaryColor(catalog?.primary_color),
        showPrices: catalog?.show_prices ?? true,
        showDescriptions: catalog?.show_descriptions ?? true,
        showAttributes: catalog?.show_attributes ?? false,
        showSku: catalog?.show_sku ?? true,
        showUrls: catalog?.show_urls ?? false,
        columnsPerRow: normalizeColumnsPerRow(catalog?.layout || 'modern-grid', catalog?.columns_per_row || 3),
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

// ─── Template Column Constraints ──────────────────────────────────────────────
// Her şablonun "Sütun" seçeneğinde kaç değer göstereceği. Değerler şablon
// kodundan çıkarıldı (getGridCols / sabit grid-cols). Yeni şablon eklerken
// veya bir şablonun desteklediği sütunları değiştirirken SADECE burayı güncelle.
const TEMPLATE_COLUMNS: Record<string, number[]> = {
    'modern-grid': [2, 3],
    magazine: [2, 3],
    bold: [2, 3],
    'bold-grid': [2, 3],
    'compact-list': [1],
    list: [1],
    'classic-catalog': [1],
    'classic-list': [1],
    industrial: [1],
    'fashion-lookbook': [1],
    luxury: [2, 3, 4],
    'tech-modern': [2, 3, 4],
    'tech-catalog': [2, 3, 4],
    'clean-white': [2, 3, 4],
    retail: [2, 3, 4],
    minimalist: [2],
    'minimal-gallery': [2],
    'catalog-minimalist': [2],
    'elegant-cards': [2],
    'elegant-showcase': [2],
    'catalog-elegant': [2],
    'catalog-pro': [2],
    showcase: [2],
    'product-tiles': [3],
}
const DEFAULT_COLUMNS = [2, 3]

export function getAvailableColumns(layout: string): number[] {
    return TEMPLATE_COLUMNS[layout] ?? DEFAULT_COLUMNS
}

/** Şablonun desteklemediği sütun sayısını desteklenen ilk değere çeker */
export function normalizeColumnsPerRow(layout: string, columns: number): number {
    const available = getAvailableColumns(layout)
    return available.includes(columns) ? columns : available[0]
}

/** Tüm taslak alanları — buildInitialCatalogState tek kaynak.
 *  (Dosyanın sonunda: buildInitialCatalogState'in kullandığı sabitler önce tanımlanmalı.) */
export const DRAFT_KEYS = Object.keys(toDraft(buildInitialCatalogState(null))) as Array<keyof CatalogDraft>
