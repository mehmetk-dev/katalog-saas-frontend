import type { Catalog } from "@/lib/actions/catalogs"

/**
 * Katalogdaki ürün sayısı. Liste yanıtlarında product_ids yalnızca önizleme için ilk birkaç
 * kimliği içerir; gerçek sayı product_count'tadır (tek katalog yanıtında yoktur, dizi tamdır).
 */
export function getCatalogProductCount(catalog: Pick<Catalog, "product_ids" | "product_count">): number {
    if (typeof catalog.product_count === "number") return catalog.product_count
    return new Set(catalog.product_ids ?? []).size
}
