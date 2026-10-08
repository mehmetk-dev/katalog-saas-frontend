"use client"

import { useState, useEffect } from "react"

interface WindowSize {
    width: number
    height: number
}

const SERVER_SIZE: WindowSize = { width: 1024, height: 768 }

// PERF(F6): Single shared resize listener — replaces 4 separate listeners
// across catalog-editor, editor-content-tab, catalog-preview, and use-builder-state
export function useWindowSize(): WindowSize {
    // İlk render sunucuyla aynı olmalı (hydration); gerçek ölçüm mount sonrası effect'te yapılır.
    // Mobil/masaüstü yerleşim farkları mümkün olduğunca CSS breakpoint'leriyle çözülmeli.
    const [size, setSize] = useState<WindowSize>(SERVER_SIZE)

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
