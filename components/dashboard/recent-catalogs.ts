import type { Catalog } from "@/lib/actions/catalogs"

export const RECENT_CATALOG_COUNT = 5

/** Son düzenlenen kataloglar, yeniden eskiye; backend sırasına güvenilmez (sunucu ve istemci aynı listeyi kullanır) */
export function pickRecentCatalogs(catalogs: Catalog[], count: number = RECENT_CATALOG_COUNT): Catalog[] {
    return [...catalogs]
        .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
        .slice(0, count)
}
