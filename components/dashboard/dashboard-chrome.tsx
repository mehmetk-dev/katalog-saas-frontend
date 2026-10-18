"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

/** Kendi üst barı olan çalışma sayfaları: dashboard header'ı gösterilmez, menü dar başlar */
const FOCUSED_ROUTES = ["/dashboard/builder"]
const FOCUSED_SIDEBAR_KEY = "builder-sidebar-collapsed"

export function DashboardChrome({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const isFocused = FOCUSED_ROUTES.some((route) => pathname?.startsWith(route))

    if (isFocused) {
        return (
            <div className="flex h-dvh overflow-hidden bg-background">
                <FocusedSidebar />
                <div className="h-dvh min-w-0 flex-1 overflow-hidden">{children}</div>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <DashboardSidebar />
            <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                <DashboardHeader />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}

/** Builder'da editör ve önizlemeye yer kalsın diye menü ikonlu (dar) başlar. Genişletme tercihi
 *  diğer sayfaların tercihinden ayrı tutulur; orada geniş menü kullanan biri builder'da da
 *  geniş menüyle karşılaşmasın. */
function FocusedSidebar() {
    const [collapsed, setCollapsed] = useState(true)

    useEffect(() => {
        try {
            if (window.localStorage.getItem(FOCUSED_SIDEBAR_KEY) === "false") setCollapsed(false)
        } catch {
            // localStorage yoksa varsayılan (dar) kalır
        }
    }, [])

    const toggle = useCallback(() => {
        setCollapsed((prev) => {
            try {
                window.localStorage.setItem(FOCUSED_SIDEBAR_KEY, String(!prev))
            } catch {
                // yok say
            }
            return !prev
        })
    }, [])

    return <DashboardSidebar collapsed={collapsed} onToggleCollapsed={toggle} />
}
