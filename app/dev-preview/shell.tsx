'use client'
// GEÇİCİ: görsel QA için — commit'lenmeyecek
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

import { DashboardChrome } from '@/components/dashboard/dashboard-chrome'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/lib/contexts/query-provider'
import { SidebarProvider } from '@/lib/contexts/sidebar-context'
import { UserContext } from '@/lib/contexts/user-context'
import type { User } from '@/lib/user/types'

const user: User = {
    id: '00000000-0000-0000-0000-000000000001', name: 'Ayşe Yılmaz', email: 'ayse@ornek.com', company: 'Yılmaz Mobilya',
    plan: 'plus', exportsUsed: 12, maxExports: 50, productsCount: 8, maxProducts: 1000, catalogsCount: 3,
    subscriptionStatus: 'active', subscriptionEnd: '2027-10-09T00:00:00Z',
}

export function PreviewShell({ children, bare }: { children: ReactNode; bare?: boolean }) {
    const ctx = {
        user, supabaseUser: null, setUser: () => {}, adjustCatalogsCount: () => {}, isAuthenticated: true, isLoading: false,
        logout: async () => {}, refreshUser: async () => {}, incrementExports: () => true, canExport: () => true,
    }
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <QueryProvider>
                <UserContext.Provider value={ctx}>
                    <SidebarProvider>
                        {bare ? children : <DashboardChrome>{children}</DashboardChrome>}
                        <Toaster />
                    </SidebarProvider>
                </UserContext.Provider>
            </QueryProvider>
        </ThemeProvider>
    )
}
