import React, { useState, useEffect, useRef } from "react"

export const LazyPage = React.memo(({ children, index, isExporting }: { children: React.ReactNode; index: number; isExporting: boolean }) => {
    const ref = useRef<HTMLDivElement>(null)
    // First 3 pages always visible, avoid initial lazy load blink for the top content
    const [isVisible, setIsVisible] = useState(index < 3)

    useEffect(() => {
        // During PDF export, render everything immediately
        if (isExporting) {
            setIsVisible(true)
            return
        }

        // First 3 always visible
        if (index < 3) return

        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                }
            },
            // Start rendering 2000px before visible
            { rootMargin: '2000px 0px' }
        )
        observer.observe(el)

        return () => observer.disconnect()
    }, [index, isExporting])

    return (
        <div ref={ref}>
            {isVisible ? children : (
                <div
                    className="bg-slate-100 rounded-lg animate-pulse"
                    style={{ width: '794px', height: '1123px', margin: '0 auto' }}
                />
            )}
        </div>
    )
})
LazyPage.displayName = 'LazyPage'
