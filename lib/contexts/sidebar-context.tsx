"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

interface SidebarContextType {
    isOpen: boolean
    isCollapsed: boolean
    isMobile: boolean
    toggle: () => void
    open: () => void
    close: () => void
    collapse: () => void
    expand: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed"

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false) // Mobilde overlay sidebar için
    const [isCollapsed, setIsCollapsed] = useState(false) // Masaüstünde collapse için
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        // LocalStorage'dan collapse durumunu oku
        const savedCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY)
        if (savedCollapsed !== null) {
            setIsCollapsed(savedCollapsed === "true")
        }

        const checkMobile = () => {
            const mobile = window.innerWidth < 1024 // lg breakpoint
            setIsMobile(mobile)
            // Mobilde sidebar her zaman başlangıçta kapalı
            if (mobile) {
                setIsOpen(false)
            }
        }

        checkMobile()
        // Debounce resize events to avoid excessive state updates
        let resizeTimer: ReturnType<typeof setTimeout>
        const debouncedCheckMobile = () => {
            clearTimeout(resizeTimer)
            resizeTimer = setTimeout(checkMobile, 150)
        }
        window.addEventListener('resize', debouncedCheckMobile)
        return () => {
            clearTimeout(resizeTimer)
            window.removeEventListener('resize', debouncedCheckMobile)
        }
    }, [])

    // Collapse durumunu kaydet
    useEffect(() => {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed))
    }, [isCollapsed])

    const toggle = useCallback(() => {
        if (isMobile) {
            setIsOpen(prev => !prev)
        } else {
            setIsCollapsed(prev => !prev)
        }
    }, [isMobile])

    const open = useCallback(() => setIsOpen(true), [])
    const close = useCallback(() => setIsOpen(false), [])
    const collapse = useCallback(() => setIsCollapsed(true), [])
    const expand = useCallback(() => setIsCollapsed(false), [])

    return (
        <SidebarContext.Provider value={{
            isOpen,
            isCollapsed,
            isMobile,
            toggle,
            open,
            close,
            collapse,
            expand
        }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error("useSidebar must be used within SidebarProvider")
    }
    return context
}
