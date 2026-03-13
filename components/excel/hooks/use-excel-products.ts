"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { getProducts, type Product, type ProductsResponse } from "@/lib/actions/products"
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

  return useMemo(() => ({
    products,
    metadata,
    search,
    setSearch: handleSetSearch,
    currentPage,
    setCurrentPage,
    isLoading,
    refreshCurrentPage,
  }), [products, metadata, search, currentPage, isLoading, refreshCurrentPage, handleSetSearch])
}
