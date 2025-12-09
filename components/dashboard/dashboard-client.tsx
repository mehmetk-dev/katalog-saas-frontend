"use client"

import Link from "next/link"
import { Package, FileText, TrendingUp, Clock, Plus, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { useTranslation } from "@/lib/i18n-provider"
import { useUser, type User } from "@/lib/user-context"


import { DashboardStats } from "@/lib/actions/catalogs"
import { Eye } from "lucide-react"
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"

interface DashboardClientProps {
    initialCatalogs: any[]
    initialProducts: any[]
    initialStats: DashboardStats | null
}

import { tr } from "date-fns/locale"

export function DashboardClient({ initialCatalogs, initialProducts, initialStats }: DashboardClientProps) {
    const { t } = useTranslation()
    const { user } = useUser()

    const currentCatalogs = initialCatalogs
    const currentProducts = initialProducts

    const recentCatalogs = currentCatalogs.slice(0, 3)

    const stats = [
        {
            label: t("dashboard.totalProducts"),
            value: currentProducts.length.toString(),
            icon: Package,
            change: `${user?.maxProducts === 999999 ? "Sınırsız" : `${currentProducts.length}/${user?.maxProducts} kullanıldı`}`,
        },
        {
            label: "Toplam Görüntülenme",
            value: initialStats?.totalViews.toLocaleString() || "0",
            icon: Eye,
            change: "Tüm kataloglar",
        },
        {
            label: t("catalogs.published"),
            value: currentCatalogs.filter((c) => c.is_published).length.toString(),
            icon: TrendingUp,
            change: t("dashboard.activeCatalogs"),
        },
    ]

    return (
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
                        {t("dashboard.welcomeUser", { name: user?.name?.split(" ")[0] ?? "Kullanıcı" })}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">{t("marketing.heroSubtitle")}</p>
                </div>
            </div>

            {/* Onboarding Checklist */}
            <OnboardingChecklist
                hasProducts={currentProducts.length > 0}
                hasCatalogs={currentCatalogs.length > 0}
            />

            {/* Stats Grid */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.label}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 md:p-6 md:pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                                <Icon className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
                                <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1 truncate">{stat.change}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Recent Catalogs */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 md:p-6">
                    <div>
                        <CardTitle className="text-base sm:text-lg">{t("dashboard.recentActivity")}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{t("catalogs.title")}</CardDescription>
                    </div>
                    {currentCatalogs.length > 0 && (
                        <Button variant="ghost" size="sm" className="gap-1 w-full sm:w-auto justify-center" asChild>
                            <Link href="/dashboard/catalogs">
                                {t("catalogs.view")}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
                    {recentCatalogs.length === 0 ? (
                        <div className="text-center py-6 sm:py-8">
                            <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
                            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">{t("products.noProductsDesc")}</p>
                            <Button asChild className="w-full sm:w-auto">
                                <Link href="/dashboard/builder">
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t("dashboard.createCatalog")}
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {recentCatalogs.map((catalog) => (
                                <div
                                    key={catalog.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-3"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm sm:text-base truncate">{catalog.name}</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground">{catalog.product_ids?.length || 0} {t("dashboard.products").toLowerCase()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 ml-0 sm:ml-4">
                                        <Badge variant={catalog.is_published ? "default" : "secondary"} className="text-xs">
                                            {catalog.is_published ? t("catalogs.published") : t("catalogs.draft")}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="hidden xs:inline">
                                                {formatDistanceToNow(new Date(catalog.updated_at), { addSuffix: true, locale: tr })}
                                            </span>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild className="shrink-0">
                                            <Link href={`/dashboard/builder?id=${catalog.id}`}>{t("common.edit")}</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-primary rounded-lg shrink-0">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base">{t("dashboard.addProduct")}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{t("products.importExcel")}</p>
                        </div>
                        <Button variant="secondary" asChild className="w-full sm:w-auto shrink-0">
                            <Link href="/dashboard/products">{t("products.addProduct")}</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-secondary">
                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-foreground/10 rounded-lg shrink-0">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base">{t("catalogs.template")}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{t("marketing.feature1")}</p>
                        </div>
                        <Button variant="secondary" asChild className="w-full sm:w-auto shrink-0">
                            <Link href="/dashboard/templates">{t("catalogs.view")}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
