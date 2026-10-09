"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, Palette, Settings, BookOpen, Sparkles, FolderOpen, X, ChevronLeft, ChevronRight, BarChart3, HelpCircle, Table2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/lib/contexts/user-context"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useSidebar } from "@/lib/contexts/sidebar-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"

import { FeedbackModal } from "./feedback-modal"
import { PlanUsageCard } from "./plan-usage-card"
import { Logo } from "@/components/ui/logo"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, isLoading } = useUser()
  const { t: baseT } = useTranslation()
  const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
  const { isOpen, isCollapsed, isMobile, close, toggle } = useSidebar()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const navItems = useMemo(() => [
    { href: "/dashboard", label: t("common.dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: t("dashboard.analytics.title"), icon: BarChart3 },
    { href: "/dashboard/products", label: t("dashboard.products"), icon: Package },
    { href: "/dashboard/categories", label: t("sidebar.categories"), icon: FolderOpen, premium: true },
    { href: "/dashboard/excel", label: t("excel.title"), icon: Table2, premium: true, proOnly: true },
    { href: "/dashboard/catalogs", label: t("sidebar.catalogs"), icon: BookOpen },
    { href: "/dashboard/templates", label: t("sidebar.templates"), icon: Palette },
    { href: "/dashboard/settings", label: t("common.settings"), icon: Settings },
  ], [t])


  // Mobilde link tıklandığında sidebar'ı kapat
  const handleNavClick = () => {
    if (isMobile) {
      close()
    }
  }

  // Sidebar genişliği
  const sidebarWidth = isCollapsed && !isMobile ? "w-16" : "w-64"

  return (
    <TooltipProvider delayDuration={0}>
      {/* Overlay - Mobilde sidebar açıkken arka plan */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky lg:top-0 z-[70] lg:z-30 h-screen border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-300 ease-in-out overflow-y-auto",
          sidebarWidth,
          // Mobilde transform ile aç/kapa
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0 top-0 left-0",
          // Masaüstünde her zaman görünür
          !isMobile && "translate-x-0"
        )}
      >
        {/* Logo & Close/Collapse Button */}
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border shrink-0",
          isCollapsed && !isMobile ? "justify-center px-2" : "justify-between px-4"
        )}>
          <Link href="/dashboard" prefetch={false} className={cn(
            "flex items-center overflow-hidden",
            isCollapsed && !isMobile && "justify-center"
          )}>
            {isCollapsed && !isMobile ? (
              <Logo markOnly />
            ) : (
              <Logo className="text-sidebar-foreground" />
            )}
          </Link>

          {/* Mobilde kapatma butonu */}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={close} className="lg:hidden shrink-0">
              <X className="w-5 h-5" />
            </Button>
          )}

          {/* Masaüstünde collapse butonu */}
          {!isMobile && !isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggle} className="shrink-0 h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t("sidebar.collapseMenu")}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Collapsed durumda expand butonu */}
        {!isMobile && isCollapsed && (
          <div className="p-2 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t("sidebar.expandMenu")}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Navigation */}
        <nav className={cn(
          "p-2 space-y-1 overflow-y-auto overflow-x-hidden",
          !isCollapsed && "p-4"
        )}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            const isPremiumItem = 'premium' in item && (item as { premium?: boolean }).premium
            const showPremiumBadge = isPremiumItem && user?.plan === "free"

            const navLink = (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                prefetch={false}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                  isCollapsed && !isMobile ? "justify-center p-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {(!isCollapsed || isMobile) && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {(!isCollapsed || isMobile) && showPremiumBadge && (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 bg-accent text-primary">
                    Plus
                  </Badge>
                )}
              </Link>
            )

            // Collapsed durumda tooltip göster
            if (isCollapsed && !isMobile) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {navLink}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return navLink
          })}



        </nav>

        {/* Spacer - Pro paket kartını en alta iter */}
        <div className="flex-1" />

        {/* Feedback Section */}
        <div className="p-2 border-t border-sidebar-border">
          <FeedbackModal>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className={cn(
                  "flex items-center w-full rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-sidebar-ring",
                  isCollapsed && !isMobile
                    ? "justify-center p-2.5"
                    : "gap-3 px-3 py-2.5 text-sm font-medium"
                )}>
                  <HelpCircle className="w-5 h-5 shrink-0" />
                  {(!isCollapsed || isMobile) && (
                    <span className="truncate flex-1">{t('feedback.trigger')}</span>
                  )}
                </button>
              </TooltipTrigger>
              {isCollapsed && !isMobile && (
                <TooltipContent side="right">{t('feedback.trigger')}</TooltipContent>
              )}
            </Tooltip>
          </FeedbackModal>
        </div>

        {/* Usage Tracker Card */}
        {(!isCollapsed || isMobile) && (
          <div className="p-4 shrink-0 border-t border-sidebar-border overflow-hidden">
            <div className="w-[224px]">
              <PlanUsageCard user={user} isLoading={isLoading} onUpgrade={() => setShowUpgradeModal(true)} />
            </div>
          </div>
        )}

        {/* Collapsed durumda Pro ise premium icon, değilse upgrade */}
        {isCollapsed && !isMobile && (
          <div className="p-2 shrink-0">
            {user?.plan === "pro" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full flex justify-center">
                    <div className="p-2 rounded-lg bg-sidebar-accent">
                      <Sparkles className="w-4 h-4 text-sidebar-foreground" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{t("common.proPackage")} - {t("plans.unlimited")}</TooltipContent>
              </Tooltip>
            ) : user?.plan === "plus" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full flex justify-center">
                    <div className="p-2 rounded-lg bg-sidebar-accent">
                      <Sparkles className="w-4 h-4 text-sidebar-foreground" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{t("common.plusPackage")}</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" className="w-full" onClick={() => setShowUpgradeModal(true)}>
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t("settings.upgrade")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </aside>

      {/* Upgrade Modal */}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </TooltipProvider>
  )
}
