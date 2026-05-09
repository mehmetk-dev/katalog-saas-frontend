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

import { getItemsPerPage } from "@/lib/constants"

/** Returns how many products fit on a single page for the given layout. */
export function getPageSize(layout: string, columnsPerRow: number): number {
    return getItemsPerPage(layout, columnsPerRow)
}
