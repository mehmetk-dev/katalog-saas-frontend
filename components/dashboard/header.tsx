"use client"

import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { Bell, Plus, ChevronDown, LogOut, Settings, User, Menu, PanelLeftClose, PanelLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "@/components/dashboard/notification-dropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/lib/user-context"
import { useTranslation } from "@/lib/i18n-provider"
import { useSidebar } from "@/lib/sidebar-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/ui/theme-toggle"

// 1. Import usePathname
import { usePathname } from "next/navigation"

export function DashboardHeader() {
  const { user, logout, adjustCatalogsCount } = useUser()
  const { t: baseT } = useTranslation()
  const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
  const { toggle, isMobile, isCollapsed } = useSidebar()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const [isCreating, setIsCreating] = useState(false)

  const handleCatalogCreate = async () => {
    setIsCreating(true)
    const creatingMsg = t("toasts.creatingCatalog")
    const toastId = toast.loading(creatingMsg === "toasts.creatingCatalog" ? "Katalog oluşturuluyor..." : String(creatingMsg))
    try {
      const { createCatalog } = await import("@/lib/actions/catalogs")
      const currentDate = new Date().toLocaleDateString('tr-TR')
      const rawName = t("catalogs.newCatalog")
      const baseName = rawName === "catalogs.newCatalog" ? "Yeni Katalog" : String(rawName)

      const newCatalog = await createCatalog({
        name: `${baseName} - ${currentDate}`,
        layout: "modern-grid"
      })

      adjustCatalogsCount(1)

      const successMsg = t("toasts.catalogCreated")
      toast.success(successMsg === "toasts.catalogCreated" ? "Katalog başarıyla oluşturuldu" : String(successMsg), { id: toastId })
      window.location.href = `/dashboard/builder?id=${newCatalog.id}`
    } catch (error: unknown) {
      console.error("Header creation error:", error)
      toast.error(error instanceof Error ? error.message : "Hata oluştu", { id: toastId })
      setIsCreating(false)
    }
  }

  // Dinamik Header Aksiyonu
  const getHeaderAction = () => {
    if (pathname.startsWith("/dashboard/products")) {
      return {
        label: t("products.addNew"),
        href: "/dashboard/products?action=new",
        icon: <Plus className="w-4 h-4" />
      }
    }
    if (pathname.startsWith("/dashboard/categories")) {
      return {
        label: t("categories.newCategory"),
        href: "/dashboard/categories?action=new",
        icon: <Plus className="w-4 h-4" />
      }
    }
    // Varsayılan: Katalog Oluştur
    return {
      label: t("dashboard.createCatalog"),
      href: "/dashboard/builder",
      icon: <Plus className="w-4 h-4" />
    }
  }

  const action = getHeaderAction()

  // Prevents hydration mismatch for Radix UI components by rendering them only on client
  const UserMenu = mounted ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 pl-2 pr-3">
          <Avatar className="h-8 w-8">
            {user?.avatar_url && <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {user?.name?.charAt(0) ?? "K"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline-block">{user?.name ?? t("common.user")}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user?.name}</span>
            <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <User className="w-4 h-4 mr-2" />
            {t("settings.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="w-4 h-4 mr-2" />
            {t("common.settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} className="text-destructive cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          {t("common.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <div className="flex items-center gap-2 pl-2 pr-3">
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      <div className="h-4 w-20 bg-muted animate-pulse hidden sm:block" />
    </div>
  )

  return (
    <TooltipProvider>
      <header className="h-14 sm:h-16 border-b border-border bg-background flex items-center justify-between px-3 sm:px-6 relative z-50">
        <div className="flex items-center gap-2">
          {/* Menu Toggle Button - Hem mobil hem masaüstü */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label="Toggle menu"
              >
                {isMobile ? (
                  <Menu className="w-5 h-5" />
                ) : isCollapsed ? (
                  <PanelLeft className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" sideOffset={5}>
              {isMobile
                ? t("sidebar.openMenu")
                : isCollapsed
                  ? t("sidebar.expandMenu")
                  : t("sidebar.collapseMenu")
              }
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Dinamik Aksiyon Butonu */}
          {action.href === "/dashboard/builder" ? (
            <Button onClick={handleCatalogCreate} className="gap-2" size="sm" disabled={isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : action.icon}
              <span className="hidden sm:inline">{action.label}</span>
              <span className="sm:hidden">{t("common.new")}</span>
            </Button>
          ) : (
            <Button asChild className="gap-2" size="sm">
              <Link href={action.href}>
                {action.icon}
                <span className="hidden sm:inline">{action.label}</span>
                <span className="sm:hidden">{t("common.new")}</span>
              </Link>
            </Button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          {mounted ? <NotificationDropdown /> : <Button variant="ghost" size="icon" disabled><Bell className="w-5 h-5 opacity-50" /></Button>}

          {/* User Dropdown */}
          {UserMenu}
        </div>
      </header>
    </TooltipProvider>
  )
}
