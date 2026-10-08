/**
 * Eski/alternatif şablon adlarını tek bir kanonik ada indirger.
 * Builder önizlemesi, yayındaki sayfa, PDF ve sayfa başına ürün sayısı aynı eşlemeyi kullanmalı;
 * aksi halde aynı katalog editörde ve müşteride farklı görünür.
 */
export const LAYOUT_ALIASES: Record<string, string> = {
    list: "compact-list",
    "minimal-gallery": "minimalist",
    "bold-grid": "bold",
    "elegant-showcase": "elegant-cards",
    "classic-list": "classic-catalog",
}

export const DEFAULT_LAYOUT = "modern-grid"

export function normalizeLayout(layout: string | null | undefined): string {
    const key = layout?.trim().toLowerCase() || DEFAULT_LAYOUT
    return LAYOUT_ALIASES[key] ?? key
}
