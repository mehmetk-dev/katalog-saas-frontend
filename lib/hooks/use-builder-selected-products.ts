"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getProductsByIds, type Product } from "@/lib/actions/products"

const PRODUCT_ID_MAX_LENGTH = 128
const FETCH_CHUNK_SIZE = 100
const FETCH_CONCURRENCY_LIMIT = 3
// PERF: Cap on retained product cache to prevent unbounded heap growth on long sessions.
// Selected products are always preserved; only non-selected excess entries are evicted.
const PRODUCT_CACHE_SOFT_LIMIT = 2000
const REQUEST_SET_SOFT_LIMIT = 5000

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
  // Track when an ID last failed so we don't hammer the backend on every drag event.
  const failedIdTimestampsRef = useRef<Map<string, number>>(new Map())
  const RETRY_DELAY_MS = 30_000

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

  // PERF: Evict non-selected cache entries when the cache grows beyond the soft limit.
  // Keeps insertion order (Map iterates in insertion order) → oldest non-selected first.
  useEffect(() => {
    if (loadedProductsById.size <= PRODUCT_CACHE_SOFT_LIMIT) return
    const selectedSet = new Set(selectedProductIds)
    setLoadedProductsById((prev) => {
      if (prev.size <= PRODUCT_CACHE_SOFT_LIMIT) return prev
      const overflow = prev.size - PRODUCT_CACHE_SOFT_LIMIT
      if (overflow <= 0) return prev
      const next = new Map(prev)
      let removed = 0
      for (const id of prev.keys()) {
        if (removed >= overflow) break
        if (!selectedSet.has(id)) {
          next.delete(id)
          removed++
        }
      }
      return removed > 0 ? next : prev
    })

    // Also bound the requested-ids ref to prevent set bloat.
    if (requestedSelectedProductIdsRef.current.size > REQUEST_SET_SOFT_LIMIT) {
      const trimmed = new Set<string>()
      for (const id of requestedSelectedProductIdsRef.current) {
        if (selectedSet.has(id)) trimmed.add(id)
      }
      requestedSelectedProductIdsRef.current = trimmed
    }
  }, [loadedProductsById, selectedProductIds])

  useEffect(() => {
    const normalizedSelectedIds = normalizeIds(selectedProductIds)
    const now = Date.now()
    const missingSelectedIds = normalizedSelectedIds.filter((id) => !loadedProductsById.has(id))
    const idsToFetch = missingSelectedIds.filter((id) => {
      if (requestedSelectedProductIdsRef.current.has(id)) return false
      const failedAt = failedIdTimestampsRef.current.get(id)
      if (failedAt !== undefined && (now - failedAt) < RETRY_DELAY_MS) return false
      return true
    })

    if (idsToFetch.length === 0) {
      return
    }

    idsToFetch.forEach((id) => requestedSelectedProductIdsRef.current.add(id))

    let cancelled = false
    const run = async () => {
      // PERF(K4): Paralel chunk fetch — 10k seçili üründe 50 seri çağrı yerine
      // hepsi aynı anda backend'e gider; tek sonuç geldiğinde UI'a yazılır.
      const chunks: string[][] = []
      for (let i = 0; i < idsToFetch.length; i += FETCH_CHUNK_SIZE) {
        chunks.push(idsToFetch.slice(i, i + FETCH_CHUNK_SIZE))
      }

      // FIX(N1): Limit concurrency to prevent backend overload (was: all chunks in parallel)
      for (let i = 0; i < chunks.length; i += FETCH_CONCURRENCY_LIMIT) {
        if (cancelled) return
        const batch = chunks.slice(i, i + FETCH_CONCURRENCY_LIMIT)
        await Promise.all(batch.map(async (chunk) => {
          try {
            const chunkProducts = await getProductsByIds(chunk)
            if (cancelled) return
            upsertLoadedProducts(chunkProducts)
          } catch (error) {
            // Mark failed IDs with a timestamp — they can be retried after RETRY_DELAY_MS.
            // Do NOT remove from requestedRef immediately to avoid hammering on every drag event.
            const now = Date.now()
            chunk.forEach((id) => {
              requestedSelectedProductIdsRef.current.delete(id)
              failedIdTimestampsRef.current.set(id, now)
            })
            console.error("Failed to load selected builder products:", error)
          }
        }))
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
