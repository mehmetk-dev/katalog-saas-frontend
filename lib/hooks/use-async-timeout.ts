"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'

interface UseAsyncTimeoutOptions {
    /** Toplam zaman aşımı süresi (ms) - varsayılan 60 saniye */
    totalTimeoutMs?: number
    /** İlerleme olmadan bekleme süresi (ms) - varsayılan 15 saniye */
    stuckTimeoutMs?: number
    /** Zaman aşımında çağrılacak fonksiyon */
    onTimeout?: () => void
    /** Zaman aşımı mesajı */
    timeoutMessage?: string
    /** Otomatik toast göster */
    showToast?: boolean
}

interface UseAsyncTimeoutReturn<T> {
    /** Async fonksiyonu çalıştır */
    execute: (fn: () => Promise<T>) => Promise<T | null>
    /** Yükleme durumu */
    isLoading: boolean
    /** Zaman aşımı oldu mu */
    hasTimeout: boolean
    /** İlerleme yüzdesini güncelle (0-100) */
    setProgress: (progress: number) => void
    /** Mevcut ilerleme */
    progress: number
    /** Zaman aşımını sıfırla ve tekrar dene */
    reset: () => void
    /** İşlemi iptal et */
    cancel: () => void
    /** İşlem iptal edildi mi */
    isCancelled: boolean
    /** İşlem iptal edildi mi (Ref check - stale proof) */
    checkCancelled: () => boolean
    /** Hata mesajı */
    error: string | null
}

export function useAsyncTimeout<T = void>(
    options: UseAsyncTimeoutOptions = {}
): UseAsyncTimeoutReturn<T> {
    const {
        totalTimeoutMs = 120000, // 120 saniye
        stuckTimeoutMs = 30000, // 30 saniye
        onTimeout,
        timeoutMessage = "İşlem zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin.",
        showToast = true
    } = options

    const [isLoading, setIsLoading] = useState(false)
    const [hasTimeout, setHasTimeout] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [isCancelled, setIsCancelled] = useState(false)

    const startTimeRef = useRef<number | null>(null)
    const lastProgressTimeRef = useRef<number | null>(null)
    const lastProgressRef = useRef<number>(0)
    const cancelledRef = useRef(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    // Timeout kontrolü
    useEffect(() => {
        if (!isLoading) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }

        // İlerleme referansını güncelle
        lastProgressRef.current = progress

        intervalRef.current = setInterval(() => {
            if (cancelledRef.current) return

            const now = Date.now()
            const totalElapsed = now - (startTimeRef.current || now)
            const stuckTime = now - (lastProgressTimeRef.current || now)

            // Zaman aşımı kontrolü
            // 1. İlerleme var ama çok uzun süredir aynı değerde (takılma)
            // 2. Toplam süre aşıldı
            const isStuck = progress < 100 && stuckTime > stuckTimeoutMs
            const isTotalExceeded = totalElapsed > totalTimeoutMs

            if (isStuck || isTotalExceeded) {
                cancelledRef.current = true
                setIsCancelled(true)
                setHasTimeout(true)
                setIsLoading(false)
                setError(timeoutMessage)

                if (showToast) {
                    toast.error(timeoutMessage)
                }

                onTimeout?.()

                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current = null
                }
            }
        }, 1000)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [isLoading, progress, stuckTimeoutMs, totalTimeoutMs, timeoutMessage, showToast, onTimeout])

    const execute = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
        // Reset state
        setIsLoading(true)
        setHasTimeout(false)
        setError(null)
        setProgress(0)
        setIsCancelled(false) // Added this line
        cancelledRef.current = false
        startTimeRef.current = Date.now()
        lastProgressTimeRef.current = Date.now()
        lastProgressRef.current = 0

        try {
            const result = await fn()

            if (cancelledRef.current) {
                return null
            }

            setIsLoading(false)
            setProgress(100)
            return result
        } catch (err: unknown) {
            if (cancelledRef.current) {
                return null
            }

            const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu'
            setError(errorMessage)
            setIsLoading(false)

            if (showToast) {
                toast.error(errorMessage)
            }

            return null
        }
    }, [showToast])

    const reset = useCallback(() => {
        setIsLoading(false)
        setHasTimeout(false)
        setError(null)
        setProgress(0)
        setIsCancelled(false)
        cancelledRef.current = false
        startTimeRef.current = null
        lastProgressTimeRef.current = null
        lastProgressRef.current = 0
    }, [])

    const cancel = useCallback(() => {
        cancelledRef.current = true
        setIsCancelled(true)
        setIsLoading(false)
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    const updateProgress = useCallback((newProgress: number) => {
        setProgress(Math.min(100, Math.max(0, newProgress)))
        lastProgressTimeRef.current = Date.now()
    }, [])

    const checkCancelled = useCallback(() => cancelledRef.current, [])

    return {
        execute,
        isLoading,
        hasTimeout,
        setProgress: updateProgress,
        progress,
        reset,
        cancel,
        isCancelled,
        checkCancelled,
        error
    }
}

// Basit bir fetch wrapper with timeout
export async function fetchWithTimeout<T>(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 30000
): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error: unknown) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('İstek zaman aşımına uğradı')
        }

        throw error
    }
}
