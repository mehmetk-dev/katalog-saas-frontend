"use client"

import { Bell, Check, Info, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const notifications = [
    {
        id: 1,
        title: "İşlem Başarılı",
        description: "PDF dışa aktarma işlemi tamamlandı.",
        time: "2 dk önce",
        read: false,
        type: "success",
    },
    {
        id: 2,
        title: "Yeni Şablon",
        description: "'Modern Grid' şablonu kullanıma açıldı!",
        time: "1 saat önce",
        read: false,
        type: "info",
    },
    {
        id: 3,
        title: "Sistem Bakımı",
        description: "Bu gece 03:00'te kısa süreli bakım yapılacak.",
        time: "5 saat önce",
        read: true,
        type: "warning",
    },
]

export function NotificationsPopover() {
    const unreadCount = notifications.filter((n) => !n.read).length

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-2 border-background shadow-sm">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Bildirimler</h4>
                    <span className="text-xs text-muted-foreground">{unreadCount} okunmamış</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            Bildiriminiz yok
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex gap-3 p-4 text-sm transition-colors hover:bg-muted/50 border-b last:border-0",
                                        !notification.read && "bg-muted/20"
                                    )}
                                >
                                    <div className={cn(
                                        "mt-1 p-2 w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                        notification.type === "success" && "bg-green-100 text-green-600 dark:bg-green-900/30",
                                        notification.type === "info" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                                        notification.type === "warning" && "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30",
                                    )}>
                                        {notification.type === "success" && <Check className="w-4 h-4" />}
                                        {notification.type === "info" && <Info className="w-4 h-4" />}
                                        {notification.type === "warning" && <AlertTriangle className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("font-medium leading-none", !notification.read && "text-foreground")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.description}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground pt-1">
                                            {notification.time}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-2 border-t bg-muted/20 text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8">
                        Tümünü Temizle
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
