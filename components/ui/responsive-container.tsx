"use client"

import { useEffect, useRef, useState } from "react"

interface ResponsiveContainerProps {
    children: React.ReactNode
    aspectRatio?: number // width / height
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
    const [scale, setScale] = useState(0.35)

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const parentWidth = containerRef.current.offsetWidth
                const newScale = parentWidth / contentWidth
                setScale(newScale)
            }
        }

        // Initial calc
        updateScale()

        // Observer
        const resizeObserver = new ResizeObserver(() => {
            updateScale()
        })

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => resizeObserver.disconnect()
    }, [contentWidth])

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
