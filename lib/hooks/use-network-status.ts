"use client"

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface UseNetworkStatusOptions {
    showToasts?: boolean
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

export function useNetworkStatus(options: UseNetworkStatusOptions = {}): UseNetworkStatusReturn {
    const { showToasts = true, onOnline, onOffline } = options

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
            if (showToasts) {
                toast.success('İnternet bağlantısı geri geldi!', { duration: 3000 })
            }
            onOnline?.()
        }

        const handleOffline = () => {
            setIsOnline(false)
            if (showToasts) {
                toast.error('İnternet bağlantısı kesildi!', {
                    duration: 5000,
                    description: 'Bazı özellikler çalışmayabilir.'
                })
            }
            onOffline?.()
        }

        const nav = navigator as { connection?: unknown; mozConnection?: unknown; webkitConnection?: unknown }
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection

        const updateConnectionInfo = () => {
            if (connection) {
                setConnectionType(connection.type || null)
                setEffectiveType(connection.effectiveType || null)

                const slowTypes = ['slow-2g', '2g']
                setIsSlowConnection(slowTypes.includes(connection.effectiveType))

                if (slowTypes.includes(connection.effectiveType) && showToasts) {
                    toast.warning('Yavaş internet bağlantısı algılandı', {
                        duration: 4000,
                        description: 'Yüklemeler beklenenden uzun sürebilir.'
                    })
                }
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
    }, [showToasts, onOnline, onOffline])

    return {
        isOnline,
        isSlowConnection,
        connectionType,
        effectiveType,
        checkConnection
    }
}
