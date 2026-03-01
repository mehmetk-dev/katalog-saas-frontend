"use client"

import { useNetworkStatus } from "@/lib/hooks/use-network-status"
import { useTranslation } from "@/lib/contexts/i18n-provider"

export function NetworkStatusBanner() {
    const { isOnline, isSlowConnection } = useNetworkStatus({ showToasts: false })
    const { t } = useTranslation()

    if (isOnline && !isSlowConnection) return null

    return (
        <div
            role="alert"
            className={`fixed top-0 left-0 right-0 z-[9999] py-2 px-4 text-center text-sm font-medium ${!isOnline
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}
        >
            {!isOnline ? (
                <span>{t('common.offlineMode') || 'No internet connection — You are offline'}</span>
            ) : (
                <span>{t('common.slowConnection') || 'Slow connection detected — Operations may take longer'}</span>
            )}
        </div>
    )
}
