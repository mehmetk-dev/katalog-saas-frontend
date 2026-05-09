'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import NextImage from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLightbox } from '@/lib/contexts/lightbox-context'
import { getOptimizedImageUrl } from '@/lib/utils/image-utils'
import { useTranslation } from '@/lib/contexts/i18n-provider'
import type { Product } from '@/lib/actions/products'

// PERF: Auto-eager-load the first N product images (roughly first catalog page).
// Module-level counter — resets on page navigation (full remount).
let _mountCounter = 0
const EAGER_IMAGE_THRESHOLD = 12
const PdfExportModeContext = createContext(false)

export function PdfExportModeProvider({
    children,
    enabled = true,
}: {
    children: React.ReactNode
    enabled?: boolean
}) {
    return <PdfExportModeContext.Provider value={enabled}>{children}</PdfExportModeContext.Provider>
}

function usePdfExportMode() {
    return useContext(PdfExportModeContext)
}

interface ProductImageGalleryProps {
    product: Product
    className?: string
    imageClassName?: string
    imageFit?: 'cover' | 'contain' | 'fill'
    showNavigation?: boolean // Galeri navigasyonu göster
    interactive?: boolean // Tıklama ile lightbox aç
    aspectRatio?: string // Özel aspect ratio (örn: "aspect-square")
    priority?: boolean // İlk görseli anında (lazy-load olmadan) yükle
    showImageCount?: boolean // Birden fazla görsel badge'i göster
}

/**
 * Ürün Görsel Galerisi
 *
 * - Birden fazla görsel varsa navigasyon okları gösterir
 * - Tıklandığında lightbox açar (interactive=true ise)
 * - Template'lerde kullanılmak üzere tasarlandı
 */
