/** A4 page dimensions in pixels (96 DPI) */
export const A4_WIDTH_PX = 794
export const A4_HEIGHT_PX = 1123

/** A4 page dimensions in millimeters */
export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297

/** Breakpoint below which mobile layout is used */
export const MOBILE_BREAKPOINT = 1024

/** Number of PDF pages to process before yielding to the main thread */
export const PDF_CHUNK_SIZE = 5

export const DEFAULT_PRIMARY_COLOR = 'rgba(124, 58, 237, 1)'

// -- Page size per layout --------------------------------------------------

/** Layouts with a fixed number of products per page */
const STATIC_PAGE_SIZES: Record<string, number> = {
    'classic-catalog': 3,
    'compact-list': 10,
    'retail': 12,
    'minimalist': 4,
    'fashion-lookbook': 5,
    'industrial': 8,
    'showcase': 5,
    'luxury': 6,
    'product-tiles': 6,
    'catalog-pro': 4,
}

/** Layouts whose page size depends on the column count */
const DYNAMIC_PAGE_SIZES: Record<string, (columns: number) => number> = {
    'magazine': (columns) => columns === 2 ? 5 : 7,
}

/** Returns how many products fit on a single page for the given layout. */
export function getPageSize(layout: string, columnsPerRow: number): number {
    const dynamicSizer = DYNAMIC_PAGE_SIZES[layout]
    if (dynamicSizer) return dynamicSizer(columnsPerRow)
    return STATIC_PAGE_SIZES[layout] ?? columnsPerRow * 3
}
