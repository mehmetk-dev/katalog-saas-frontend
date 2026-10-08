/** Yayındaki kataloğun herkese açık adresi. Kanonik alan adı yoksa mevcut origin kullanılır. */
export function getCatalogShareUrl(slug: string): string {
    const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || (typeof window !== "undefined" ? window.location.origin : "")
    return new URL(`/catalog/${encodeURIComponent(slug)}`, base || "http://localhost:3000").toString()
}
