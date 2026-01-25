"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, Palette, Settings, BookOpen, Sparkles, ArrowUpRight, FolderOpen, X, ChevronLeft, ChevronRight, Shield, BarChart3, HelpCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/lib/user-context"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/lib/i18n-provider"
import { useSidebar } from "@/lib/sidebar-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { UpgradeModal } from "@/components/builder/upgrade-modal"

import { FeedbackModal } from "./feedback-modal"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, isLoading } = useUser()
  const { t } = useTranslation()
  const { isOpen, isCollapsed, isMobile, close, toggle } = useSidebar()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const navItems = [
    { href: "/dashboard", label: t("common.dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: t("dashboard.analytics.title"), icon: BarChart3 },
    { href: "/dashboard/products", label: t("dashboard.products"), icon: Package },
    { href: "/dashboard/categories", label: t("sidebar.categories"), icon: FolderOpen, premium: true },
    { href: "/dashboard/catalogs", label: t("sidebar.catalogs"), icon: BookOpen },
    { href: "/dashboard/templates", label: t("sidebar.templates"), icon: Palette },
    { href: "/dashboard/settings", label: t("common.settings"), icon: Settings },
  ]

  // Admin menu items - only for admin users
  const adminItems = user?.isAdmin ? [
    { href: "/dashboard/admin", label: "Admin Panel", icon: Shield, isAdmin: true },
  ] : []


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
          <Link href="/dashboard" className={cn(
            "flex items-center overflow-hidden",
            isCollapsed && !isMobile && "justify-center"
          )}>
            {isCollapsed && !isMobile ? (
              <span className="font-montserrat font-black text-[#cf1414] text-xl">F</span>
            ) : (
              <span className="font-montserrat text-xl tracking-tighter flex items-center">
                <span className="font-black text-[#cf1414] uppercase">Fog</span>
                <span className="font-light text-sidebar-foreground">Catalog</span>
              </span>
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
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700">
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

          {/* Admin Section - only for admin users */}
          {adminItems.length > 0 && (
            <>
              <div className={cn(
                "my-2 border-t border-sidebar-border",
                isCollapsed && !isMobile && "mx-2"
              )} />
              {adminItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href)

                const adminLink = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                      isCollapsed && !isMobile ? "justify-center p-2.5" : "px-3 py-2.5",
                      isActive
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "text-red-600/80 hover:bg-red-50 hover:text-red-700 dark:text-red-400/80 dark:hover:bg-red-900/20",
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {(!isCollapsed || isMobile) && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                  </Link>
                )

                if (isCollapsed && !isMobile) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        {adminLink}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return adminLink
              })}
            </>
          )}
        </nav>

        {/* Spacer - Pro paket kartını en alta iter */}
        <div className="flex-1" />

        {/* Feedback Section */}
        <div className="p-2 border-t border-sidebar-border">
          <FeedbackModal>
            {isCollapsed && !isMobile ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center p-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground cursor-pointer transition-colors">
                    <HelpCircle className="w-5 h-5 shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{t('feedback.trigger')}</TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground cursor-pointer transition-colors">
                <HelpCircle className="w-5 h-5 shrink-0" />
                <span className="truncate flex-1">{t('feedback.trigger')}</span>
              </div>
            )}
          </FeedbackModal>
        </div>

        {/* Usage Tracker Card */}
        {(!isCollapsed || isMobile) && (
          <div className="p-4 shrink-0 border-t border-sidebar-border overflow-hidden">
            <div className="w-[224px]">
              <Card className={cn(
                "border-sidebar-border overflow-hidden",
                user?.plan === "pro"
                  ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-0"
                  : user?.plan === "plus"
                    ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0"
                    : "bg-sidebar-accent/50"
              )}>
                <CardContent className="p-4 space-y-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : user?.plan === "pro" ? (
                    /* PRO KULLANICI */
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          <span className="font-semibold">{t("common.proPackage")}</span>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-xs">
                          {t("common.active")}
                        </Badge>
                      </div>
                      <div className="text-xs opacity-90">
                        ✓ {t("plans.unlimitedCatalogs")}<br />
                        ✓ {t("plans.unlimitedDownloads")}<br />
                        ✓ {t("plans.allTemplates")}
                      </div>
                    </>
                  ) : user?.plan === "plus" ? (
                    /* PLUS KULLANICI */
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          <span className="font-semibold">{t("common.plusPackage")}</span>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-xs">
                          {t("common.active")}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="opacity-80">{t("sidebar.catalogs")}</span>
                          <span className="font-medium">
                            {user?.catalogsCount ?? 0}/10
                          </span>
                        </div>
                        <Progress
                          value={((user?.catalogsCount ?? 0) / 10) * 100}
                          className="h-1.5 bg-white/20"
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="opacity-80">{t("sidebar.products")}</span>
                          <span className="font-medium">
                            {user?.productsCount ?? 0}/1000
                          </span>
                        </div>
                        <Progress
                          value={((user?.productsCount ?? 0) / 1000) * 100}
                          className="h-1.5 bg-white/20"
                        />
                      </div>
                      <Button size="sm" className="w-full gap-2 bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => setShowUpgradeModal(true)}>
                        {t("settings.upgrade")}
                        <ArrowUpRight className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    /* FREE KULLANICI */
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-sidebar-foreground">
                          {t("common.freePlan")}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {t("catalogs.status")}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t("sidebar.catalogs")}</span>
                          <span className="font-medium text-sidebar-foreground">
                            {user?.catalogsCount ?? 0}/1
                          </span>
                        </div>
                        <Progress value={((user?.catalogsCount ?? 0) / 1) * 100} className="h-2" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t("sidebar.products")}</span>
                          <span className="font-medium text-sidebar-foreground">
                            {user?.productsCount ?? 0}/50
                          </span>
                        </div>
                        <Progress value={((user?.productsCount ?? 0) / 50) * 100} className="h-2" />
                      </div>

                      <Button size="sm" className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700" onClick={() => setShowUpgradeModal(true)}>
                        <Sparkles className="w-4 h-4" />
                        {t("settings.upgrade")}
                        <ArrowUpRight className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
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
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{t("common.proPackage")} - {t("plans.unlimited")}</TooltipContent>
              </Tooltip>
            ) : user?.plan === "plus" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full flex justify-center">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                      <Sparkles className="w-4 h-4 text-white" />
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
