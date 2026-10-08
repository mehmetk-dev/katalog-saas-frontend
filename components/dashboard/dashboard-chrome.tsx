"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

/** Tam ekran çalışan, kendi üst barı olan sayfalar (dashboard sidebar/header gösterilmez) */
const FOCUSED_ROUTES = ["/dashboard/builder"]

export function DashboardChrome({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const isFocused = FOCUSED_ROUTES.some((route) => pathname?.startsWith(route))

    if (isFocused) {
        return <div className="h-dvh overflow-hidden bg-background">{children}</div>
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
