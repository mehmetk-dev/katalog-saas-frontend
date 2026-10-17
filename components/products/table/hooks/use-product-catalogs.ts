"use client"

import { useEffect, useState } from "react"

import { checkProductsInCatalogs, type CatalogReference } from "@/lib/actions/products"

/**
 * Sayfadaki ürünlerin hangi kataloglarda olduğunu getirir ("Kataloglarda" sütunu).
 * null = henüz yüklenmedi; ürün listesi değişince yeniden istenir.
 */
export function useProductCatalogs(productIds: string[], enabled: boolean): Map<string, CatalogReference[]> | null {
    const [catalogsByProduct, setCatalogsByProduct] = useState<Map<string, CatalogReference[]> | null>(null)
    const key = enabled ? productIds.join(",") : ""

    useEffect(() => {
        if (!key) {
            setCatalogsByProduct(null)
            return
        }

        let cancelled = false
        setCatalogsByProduct(null)
        checkProductsInCatalogs(key.split(","))
            .then((result) => {
                if (cancelled) return
                setCatalogsByProduct(new Map(result.productsInCatalogs.map((entry) => [entry.productId, entry.catalogs])))
            })
            .catch(() => {
                if (!cancelled) setCatalogsByProduct(new Map())
            })
        return () => {
            cancelled = true
        }
    }, [key])

    return catalogsByProduct
}
