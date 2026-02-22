import type React from "react"
import { Toaster } from "sonner"

import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/lib/query-provider"

export const metadata = {
    title: "Admin Panel — FogCatalog",
    robots: { index: false, follow: false },
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <QueryProvider>
                {children}
                <Toaster position="bottom-right" richColors />
            </QueryProvider>
        </ThemeProvider>
    )
}
