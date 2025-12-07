"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, Palette, Settings, BookOpen, Sparkles, ArrowUpRight, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/lib/user-context"
import { Skeleton } from "@/components/ui/skeleton"

const navItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Ürünler", icon: Package },
  { href: "/dashboard/catalogs", label: "Kataloglar", icon: FolderOpen },
  { href: "/dashboard/templates", label: "Şablonlar", icon: Palette },
  { href: "/dashboard/settings", label: "Ayarlar", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, isLoading } = useUser()

  const exportPercentage = user ? (user.exportsUsed / user.maxExports) * 100 : 0
  const isPro = user?.plan === "pro"

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="p-1.5 bg-primary rounded-lg">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sidebar-foreground">CatalogPro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Usage Tracker Card */}
      <div className="p-4">
        <Card className="bg-sidebar-accent/50 border-sidebar-border">
          <CardContent className="p-4 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-sidebar-foreground">
                    {isPro ? "Pro Plan" : "Ücretsiz Plan"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Aktif
                  </Badge>
                </div>

                {!isPro && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Katalog Dışa Aktarma</span>
                      <span className="font-medium text-sidebar-foreground">
                        {user?.exportsUsed ?? 0}/{user?.maxExports ?? 1} Kullanıldı
                      </span>
                    </div>
                    <Progress value={exportPercentage} className="h-2" />
                  </div>
                )}

                {!isPro && (
                  <Button size="sm" className="w-full gap-2" asChild>
                    <Link href="/pricing">
                      <Sparkles className="w-4 h-4" />
                      Pro'ya Yükselt
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}
