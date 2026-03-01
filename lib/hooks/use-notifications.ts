"use client"

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { queryKeys } from "@/lib/contexts/query-provider"
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
    type NotificationsResponse,
} from "@/lib/actions/notifications"

// ─── Queries ────────────────────────────────────────────────

/**
 * Bildirimleri çek (60s interval ile auto-refetch)
 */
export function useNotifications(limit = 20) {
    return useQuery({
        queryKey: queryKeys.notifications(limit),
        queryFn: () => getNotifications(limit),
        // Bildirimler için daha kısa staleTime — daha güncel olsun
        staleTime: 30 * 1000, // 30 saniye
        // 60 saniyede bir background refetch
        refetchInterval: 60 * 1000,
        // Sekme aktifken refetch yap (bildirimler için mantıklı)
        refetchOnWindowFocus: true,
    })
}

// ─── Mutations ──────────────────────────────────────────────

export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => markNotificationAsRead(id),
        onMutate: async (id) => {
            // Optimistic update: hemen UI'da okundu olarak işaretle
            await queryClient.cancelQueries({ queryKey: ["notifications"] })
            const prev = queryClient.getQueryData<NotificationsResponse>(
                queryKeys.notifications()
            )
            if (prev) {
                queryClient.setQueryData<NotificationsResponse>(
                    queryKeys.notifications(),
                    {
                        notifications: prev.notifications.map((n) =>
                            n.id === id ? { ...n, is_read: true } : n
                        ),
                        unreadCount: Math.max(0, prev.unreadCount - 1),
                    }
                )
            }
            return { prev }
        },
        onError: (_err, _id, context) => {
            // Hata olursa eski state'e dön
            if (context?.prev) {
                queryClient.setQueryData(queryKeys.notifications(), context.prev)
            }
        },
    })
}

export function useMarkAllNotificationsAsRead() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => markAllNotificationsAsRead(),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["notifications"] })
            const prev = queryClient.getQueryData<NotificationsResponse>(
                queryKeys.notifications()
            )
            if (prev) {
                queryClient.setQueryData<NotificationsResponse>(
                    queryKeys.notifications(),
                    {
                        notifications: prev.notifications.map((n) => ({
                            ...n,
                            is_read: true,
                        })),
                        unreadCount: 0,
                    }
                )
            }
            return { prev }
        },
        onError: (_err, _vars, context) => {
            if (context?.prev) {
                queryClient.setQueryData(queryKeys.notifications(), context.prev)
            }
        },
    })
}

export function useDeleteNotification() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteNotification(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["notifications"] })
            const prev = queryClient.getQueryData<NotificationsResponse>(
                queryKeys.notifications()
            )
            if (prev) {
                const deleted = prev.notifications.find((n) => n.id === id)
                queryClient.setQueryData<NotificationsResponse>(
                    queryKeys.notifications(),
                    {
                        notifications: prev.notifications.filter((n) => n.id !== id),
                        unreadCount: deleted && !deleted.is_read
                            ? Math.max(0, prev.unreadCount - 1)
                            : prev.unreadCount,
                    }
                )
            }
            return { prev }
        },
        onError: (_err, _id, context) => {
            if (context?.prev) {
                queryClient.setQueryData(queryKeys.notifications(), context.prev)
            }
        },
    })
}

export function useDeleteAllNotifications() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => deleteAllNotifications(),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["notifications"] })
            const prev = queryClient.getQueryData<NotificationsResponse>(
                queryKeys.notifications()
            )
            queryClient.setQueryData<NotificationsResponse>(
                queryKeys.notifications(),
                { notifications: [], unreadCount: 0 }
            )
            return { prev }
        },
        onError: (_err, _vars, context) => {
            if (context?.prev) {
                queryClient.setQueryData(queryKeys.notifications(), context.prev)
            }
        },
    })
}
