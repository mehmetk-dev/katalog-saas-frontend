"use client"

import React, { useState, useCallback } from "react"
import NextImage from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLightbox } from "@/lib/lightbox-context"
import { getCloudinaryResizedUrl } from "@/lib/image-utils"
import type { Product } from "@/lib/actions/products"

interface ProductImageGalleryProps {
    product: Product
    className?: string
    imageClassName?: string
    imageFit?: 'cover' | 'contain' | 'fill'
    showNavigation?: boolean // Galeri navigasyonu göster
    interactive?: boolean // Tıklama ile lightbox aç
    aspectRatio?: string // Özel aspect ratio (örn: "aspect-square")
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
    aspectRatio
}: ProductImageGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const { openLightbox } = useLightbox()

    // Tüm görselleri birleştir (image_url + images array)
    const allImages = React.useMemo(() => {
        const images: string[] = []

        // Ana görsel
        if (product.image_url) {
            images.push(product.image_url)
        }

        // Ek görseller (tekrarları önle)
        if (product.images && product.images.length > 0) {
            product.images.forEach(img => {
                if (img && !images.includes(img)) {
                    images.push(img)
                }
            })
        }

        // Hiç görsel yoksa placeholder
        if (images.length === 0) {
            images.push("/placeholder.svg")
        }

        return images
    }, [product.image_url, product.images])

    const hasMultiple = allImages.length > 1
    const currentImage = allImages[currentIndex] || "/placeholder.svg"

    // Grid görünümü için optimize edilmiş (küçültülmüş) görsel kullan
    // 800px genişlik genelde gridler için yeterli ve safe (2x pixel density)
    const displayImage = React.useMemo(() => {
        return getCloudinaryResizedUrl(currentImage, 800)
    }, [currentImage])

    const goNext = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex(prev => (prev + 1) % allImages.length)
    }, [allImages.length])

    const goPrev = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)
    }, [allImages.length])

    const handleImageClick = useCallback((e: React.MouseEvent) => {
        if (interactive && allImages.length > 0 && allImages[0] !== "/placeholder.svg") {
            // Eğer üst öğede bir link (a tag) varsa, onun tetiklenmesini engellemek için propagation'ı durduruyoruz.
            // Böylece görsele tıklandığında sadece lightbox açılır, ürün sayfasına gitmez.
            e.stopPropagation()
            openLightbox(allImages, currentIndex, product.name)
        }
    }, [interactive, allImages, currentIndex, product.name, openLightbox])

    // Object fit class
    const fitClass = {
        'cover': 'object-cover',
        'contain': 'object-contain',
        'fill': 'object-fill'
    }[imageFit]

    return (
        <div className={cn("relative group", className)}>
            {/* Ana Görsel */}
            <div
                className={cn(
                    "relative w-full h-full overflow-hidden",
                    interactive && "cursor-pointer",
                    aspectRatio
                )}
                onClick={handleImageClick}
            >
                <NextImage
                    src={displayImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized // Optimized URL used manually
                    priority={false} // Lazy load by default for grid items
                    loading="lazy"
                    className={cn(
                        "w-full h-full transition-transform duration-300",
                        fitClass,
                        interactive && "group-hover:scale-105",
                        imageClassName
                    )}
                />

                {/* Birden fazla görsel varsa gösterge */}
                {hasMultiple && showNavigation && (
                    <>
                        {/* Navigasyon Okları */}
                        <button
                            onClick={goPrev}
                            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                            aria-label="Önceki görsel"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                            aria-label="Sonraki görsel"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Dots Göstergesi */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            {allImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all",
                                        index === currentIndex
                                            ? "bg-white"
                                            : "bg-white/50 hover:bg-white/70"
                                    )}
                                    aria-label={`Görsel ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Birden fazla görsel badge'i (her zaman görünür) */}
                {hasMultiple && (
                    <div className="absolute top-1 right-1 z-10 px-1.5 py-0.5 rounded bg-black/50 text-white text-[10px] font-medium">
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
    interactive = true
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