export function ProductImageGallery({
    product,
    className,
    imageClassName,
    imageFit = 'cover',
    showNavigation = true,
    interactive = true,
    aspectRatio,
    priority = false,
    showImageCount = true,
}: ProductImageGalleryProps) {
    const isPdfExportMode = usePdfExportMode()

    // PERF: Auto-priority for first N images — no template changes needed
    const autoEager = React.useMemo(() => {
        if (isPdfExportMode) return false
        const idx = _mountCounter++
        return idx < EAGER_IMAGE_THRESHOLD
    }, [isPdfExportMode])
    const shouldPrioritize = !isPdfExportMode && (priority || autoEager)
    const effectiveInteractive = !isPdfExportMode && interactive
    const effectiveShowNavigation = !isPdfExportMode && showNavigation
    const effectiveShowImageCount = !isPdfExportMode && showImageCount

    const [currentIndex, setCurrentIndex] = useState(0)
    const [isLoaded, setIsLoaded] = useState(false)
    const { openLightbox } = useLightbox()
    const { t } = useTranslation()

    // Tüm görselleri birleştir (image_url + images array)
    const allImages = React.useMemo(() => {
        const images: string[] = []

        // Ana görsel
        if (product.image_url) {
            images.push(product.image_url)
        }

        // Ek görseller (tekrarları önle)
        if (product.images && product.images.length > 0) {
            product.images.forEach((img) => {
                if (img && !images.includes(img)) {
                    images.push(img)
                }
            })
        }

        // Hiç görsel yoksa placeholder
        if (images.length === 0) {
            images.push('/placeholder.svg')
        }

        return images
    }, [product.image_url, product.images])

    const hasMultiple = allImages.length > 1
    const currentImage = allImages[currentIndex] || '/placeholder.svg'

    // Grid görünümü için optimize edilmiş görsel kullan
    // 400px genişlik katalog grid'i için yeterli (2-3 sütun × ~200-350px)
    const displayImage = React.useMemo(() => {
        return getOptimizedImageUrl(currentImage, 400)
    }, [currentImage])

    // Reset loading state when image changes (gallery navigation)
    const prevImageRef = useRef(displayImage)
    if (prevImageRef.current !== displayImage) {
        prevImageRef.current = displayImage
        setIsLoaded(false)
    }

    const handleLoad = useCallback(() => setIsLoaded(true), [])
    const handleError = useCallback(() => setIsLoaded(true), [])

    const goNext = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            setCurrentIndex((prev) => (prev + 1) % allImages.length)
        },
        [allImages.length]
    )

    const goPrev = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
        },
        [allImages.length]
    )

    const handleImageClick = useCallback(
        (e: React.MouseEvent) => {
            if (
                effectiveInteractive &&
                allImages.length > 0 &&
                allImages[0] !== '/placeholder.svg'
            ) {
                // Eğer üst öğede bir link (a tag) varsa, onun tetiklenmesini engellemek için propagation'ı durduruyoruz.
                // Böylece görsele tıklandığında sadece lightbox açılır, ürün sayfasına gitmez.
                e.stopPropagation()
                openLightbox(allImages, currentIndex, product.name)
            }
        },
        [effectiveInteractive, allImages, currentIndex, product.name, openLightbox]
    )

    // Object fit class
    const fitClass = {
        cover: 'object-cover',
        contain: 'object-contain',
        fill: 'object-fill',
    }[imageFit]

    return (
        <div className={cn('group relative', className)}>
            {/* Ana Görsel */}
            <div
                className={cn(
                    'relative h-full w-full overflow-hidden',
                    effectiveInteractive && 'cursor-pointer',
                    aspectRatio
                )}
                onClick={handleImageClick}
            >
                {/* Shimmer skeleton — visible until image loads */}
                {!isPdfExportMode && !isLoaded && (
                    <div className="absolute inset-0 z-[1] animate-pulse bg-gray-100">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </div>
                )}

                <NextImage
                    src={displayImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 400px"
                    unoptimized
                    priority={shouldPrioritize}
                    loading={isPdfExportMode || shouldPrioritize ? 'eager' : 'lazy'}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={cn(
                        'h-full w-full',
                        !isPdfExportMode && 'transition-all duration-300',
                        fitClass,
                        isPdfExportMode || isLoaded ? 'opacity-100' : 'opacity-0',
                        effectiveInteractive && 'group-hover:scale-105',
                        imageClassName
                    )}
                />

                {/* Birden fazla görsel varsa gösterge */}
                {hasMultiple && effectiveShowNavigation && (
                    <>
                        {/* Navigasyon Okları */}
                        <button
                            onClick={goPrev}
                            className="absolute top-1/2 left-1 z-10 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/60"
                            aria-label={t('common.previousImage') || 'Previous image'}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute top-1/2 right-1 z-10 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/60"
                            aria-label={t('common.nextImage') || 'Next image'}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>

                        {/* Dots Göstergesi */}
                        <div className="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/30 px-1.5 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            {allImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setCurrentIndex(index)
                                    }}
                                    className={cn(
                                        'h-1.5 w-1.5 rounded-full transition-all',
                                        index === currentIndex
                                            ? 'bg-white'
                                            : 'bg-white/50 hover:bg-white/70'
                                    )}
                                    aria-label={`${t('common.imageOf')?.replace('{index}', String(index + 1)) || `Image ${index + 1}`}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Birden fazla görsel badge'i (her zaman görünür) */}
                {hasMultiple && effectiveShowImageCount && (
                    <div className="absolute top-1 right-1 z-10 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {currentIndex + 1}/{allImages.length}
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Basit görsel bileşeni - galeri özelliği olmadan
 * Template'lerde hızlı kullanım için
 */
export function ProductImage({
    product,
    className,
    imageFit = 'cover',
    interactive = true,
}: Omit<ProductImageGalleryProps, 'showNavigation' | 'aspectRatio'>) {
    return (
        <ProductImageGallery
            product={product}
            className={className}
            imageFit={imageFit}
            showNavigation={false}
            interactive={interactive}
        />
    )
}
