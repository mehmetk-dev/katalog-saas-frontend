import type React from "react"
import { redirect } from "next/navigation"
import { Toaster } from "sonner"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { UserProvider } from "@/lib/user-context"
import { SidebarProvider } from "@/lib/sidebar-context"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/lib/i18n-provider"

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

  // Fetch additional user data on server
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Get counts
  const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("user_id", user.id)
  const { count: catalogsCount } = await supabase.from("catalogs").select("*", { count: "exact", head: true }).eq("user_id", user.id)

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
    maxProducts: plan === "pro" ? 999999 : plan === "plus" ? 1000 : 50,
    maxExports: plan === "pro" ? 999999 : plan === "plus" ? 50 : 1,
    exportsUsed: profile?.exports_used || 0,
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <I18nProvider>
        <UserProvider initialUser={initialUser} initialSupabaseUser={user}>
          <SidebarProvider>
            <div className="h-screen flex bg-background overflow-hidden">
              <DashboardSidebar />
              <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <DashboardHeader />
                <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden">{children}</main>
              </div>
            </div>
            <Toaster position="bottom-right" richColors />
          </SidebarProvider>
        </UserProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
