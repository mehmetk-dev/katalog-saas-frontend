"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Package, Download, CreditCard, Sparkles, X } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
    type Notification,
} from "@/lib/actions/notifications"

export function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const fetchNotifications = async () => {
        setIsLoading(true)
        try {
            const data = await getNotifications(20)
            setNotifications(data.notifications)
            setUnreadCount(data.unreadCount)
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Her 60 saniyede bir kontrol et
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    // Dropdown açıldığında yenile
    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id)
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead()
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
    }

    const handleDelete = async (id: string) => {
        await deleteNotification(id)
        const wasUnread = notifications.find(n => n.id === id)?.is_read === false
        setNotifications(prev => prev.filter(n => n.id !== id))
        if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1))
        }
    }

    const handleDeleteAll = async () => {
        await deleteAllNotifications()
        setNotifications([])
        setUnreadCount(0)
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "catalog_created":
                return <Package className="w-4 h-4 text-blue-500" />
            case "catalog_downloaded":
                return <Download className="w-4 h-4 text-green-500" />
            case "subscription_started":
            case "subscription_cancelled":
            case "subscription_expiring":
            case "subscription_expired":
                return <CreditCard className="w-4 h-4 text-violet-500" />
            case "welcome":
                return <Sparkles className="w-4 h-4 text-amber-500" />
            default:
                return <Bell className="w-4 h-4 text-gray-500" />
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Şimdi"
        if (diffMins < 60) return `${diffMins} dk önce`
        if (diffHours < 24) return `${diffHours} saat önce`
        if (diffDays < 7) return `${diffDays} gün önce`
        return date.toLocaleDateString("tr-TR")
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="font-semibold text-sm">Bildirimler</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            onClick={handleMarkAllAsRead}
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Tümünü Okundu İşaretle
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <ScrollArea className="h-[320px]">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                            Yükleniyor...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground">
                            <Bell className="w-8 h-8 mb-2 opacity-30" />
                            <p>Bildirim yok</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-3 hover:bg-muted/50 transition-colors relative group",
                                        !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm truncate",
                                                    !notification.is_read && "font-medium"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatTime(notification.created_at)}
                                                </span>
                                                {notification.action_url && (
                                                    <Link
                                                        href={notification.action_url}
                                                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                                        onClick={() => {
                                                            handleMarkAsRead(notification.id)
                                                            setIsOpen(false)
                                                        }}
                                                    >
                                                        Görüntüle
                                                        <ExternalLink className="w-2.5 h-2.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons on hover */}
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                            >
                                                <Check className="w-3 h-3" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(notification.id)}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="p-2 border-t flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-xs text-destructive hover:text-destructive"
                            onClick={handleDeleteAll}
                        >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Tümünü Temizle
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
