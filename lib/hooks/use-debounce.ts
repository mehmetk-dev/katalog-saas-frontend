"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Debounced değer hook'u - Değer belirli bir süre değişmezse güncellenir
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

/**
 * Debounced callback hook'u - Fonksiyon belirli bir süre çağrılmazsa tetiklenir
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const callbackRef = useRef(callback)

    // Callback'i her zaman güncel tut
    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    const debouncedCallback = useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args)
        }, delay)
    }, [delay]) as T

    // Cleanup
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return debouncedCallback
}

/**
 * Throttled callback hook'u - Fonksiyon belirli aralıklarla çağrılır
 */
export function useThrottledCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
    callback: T,
    delay: number
): T {
    const lastCallRef = useRef<number>(0)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const callbackRef = useRef(callback)

    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    const throttledCallback = useCallback((...args: Parameters<T>) => {
        const now = Date.now()
        const timeSinceLastCall = now - lastCallRef.current

        if (timeSinceLastCall >= delay) {
            lastCallRef.current = now
            callbackRef.current(...args)
        } else {
            // Son çağrıyı beklet
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            timeoutRef.current = setTimeout(() => {
                lastCallRef.current = Date.now()
                callbackRef.current(...args)
            }, delay - timeSinceLastCall)
        }
    }, [delay]) as T

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return throttledCallback
}
