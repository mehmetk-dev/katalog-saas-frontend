"use client"

import { useLayoutEffect, useRef, useState, useCallback } from "react"

interface ResponsiveContainerProps {
    children: React.ReactNode
    contentWidth?: number
    contentHeight?: number
    className?: string
}

export function ResponsiveContainer({
    children,
    contentWidth = 794,
    contentHeight = 1123,
    className = ""
}: ResponsiveContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const rafRef = useRef<number>(0)
    const [scale, setScale] = useState(0)

    const updateScale = useCallback(() => {
        if (containerRef.current) {
            const parentWidth = containerRef.current.offsetWidth
            const newScale = parentWidth / contentWidth
            setScale(newScale)
        }
    }, [contentWidth])

    useLayoutEffect(() => {
        // Initial calc
        updateScale()

        // Observer with rAF throttle to avoid layout thrashing
        const resizeObserver = new ResizeObserver(() => {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(updateScale)
        })

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => {
            cancelAnimationFrame(rafRef.current)
            resizeObserver.disconnect()
        }
    }, [updateScale])

    return (
        <div
            ref={containerRef}
            className={`w-full relative overflow-hidden ${className}`}
            style={{
                aspectRatio: `${contentWidth}/${contentHeight}`,
            }}
        >
            <div
                style={{
                    width: contentWidth,
                    height: contentHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                }}
                className="absolute top-0 left-0"
            >
                {children}
            </div>
        </div>
    )
}
