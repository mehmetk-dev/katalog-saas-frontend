/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import NextImage from "next/image"
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLightbox } from "@/lib/contexts/lightbox-context"
import { getCloudinaryResizedUrl } from "@/lib/utils/image-utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"

// ─── Constants ───────────────────────────────────────────────
const ZOOM_STEP = 0.5
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const LIGHTBOX_IMAGE_SIZE = 1600
const PREFETCH_IMAGE_SIZE = 1600

/** Validate URL starts with a safe protocol */
function isSafeImageUrl(url: string): boolean {
    if (!url) return false
    try {
        const parsed = new URL(url, 'https://placeholder.local')
        return parsed.protocol === 'https:' || parsed.protocol === 'http:'
    } catch {
        return false
    }
}

export function ImageLightbox() {
    const { state, closeLightbox, nextImage, prevImage, goToImage } = useLightbox()
    const { t } = useTranslation()
    const { isOpen, images, currentIndex, productName } = state
    const [zoom, setZoom] = React.useState(1)
    const [mounted, setMounted] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)

    const currentImage = images[currentIndex] || ""

    const displayImage = useMemo(() => {
        if (!currentImage || !isSafeImageUrl(currentImage)) return ""
        return getCloudinaryResizedUrl(currentImage, LIGHTBOX_IMAGE_SIZE)
    }, [currentImage])

    // Client-side only rendering
    useEffect(() => {
        setMounted(true)
    }, [])

    // Keyboard controls
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    closeLightbox()
                    break
                case 'ArrowLeft':
                    prevImage()
                    break
                case 'ArrowRight':
                    nextImage()
                    break
                case '+':
                case '=':
                    setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM))
                    break
                case '-':
                    setZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM))
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, closeLightbox, nextImage, prevImage])

    // Reset loading & zoom on index change
    useEffect(() => {
        setIsLoading(true)
    }, [currentIndex])

    const handleBackdropClick = useCallback(() => {
        closeLightbox()
    }, [closeLightbox])

    const hasMultiple = images.length > 1
    const nextIdx = images.length > 0 ? (currentIndex + 1) % images.length : 0
    const prevIdx = images.length > 0 ? (currentIndex - 1 + images.length) % images.length : 0

    // Prefetch only adjacent images (max 2) instead of entire catalog
    const prefetchUrls = useMemo(() => {
        if (!hasMultiple) return []
        const urls: string[] = []
        const next = images[nextIdx]
        const prev = images[prevIdx]
        if (next && isSafeImageUrl(next)) urls.push(getCloudinaryResizedUrl(next, PREFETCH_IMAGE_SIZE))
        if (prev && isSafeImageUrl(prev) && prevIdx !== nextIdx) urls.push(getCloudinaryResizedUrl(prev, PREFETCH_IMAGE_SIZE))
        return urls
    }, [hasMultiple, images, nextIdx, prevIdx])

    if (!mounted || !isOpen) return null

    const lightboxContent = (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300"
            onClick={handleBackdropClick}
        >
            {/* Prefetch only next/prev images for performance */}
            {prefetchUrls.length > 0 && (
                <div className="hidden" aria-hidden="true">
                    {prefetchUrls.map((url, idx) => (
                        <img key={`prefetch-${idx}`} src={url} alt="" />
                    ))}
                </div>
            )}

            {/* Top Controls */}
            <div
                className="absolute top-4 left-0 right-0 z-20 px-4 pointer-events-none flex items-start justify-between"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Product Name - Desktop only */}
                <div className="hidden md:block pointer-events-auto">
                    {productName && (
                        <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 max-w-[200px] lg:max-w-[300px]">
                            <span className="text-white text-xs font-medium truncate block">{productName}</span>
                        </div>
                    )}
                </div>

                {/* Center: Zoom Controls */}
                <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                        <button
                            onClick={() => setZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM))}
                            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all transform active:scale-95"
                            aria-label={t('common.zoomOut') || 'Zoom Out'}
                        >
                            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <span className="text-white text-[10px] sm:text-xs font-mono min-w-[2.5rem] sm:min-w-[3rem] text-center select-none font-bold">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM))}
                            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all transform active:scale-95"
                            aria-label={t('common.zoomIn') || 'Zoom In'}
                        >
                            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={closeLightbox}
                    className="pointer-events-auto p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 transition-all group"
                    aria-label={t('common.close') || 'Close'}
                >
                    <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
                </button>
            </div>

            {/* Navigation Arrows */}
            {hasMultiple && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all group"
                        aria-label={t('common.previousImage') || 'Previous image'}
                    >
                        <ChevronLeft className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all group"
                        aria-label={t('common.nextImage') || 'Next image'}
                    >
                        <ChevronRight className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </button>
                </>
            )}

            {/* Main Image Area */}
            <div className="relative w-full h-full flex items-center justify-center p-12">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                )}

                <div
                    key={currentIndex}
                    className={cn(
                        "relative transition-all duration-500 ease-out pointer-events-auto",
                        isLoading
                            ? "opacity-0 scale-90 blur-sm"
                            : "opacity-100 scale-100 blur-0 animate-in zoom-in-90 fade-in duration-500"
                    )}
                    style={{ transform: `scale(${zoom})` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <NextImage
                        src={displayImage}
                        alt={productName || (t('common.productImage') || 'Product image')}
                        width={LIGHTBOX_IMAGE_SIZE}
                        height={LIGHTBOX_IMAGE_SIZE}
                        className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                        priority
                        unoptimized
                        onLoad={() => setIsLoading(false)}
                    />
                </div>
            </div>

            {/* Dots Indicator */}
            {hasMultiple && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); goToImage(index); }}
                            className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all",
                                index === currentIndex
                                    ? "bg-white w-4"
                                    : "bg-white/30 hover:bg-white/50"
                            )}
                            aria-label={`${t('common.imageOf')?.replace('{index}', String(index + 1)) || `Image ${index + 1}`}`}
                        />
                    ))}
                </div>
            )}

            {/* Image Counter */}
            {hasMultiple && (
                <div className="absolute bottom-6 right-4 sm:right-6 z-20 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                    <span className="text-white text-[10px] sm:text-xs font-mono">
                        {currentIndex + 1} / {images.length}
                    </span>
                </div>
            )}
        </div>
    )

    return createPortal(lightboxContent, document.body)
}
