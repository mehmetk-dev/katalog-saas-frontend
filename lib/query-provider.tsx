"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// React Query cache key sabitleri - tüm hook'lar bunları kullanır
export const queryKeys = {
    // Products
    products: (params?: Record<string, unknown>) => ["products", params] as const,
    productIds: () => ["product-ids"] as const,

    // Catalogs
    catalogs: () => ["catalogs"] as const,
    catalog: (id: string) => ["catalog", id] as const,

    // Stats
    dashboardStats: (timeRange?: string) => ["dashboard-stats", timeRange ?? "30d"] as const,

    // Notifications
    notifications: (limit?: number) => ["notifications", limit ?? 20] as const,

    // User (for consistency - actual user data is in UserContext)
    user: () => ["user"] as const,
} as const

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // 5 dakika boyunca "fresh" say — tekrar fetch yapma
                        staleTime: 5 * 60 * 1000,
                        // 10 dakika cache'te tut (component unmount olsa bile)
                        gcTime: 10 * 60 * 1000,
                        // Sayfa tekrar odaklanınca otomatik refetch yapma
                        refetchOnWindowFocus: false,
                        // Aynı anda aynı key'e gelen istekleri birleştir (dedup)
                        // Bu zaten default true, burada belgeleme amaçlı
                        // Tab/pencere arası geçişte gereksiz refetch yapma
                        refetchOnReconnect: false,
                        // Hata durumunda 1 kez retry yap
                        retry: 1,
                        retryDelay: 1000,
                    },
                    mutations: {
                        retry: 0,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
