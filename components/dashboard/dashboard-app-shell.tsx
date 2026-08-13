import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'

import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/lib/contexts/query-provider'
import { SidebarProvider } from '@/lib/contexts/sidebar-context'
import { UserProvider } from '@/lib/contexts/user-context'
import { getPlanLimits } from '@/lib/constants'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function DashboardAppShell({ children }: { children: ReactNode }) {
    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/auth')

    const [profileResult, productsResult, catalogsResult] = await Promise.all([
        supabase
            .from('users')
            .select('full_name, company, avatar_url, plan, exports_used')
            .eq('id', user.id)
            .single(),
        supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        supabase
            .from('catalogs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
    ])

    const { data: profile } = profileResult
    const plan = (profile?.plan || 'free').toLowerCase()
    const planLimits = getPlanLimits(plan)
    const initialUser = {
        id: user.id,
        email: user.email!,
        name: profile?.full_name || user.user_metadata?.full_name || 'Kullanıcı',
        company: profile?.company || '',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
        plan: plan as 'free' | 'plus' | 'pro',
        productsCount: productsResult.count || 0,
        catalogsCount: catalogsResult.count || 0,
        maxProducts: planLimits.maxProducts === Infinity ? 999999 : planLimits.maxProducts,
        maxExports: planLimits.maxExports === Infinity ? 999999 : planLimits.maxExports,
        exportsUsed: profile?.exports_used || 0,
    }

    const cookieStore = await cookies()
    const defaultCollapsed = cookieStore.get('sidebar-collapsed')?.value === 'true'

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <QueryProvider>
                <UserProvider initialUser={initialUser} initialSupabaseUser={user}>
                    <SidebarProvider defaultCollapsed={defaultCollapsed}>
                        <div className="flex h-screen overflow-hidden bg-background">
                            <DashboardSidebar />
                            <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                                <DashboardHeader />
                                <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6">
                                    {children}
                                </main>
                            </div>
                        </div>
                        <Toaster
                            position="bottom-right"
                            theme="system"
                            closeButton
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: 'var(--toast-bg)',
                                    color: 'var(--toast-text)',
                                    border: '1px solid var(--toast-border)',
                                    borderLeft: '5px solid var(--toast-stripe)',
                                    borderRadius: '14px',
                                    boxShadow: 'var(--toast-shadow)',
                                    padding: '16px 18px',
                                    gap: '12px',
                                    fontWeight: 500,
                                    fontSize: '0.875rem',
                                    letterSpacing: '-0.01em',
                                    backdropFilter: 'blur(12px)',
                                },
                                classNames: {
                                    toast: 'premium-toast',
                                    success: 'premium-toast-success',
                                    error: 'premium-toast-error',
                                    info: 'premium-toast-info',
                                    warning: 'premium-toast-warning',
                                    loading: 'premium-toast-loading',
                                    closeButton: 'premium-toast-close',
                                },
                            }}
                        />
                    </SidebarProvider>
                </UserProvider>
            </QueryProvider>
        </ThemeProvider>
    )
}
