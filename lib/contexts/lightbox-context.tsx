"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"

interface LightboxState {
    isOpen: boolean
    images: string[]
    currentIndex: number
    productName?: string
    allCatalogImages: string[]
}

interface LightboxContextType {
    state: LightboxState
    openLightbox: (images: string[], startIndex?: number, productName?: string) => void
    closeLightbox: () => void
    nextImage: () => void
    prevImage: () => void
    goToImage: (index: number) => void
    setAllCatalogImages: (images: string[]) => void
}

const initialState: LightboxState = {
    isOpen: false,
    images: [],
    currentIndex: 0,
    productName: undefined,
    allCatalogImages: []
}

const LightboxContext = createContext<LightboxContextType | null>(null)

export function LightboxProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<LightboxState>(initialState)

    const setAllCatalogImages = useCallback((images: string[]) => {
        setState(prev => ({ ...prev, allCatalogImages: images }))
    }, [])

    // SAFETY: Ensure body scroll is restored on unmount or when lightbox state changes
    useEffect(() => {
        if (state.isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [state.isOpen])

    const openLightbox = useCallback((images: string[], startIndex = 0, productName?: string) => {
        if (images.length === 0) return
        setState(prev => ({
            ...prev,
            isOpen: true,
            images,
            currentIndex: startIndex,
            productName
        }))
    }, [])

    const closeLightbox = useCallback(() => {
        setState(prev => ({
            ...initialState,
            allCatalogImages: prev.allCatalogImages // Preload listesini koru
        }))
    }, [])

    const nextImage = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentIndex: (prev.currentIndex + 1) % prev.images.length
        }))
    }, [])

    const prevImage = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
        }))
    }, [])

    const goToImage = useCallback((index: number) => {
        setState(prev => ({
            ...prev,
            currentIndex: Math.max(0, Math.min(index, prev.images.length - 1))
        }))
    }, [])

    return (
        <LightboxContext.Provider value={{
            state,
            openLightbox,
            closeLightbox,
            nextImage,
            prevImage,
            goToImage,
            setAllCatalogImages
        }}>
            {children}
        </LightboxContext.Provider>
    )
}

export function useLightbox() {
    const context = useContext(LightboxContext)
    if (!context) {
        // Context yoksa dummy fonksiyonlar döndür (builder preview için)
        return {
            state: initialState,
            openLightbox: () => { },
            closeLightbox: () => { },
            nextImage: () => { },
            prevImage: () => { },
            goToImage: () => { },
            setAllCatalogImages: () => { }
        }
    }
    return context
}

/**
 * Yardımcı bileşen: Katalogdaki tüm görselleri Lightbox context'ine yükler.
 * PERF: Uses requestIdleCallback to defer image preloading — avoids re-render
 * during critical initial paint of the builder page.
 */
export function CatalogPreloader({ products, images: directImages }: { products?: { image_url?: string | null; images?: string[] }[], images?: string[] }) {
    const { setAllCatalogImages } = useLightbox()

    React.useEffect(() => {
        const compute = () => {
            let urls: string[] = []
            if (directImages) {
                urls = directImages
            } else if (products) {
                urls = products
                    .slice(0, 30)
                    .flatMap(p => [p.image_url, ...(p.images || [])])
                    .filter((url): url is string => !!url && url !== "/placeholder.svg")
            }

            if (urls.length > 0) {
                setAllCatalogImages(urls)
            }
        }

        // Defer to idle time to avoid blocking initial render
        if (typeof requestIdleCallback !== 'undefined') {
            const id = requestIdleCallback(compute, { timeout: 2000 })
            return () => cancelIdleCallback(id)
        } else {
            const id = setTimeout(compute, 100)
            return () => clearTimeout(id)
        }
    }, [products, directImages, setAllCatalogImages])

    return null
}
