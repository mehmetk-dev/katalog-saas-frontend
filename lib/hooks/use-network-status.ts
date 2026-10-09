"use client"

import { useState, useEffect, useCallback } from 'react'

/** Durum, NetworkStatusBanner'da (çevrili) gösterilir; hook kendi bildirimini açmaz */
interface UseNetworkStatusOptions {
    onOnline?: () => void
    onOffline?: () => void
}

interface UseNetworkStatusReturn {
    isOnline: boolean
    isSlowConnection: boolean
    connectionType: string | null
    effectiveType: string | null
    checkConnection: () => Promise<boolean>
}

interface NetworkInformation extends EventTarget {
    readonly type?: string
    readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
    onchange: ((this: NetworkInformation, ev: Event) => void) | null
}

export function useNetworkStatus(options: UseNetworkStatusOptions = {}): UseNetworkStatusReturn {
    const { onOnline, onOffline } = options

    const [isOnline, setIsOnline] = useState(true)
    const [isSlowConnection, setIsSlowConnection] = useState(false)
    const [connectionType, setConnectionType] = useState<string | null>(null)
    const [effectiveType, setEffectiveType] = useState<string | null>(null)

    const checkConnection = useCallback(async (): Promise<boolean> => {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)

            const response = await fetch('/api/health', {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-store'
            })

            clearTimeout(timeoutId)
            return response.ok
        } catch {
            return false
        }
    }, [])

    useEffect(() => {
        setIsOnline(navigator.onLine)

        const handleOnline = () => {
            setIsOnline(true)
            onOnline?.()
        }

        const handleOffline = () => {
            setIsOnline(false)
            onOffline?.()
        }

        const nav = navigator as Navigator & {
            connection?: NetworkInformation
            mozConnection?: NetworkInformation
            webkitConnection?: NetworkInformation
        }
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection

        const updateConnectionInfo = () => {
            if (connection) {
                setConnectionType(connection.type || null)
                setEffectiveType(connection.effectiveType || null)

                const slowTypes = ['slow-2g', '2g']
                setIsSlowConnection(slowTypes.includes(connection.effectiveType))
            }
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        if (connection) {
            connection.addEventListener('change', updateConnectionInfo)
            updateConnectionInfo()
        }

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            if (connection) {
                connection.removeEventListener('change', updateConnectionInfo)
            }
        }
    }, [onOnline, onOffline])

    return {
        isOnline,
        isSlowConnection,
        connectionType,
        effectiveType,
        checkConnection
    }
}
