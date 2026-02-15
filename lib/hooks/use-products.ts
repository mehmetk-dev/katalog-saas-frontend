"use client"

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-provider"
import {
    getProducts,
    getAllProductIds,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProducts,
    type ProductsResponse,
} from "@/lib/actions/products"

// ─── Queries ────────────────────────────────────────────────

/**
 * Ürün listesini çek (pagination + filter destekli)
 * SSR'dan gelen data → initialData + staleTime:Infinity (cache'le ve refetch yapma)
 */
export function useProducts(
    params?: { page?: number; limit?: number; category?: string; search?: string },
    initialData?: ProductsResponse
) {
    return useQuery({
        queryKey: queryKeys.products(params as Record<string, unknown>),
        queryFn: () => getProducts(params),
        initialData,
        staleTime: initialData ? Infinity : 5 * 60 * 1000,
        // initialData yoksa sadece stale olduğunda yeniden çek
        refetchOnMount: initialData ? false : true,
    })
}

/**
 * Tüm ürün ID'lerini çek (katalog builder'da kullanılır)
 */
export function useAllProductIds(initialData?: string[]) {
    return useQuery({
        queryKey: queryKeys.productIds(),
        queryFn: () => getAllProductIds(),
        initialData,
        staleTime: initialData ? Infinity : 10 * 60 * 1000,
        // initialData yoksa sadece stale olduğunda yeniden çek
        refetchOnMount: initialData ? false : true,
    })
}

// ─── Mutations ──────────────────────────────────────────────

/**
 * Yeni ürün oluştur ve cache'i otomatik güncelle
 */
export function useCreateProduct() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (formData: FormData) => createProduct(formData),
        onSuccess: () => {
            // Tüm ürün query'lerini ve dashboard stats'i yenile
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: queryKeys.productIds() })
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() })
        },
    })
}

/**
 * Ürün güncelle
 */
export function useUpdateProduct() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
            updateProduct(id, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
        },
    })
}

/**
 * Tek ürün sil
 */
export function useDeleteProduct() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: queryKeys.productIds() })
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() })
        },
    })
}

/**
 * Toplu ürün sil
 */
export function useBulkDeleteProducts() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (ids: string[]) => deleteProducts(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: queryKeys.productIds() })
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() })
        },
    })
}

// ─── Cache Utilities ────────────────────────────────────────

/**
 * Manuel olarak products cache'ini invalidate et
 */
export function useInvalidateProducts() {
    const queryClient = useQueryClient()
    return () => {
        queryClient.invalidateQueries({ queryKey: ["products"] })
        queryClient.invalidateQueries({ queryKey: queryKeys.productIds() })
    }
}
