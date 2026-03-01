"use client"

import { useState, useEffect } from "react"

interface WindowSize {
    width: number
    height: number
}

// PERF(F6): Single shared resize listener — replaces 4 separate listeners
// across catalog-editor, editor-content-tab, catalog-preview, and use-builder-state
export function useWindowSize(): WindowSize {
    const [size, setSize] = useState<WindowSize>({
        width: typeof window !== "undefined" ? window.innerWidth : 1024,
        height: typeof window !== "undefined" ? window.innerHeight : 768,
    })

    useEffect(() => {
        let rafId: number | null = null

        const handleResize = () => {
            // Debounce with rAF to avoid layout thrashing
            if (rafId !== null) return
            rafId = requestAnimationFrame(() => {
                setSize({ width: window.innerWidth, height: window.innerHeight })
                rafId = null
            })
        }

        // Initial measurement
        handleResize()

        window.addEventListener("resize", handleResize)
        return () => {
            window.removeEventListener("resize", handleResize)
            if (rafId !== null) cancelAnimationFrame(rafId)
        }
    }, [])

    return size
}

/** Convenience: returns true when width < breakpoint (default 768) */
export function useIsMobile(breakpoint = 768): boolean {
    const { width } = useWindowSize()
    return width < breakpoint
}
