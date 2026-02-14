import { type Product } from "../types"

export function getStockStatus(stock: number) {
    if (stock === 0) return { label: "Stok Yok", variant: "destructive" as const }
    if (stock < 10) return { label: "Az Stok", variant: "secondary" as const }
    return { label: "Stokta", variant: "default" as const }
}

export function getCurrencySymbol(product: Product) {
    const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
    return `${symbol}${Number(product.price).toFixed(2)}`
}
