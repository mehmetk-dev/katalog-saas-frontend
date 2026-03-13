"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getProductsByIds, type Product } from "@/lib/actions/products"

const PRODUCT_ID_MAX_LENGTH = 128
const FETCH_CHUNK_SIZE = 200

function isValidProductId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= PRODUCT_ID_MAX_LENGTH
}

function normalizeIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const rawId of ids) {
    if (typeof rawId !== "string") continue
    const id = rawId.trim()
    if (!isValidProductId(id) || seen.has(id)) continue
    seen.add(id)
    normalized.push(id)
  }

  return normalized
}

interface UseBuilderSelectedProductsParams {
  initialProducts: Product[]
  selectedProductIds: string[]
}

export function useBuilderSelectedProducts({
  initialProducts,
  selectedProductIds,
}: UseBuilderSelectedProductsParams) {
  const [loadedProductsById, setLoadedProductsById] = useState<Map<string, Product>>(
    () => new Map(initialProducts.map((product) => [product.id, product]))
  )

  const requestedSelectedProductIdsRef = useRef<Set<string>>(new Set())

  const upsertLoadedProducts = useCallback((incoming: Product[]) => {
    if (!incoming.length) return

    setLoadedProductsById((prev) => {
      const next = new Map(prev)
      let hasChanges = false

      for (const product of incoming) {
        if (!isValidProductId(product.id)) continue

        const existing = next.get(product.id)
        if (!existing || existing.updated_at !== product.updated_at) {
          next.set(product.id, product)
          hasChanges = true
        }
      }

      return hasChanges ? next : prev
    })
  }, [])

  useEffect(() => {
    upsertLoadedProducts(initialProducts)
  }, [initialProducts, upsertLoadedProducts])

  useEffect(() => {
    const normalizedSelectedIds = normalizeIds(selectedProductIds)
    const missingSelectedIds = normalizedSelectedIds.filter((id) => !loadedProductsById.has(id))
    const idsToFetch = missingSelectedIds.filter((id) => !requestedSelectedProductIdsRef.current.has(id))

    if (idsToFetch.length === 0) {
      return
    }

    idsToFetch.forEach((id) => requestedSelectedProductIdsRef.current.add(id))

    let cancelled = false
    const run = async () => {
      for (let i = 0; i < idsToFetch.length; i += FETCH_CHUNK_SIZE) {
        const chunk = idsToFetch.slice(i, i + FETCH_CHUNK_SIZE)

        try {
          const chunkProducts = await getProductsByIds(chunk)
          if (cancelled) return
          upsertLoadedProducts(chunkProducts)
        } catch (error) {
          // Allow retry on future render cycles.
          chunk.forEach((id) => requestedSelectedProductIdsRef.current.delete(id))
          console.error("Failed to load selected builder products:", error)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [selectedProductIds, loadedProductsById, upsertLoadedProducts])

  return {
    productMap: loadedProductsById,
    loadedProductsCount: loadedProductsById.size,
    upsertLoadedProducts,
  }
}
