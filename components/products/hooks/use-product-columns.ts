"use client"

import { useCallback, useEffect, useState } from "react"

/** Liste görünümünde açılıp kapatılabilen sütunlar (ürün adı ve aksiyonlar her zaman görünür) */
export type ProductColumn = "sku" | "price" | "stock" | "category" | "catalogs" | "updated"

export const PRODUCT_COLUMNS: ProductColumn[] = ["sku", "price", "stock", "category", "catalogs", "updated"]

const DEFAULT_COLUMNS: ProductColumn[] = ["sku", "price", "stock", "category", "catalogs"]
const STORAGE_KEY = "products.visibleColumns"

/** Görünür sütun tercihi tarayıcıda saklanır; ilk render sunucuyla aynı kalsın diye mount sonrası okunur. */
export function useProductColumns() {
    const [visibleColumns, setVisibleColumns] = useState<ProductColumn[]>(DEFAULT_COLUMNS)

    useEffect(() => {
        try {
            const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null")
            if (Array.isArray(stored)) {
                setVisibleColumns(PRODUCT_COLUMNS.filter((column) => stored.includes(column)))
            }
        } catch {
            // Bozuk/erişilemeyen kayıt: varsayılan sütunlar
        }
    }, [])

    const toggleColumn = useCallback((column: ProductColumn, visible: boolean) => {
        setVisibleColumns((prev) => {
            const next = PRODUCT_COLUMNS.filter((c) => (c === column ? visible : prev.includes(c)))
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
            } catch {
                // yok say
            }
            return next
        })
    }, [])

    return { visibleColumns, toggleColumn }
}
