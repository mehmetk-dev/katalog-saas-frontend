"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { getProducts, type BulkFieldUpdate, type Product, type ProductsResponse } from "@/lib/actions/products"
import { useDebouncedValue } from "@/lib/hooks/use-debounce"

interface UseExcelProductsParams {
  initialProducts: Product[]
  initialMetadata: ProductsResponse["metadata"]
}

interface UseExcelProductsResult {
  products: Product[]
  metadata: ProductsResponse["metadata"]
  search: string
  setSearch: (value: string) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  isLoading: boolean
  refreshCurrentPage: () => Promise<void>
  applyLocalCommit: (payload: { updates: BulkFieldUpdate[]; deletedIds: string[] }) => void
}

export function useExcelProducts({ initialProducts, initialMetadata }: UseExcelProductsParams): UseExcelProductsResult {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [metadata, setMetadata] = useState<ProductsResponse["metadata"]>(initialMetadata)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(initialMetadata.page)
  const [isLoading, setIsLoading] = useState(false)

  const requestSeq = useRef(0)
  const hasBootstrapped = useRef(false)
  const debouncedSearch = useDebouncedValue(search.trim(), 250)

  const limit = initialMetadata.limit

  const fetchPage = useCallback(async (page: number, searchQuery: string) => {
    const requestId = ++requestSeq.current
    setIsLoading(true)

    try {
      const response = await getProducts({
        page,
        limit,
        search: searchQuery || undefined,
      })

      if (requestSeq.current !== requestId) {
        return
      }

      setProducts(response.products)
      setMetadata(response.metadata)

      // Keep current page in sync with backend clamping
      if (response.metadata.page !== page) {
        setCurrentPage(response.metadata.page)
      }
    } catch {
      // Keep previous state on fetch errors.
    } finally {
      if (requestSeq.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [limit])

  useEffect(() => {
    if (!hasBootstrapped.current) {
      hasBootstrapped.current = true
      const isInitialState = currentPage === initialMetadata.page && debouncedSearch.length === 0
      if (isInitialState) {
        return
      }
    }

    void fetchPage(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch, fetchPage, initialMetadata.page])

  const handleSetSearch = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const refreshCurrentPage = useCallback(async () => {
    await fetchPage(currentPage, debouncedSearch)
  }, [fetchPage, currentPage, debouncedSearch])

  const applyLocalCommit = useCallback((payload: { updates: BulkFieldUpdate[]; deletedIds: string[] }) => {
    const deletedSet = new Set(payload.deletedIds)

    setProducts((prev) => {
      const byId = new Map<string, Product>()

      prev.forEach((product) => {
        if (deletedSet.has(product.id)) return
        byId.set(product.id, { ...product })
      })

      payload.updates.forEach((update) => {
        const existing = byId.get(update.id)
        if (!existing) return

        const next: Product = { ...existing }
        if (update.name !== undefined) next.name = update.name
        if (update.sku !== undefined) next.sku = update.sku
        if (update.price !== undefined) next.price = update.price
        if (update.stock !== undefined) next.stock = update.stock
        if (update.category !== undefined) next.category = update.category
        if (update.description !== undefined) next.description = update.description
        if (update.product_url !== undefined) next.product_url = update.product_url
        if (update.custom_attributes !== undefined) next.custom_attributes = update.custom_attributes

        byId.set(update.id, next)
      })

      return Array.from(byId.values())
    })
  }, [])

  return useMemo(() => ({
    products,
    metadata,
    search,
    setSearch: handleSetSearch,
    currentPage,
    setCurrentPage,
    isLoading,
    refreshCurrentPage,
    applyLocalCommit,
  }), [products, metadata, search, currentPage, isLoading, refreshCurrentPage, applyLocalCommit, handleSetSearch])
}
