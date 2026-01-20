"use server"

import { apiFetch } from "@/lib/api"

export interface Notification {
    id: string
    type: string
    title: string
    message: string
    is_read: boolean
    action_url?: string
    metadata?: Record<string, unknown>
    created_at: string
    read_at?: string
}

export interface NotificationsResponse {
    notifications: Notification[]
    unreadCount: number
}

export async function getNotifications(limit = 20, unreadOnly = false): Promise<NotificationsResponse> {
    try {
        const response = await apiFetch<NotificationsResponse>(
            `/notifications?limit=${limit}&unread_only=${unreadOnly}`
        )
        return response
    } catch (error) {
        console.error("Failed to fetch notifications:", error)
        return { notifications: [], unreadCount: 0 }
    }
}

export async function markNotificationAsRead(id: string) {
    try {
        await apiFetch(`/notifications/${id}/read`, { method: "PATCH" })
        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
        return { error: errorMessage }
    }
}

export async function markAllNotificationsAsRead() {
    try {
        await apiFetch("/notifications/read-all", { method: "PATCH" })
        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
        return { error: errorMessage }
    }
}

export async function deleteNotification(id: string) {
    try {
        await apiFetch(`/notifications/${id}`, { method: "DELETE" })
        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
        return { error: errorMessage }
    }
}

export async function deleteAllNotifications() {
    try {
        await apiFetch("/notifications/delete-all", { method: "DELETE" })
        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
        return { error: errorMessage }
    }
}

export async function cancelSubscription() {
    try {
        await apiFetch("/notifications/cancel-subscription", { method: "POST" })
        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
        return { error: errorMessage }
    }
}
