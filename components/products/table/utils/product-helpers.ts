import { type Product } from "../types"

/** URL protokol doğrulaması — javascript: ve data: XSS saldırılarını önler */
export function isSafeUrl(url: string | null | undefined): boolean {
    if (!url) return false
    try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
        return false
    }
}

export function getStockStatus(stock: number) {
    if (stock === 0) return { label: "Stok Yok", variant: "destructive" as const }
    if (stock < 10) return { label: "Az Stok", variant: "secondary" as const }
    return { label: "Stokta", variant: "default" as const }
}

const SUPPORTED_CURRENCIES = new Set(["TRY", "USD", "EUR", "GBP"])

/** Ürün fiyatını para birimiyle ve binlik ayraçla biçimlendirir: ₺4.500,00 / $1.200,00 */
export function formatProductPrice(product: Product) {
    const raw = product.custom_attributes?.find((a) => a.name === "currency")?.value?.toUpperCase() || "TRY"
    const currency = SUPPORTED_CURRENCIES.has(raw) ? raw : "TRY"
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency, minimumFractionDigits: 2 }).format(Number(product.price) || 0)
}
