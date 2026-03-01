import type React from "react"
import { redirect } from "next/navigation"
import { Toaster } from "sonner"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { UserProvider } from "@/lib/contexts/user-context"
import { SidebarProvider } from "@/lib/contexts/sidebar-context"
import { QueryProvider } from "@/lib/contexts/query-provider"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { ThemeProvider } from "@/components/theme-provider"
import { getPlanLimits } from "@/lib/constants"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // PERF: Fetch profile + counts in parallel instead of 3 sequential queries
  // PERF: Only select needed columns from users table instead of select("*")
  const [profileResult, productsResult, catalogsResult] = await Promise.all([
    supabase.from("users").select("full_name, company, avatar_url, plan, exports_used").eq("id", user.id).single(),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("catalogs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ])

  const { data: profile } = profileResult
  const productsCount = productsResult.count
  const catalogsCount = catalogsResult.count

  const plan = (profile?.plan || "free").toLowerCase()

  const initialUser = {
    id: user.id,
    email: user.email!,
    name: profile?.full_name || user.user_metadata?.full_name || "Kullanıcı",
    company: profile?.company || "",
    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
    plan: plan as "free" | "plus" | "pro",
    productsCount: productsCount || 0,
    catalogsCount: catalogsCount || 0,
    maxProducts: getPlanLimits(plan).maxProducts === Infinity ? 999999 : getPlanLimits(plan).maxProducts,
    maxExports: getPlanLimits(plan).maxExports === Infinity ? 999999 : getPlanLimits(plan).maxExports,
    exportsUsed: profile?.exports_used || 0,
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <UserProvider initialUser={initialUser} initialSupabaseUser={user}>
          <SidebarProvider>
            <div className="h-screen flex bg-background overflow-hidden">
              <DashboardSidebar />
              <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <DashboardHeader />
                <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden">{children}</main>
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
