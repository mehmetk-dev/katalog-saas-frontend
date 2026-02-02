"use client"

import React, { useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import NextImage from "next/image"
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLightbox } from "@/lib/lightbox-context"
import { getCloudinaryResizedUrl } from "@/lib/image-utils"

export function ImageLightbox() {
    const { state, closeLightbox, nextImage, prevImage, goToImage } = useLightbox()
    const { isOpen, images, currentIndex, productName } = state
    const [zoom, setZoom] = React.useState(1)
    const [mounted, setMounted] = React.useState(false)

    // Client-side only rendering için
    useEffect(() => {
        setMounted(true)
    }, [])

    // Klavye kontrolü
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
                    setZoom(z => Math.min(z + 0.5, 3))
                    break
                case '-':
                    setZoom(z => Math.max(z - 0.5, 0.5))
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, closeLightbox, nextImage, prevImage])

    const [isLoading, setIsLoading] = React.useState(true)

    // Reset loading on index change
    useEffect(() => {
        setIsLoading(true)
    }, [currentIndex])

    const handleBackdropClick = useCallback(() => {
        closeLightbox()
    }, [closeLightbox])

    if (!mounted || !isOpen) return null

    const currentImage = images[currentIndex]
    const hasMultiple = images.length > 1
    const nextIdx = (currentIndex + 1) % images.length
    const prevIdx = (currentIndex - 1 + images.length) % images.length

    // Optimize large image (limit to 2000px for 4K screens, but 1600px is safer for speed)
    const displayImage = React.useMemo(() => {
        return getCloudinaryResizedUrl(currentImage, 1600)
    }, [currentImage])

    const lightboxContent = (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300"
            onClick={handleBackdropClick}
        >
            {/* Prefetch Next/Prev Images */}
            <div className="hidden">
                {images.length > 1 && (
                    <>
                        <img src={images[nextIdx]} alt="" />
                        <img src={images[prevIdx]} alt="" />
                    </>
                )}
            </div>

            {/* Top Controls - Structured for no overlap */}
            <div
                className="absolute top-4 left-0 right-0 z-20 px-4 pointer-events-none flex items-start justify-between"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Product Name - Only on Desktop/Large Tablets */}
                <div className="hidden md:block pointer-events-auto">
                    {productName && (
                        <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 max-w-[200px] lg:max-w-[300px]">
                            <span className="text-white text-xs font-medium truncate block">{productName}</span>
                        </div>
                    )}
                </div>

                {/* Center: Zoom Controls - ALWAYS CENTERED */}
                <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                        <button
                            onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
                            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all transform active:scale-95"
                            aria-label="Uzaklaştır"
                        >
                            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <span className="text-white text-[10px] sm:text-xs font-mono min-w-[2.5rem] sm:min-w-[3rem] text-center select-none font-bold">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom(z => Math.min(z + 0.5, 3))}
                            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all transform active:scale-95"
                            aria-label="Yakınlaştır"
                        >
                            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>

                {/* Close Button - Right corner */}
                <button
                    onClick={closeLightbox}
                    className="pointer-events-auto p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 transition-all group"
                    aria-label="Kapat"
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
                        aria-label="Önceki görsel"
                    >
                        <ChevronLeft className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all group"
                        aria-label="Sonraki görsel"
                    >
                        <ChevronRight className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </button>
                </>
            )}

            {/* Main Image Area */}
            <div className="relative w-full h-full flex items-center justify-center p-12">
                {/* Loading Spinner */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                )}

                <div
                    key={currentIndex}
                    className={cn(
                        "relative transition-all duration-500 ease-out pointer-events-auto",
                        // Improved Animation: Start slightly smaller and fade in
                        isLoading
                            ? "opacity-0 scale-90 blur-sm"
                            : "opacity-100 scale-100 blur-0 animate-in zoom-in-90 fade-in duration-500"
                    )}
                    style={{ transform: `scale(${zoom})` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <NextImage
                        src={displayImage}
                        alt={productName || "Ürün görseli"}
                        width={1600}
                        height={1600}
                        className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                        priority
                        unoptimized // Using optimized Cloudinary URL manually
                        onLoadingComplete={() => setIsLoading(false)}
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
                            aria-label={`Görsel ${index + 1}`}
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

    // Portal ile body'e render et
    return createPortal(lightboxContent, document.body)
}
