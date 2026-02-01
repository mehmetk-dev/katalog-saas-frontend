"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface LightboxState {
    isOpen: boolean
    images: string[]
    currentIndex: number
    productName?: string
}

interface LightboxContextType {
    state: LightboxState
    openLightbox: (images: string[], startIndex?: number, productName?: string) => void
    closeLightbox: () => void
    nextImage: () => void
    prevImage: () => void
    goToImage: (index: number) => void
}

const initialState: LightboxState = {
    isOpen: false,
    images: [],
    currentIndex: 0,
    productName: undefined
}

const LightboxContext = createContext<LightboxContextType | null>(null)

export function LightboxProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<LightboxState>(initialState)

    const openLightbox = useCallback((images: string[], startIndex = 0, productName?: string) => {
        if (images.length === 0) return
        setState({
            isOpen: true,
            images,
            currentIndex: startIndex,
            productName
        })
        // Body scroll'unu kapat
        document.body.style.overflow = 'hidden'
    }, [])

    const closeLightbox = useCallback(() => {
        setState(initialState)
        // Body scroll'unu aç
        document.body.style.overflow = ''
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
        <LightboxContext.Provider value={{ state, openLightbox, closeLightbox, nextImage, prevImage, goToImage }}>
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
            goToImage: () => { }
        }
    }
    return context
}
