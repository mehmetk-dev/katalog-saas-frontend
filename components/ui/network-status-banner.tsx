"use client"

import { useNetworkStatus } from "@/lib/hooks/use-network-status"

export function NetworkStatusBanner() {
    const { isOnline, isSlowConnection } = useNetworkStatus({ showToasts: false })

    if (isOnline && !isSlowConnection) return null

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[9999] py-2 px-4 text-center text-sm font-medium ${!isOnline
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}
        >
            {!isOnline ? (
                <span>📡 İnternet bağlantısı yok - Çevrimdışı moddasınız</span>
            ) : (
                <span>🐢 Yavaş bağlantı algılandı - İşlemler uzun sürebilir</span>
            )}
        </div>
    )
}
