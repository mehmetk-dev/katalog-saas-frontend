"use client"

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { queryKeys } from "@/lib/contexts/query-provider"
import {
    getCatalogs,
    getCatalog,
    getDashboardStats,
    createCatalog,
    updateCatalog,
    deleteCatalog,
    type Catalog,
    type DashboardStats,
} from "@/lib/actions/catalogs"

// ─── Queries ────────────────────────────────────────────────

/**
 * Tüm katalogları çek (client-side cache ile)
 * SSR'dan gelen data → initialData + staleTime:Infinity (cache'le ve refetch yapma)
 */
export function useCatalogs(initialData?: Catalog[]) {
    return useQuery({
        queryKey: queryKeys.catalogs(),
        queryFn: () => getCatalogs(),
        initialData,
        // SSR data varsa → sonsuz fresh (refetch YAPMA)
        staleTime: initialData ? Infinity : 5 * 60 * 1000,
        // initialData yoksa sadece stale olduğunda yeniden çek
        refetchOnMount: initialData ? false : true,
    })
}

/**
 * Tek bir katalog çek
 */
export function useCatalog(id: string, initialData?: Catalog) {
    return useQuery({
        queryKey: queryKeys.catalog(id),
        queryFn: () => getCatalog(id),
        initialData,
        staleTime: initialData ? Infinity : 5 * 60 * 1000,
        // initialData yoksa sadece stale olduğunda yeniden çek
        refetchOnMount: initialData ? false : true,
        enabled: !!id,
    })
}

/**
 * Dashboard istatistiklerini çek
 */
export function useDashboardStats(
    timeRange: "7d" | "30d" | "90d" = "30d",
    initialData?: DashboardStats | null
) {
    return useQuery({
        queryKey: queryKeys.dashboardStats(timeRange),
        queryFn: () => getDashboardStats(timeRange),
        initialData: initialData ?? undefined,
        // Fix #10: Use reasonable staleTime instead of Infinity — prevents stale data on timeRange switch
        staleTime: 5 * 60 * 1000,
        refetchOnMount: true,
        // Fix #15: Auto-refresh every 60s for near-real-time analytics
        refetchInterval: 60 * 1000,
    })
}

// ─── Mutations ──────────────────────────────────────────────

/**
 * Yeni katalog oluştur ve cache'i otomatik güncelle
 */
export function useCreateCatalog() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { name: string; layout: string }) => createCatalog(data),
        onSuccess: () => {
            // Katalog listesini ve stats'i yenile
            queryClient.invalidateQueries({ queryKey: queryKeys.catalogs() })
            // Fix #6: Prefix-based invalidate — clears all timeRange variants (7d/30d/90d)
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        },
    })
}

/**
 * Katalog güncelle ve cache'i otomatik güncelle
 */
export function useUpdateCatalog() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Catalog> }) =>
            updateCatalog(id, data),
        onSuccess: (_result, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.catalog(variables.id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.catalogs() })
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        },
    })
}

/**
 * Katalog sil ve cache'i otomatik güncelle
 */
export function useDeleteCatalog() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteCatalog(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.catalogs() })
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        },
    })
}

// ─── Cache Utilities ────────────────────────────────────────

/**
 * Manuel olarak catalogs cache'ini invalidate et
 * (component dışından çağırılabilir)
 */
export function useInvalidateCatalogs() {
    const queryClient = useQueryClient()
    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogs() })
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    }
}
