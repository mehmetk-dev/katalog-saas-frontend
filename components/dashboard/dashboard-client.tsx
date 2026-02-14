"use client"

import Link from "next/link"
import { useCallback } from "react"
import { Package, FileText, TrendingUp, UserPen, Plus, ArrowRight, ArrowUpRight, ArrowDownRight, Eye, Sparkles, Palette, LayoutGrid } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import NextImage from "next/image"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n-provider"
import { useUser } from "@/lib/user-context"
import { DashboardStats, type Catalog } from "@/lib/actions/catalogs"
import { type Product } from "@/lib/actions/products"
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"
import { cn } from "@/lib/utils"

interface DashboardClientProps {
    initialCatalogs: Catalog[]
    initialProducts: Product[]
    totalProductCount: number
    initialStats: DashboardStats | null
    allProductIds?: string[]
}

// Mini Sparkline Component
function Sparkline({ data, color = "violet" }: { data: number[], color?: string }) {
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1

    const points = data.map((value, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - ((value - min) / range) * 100
        return `${x},${y}`
    }).join(' ')

    return (
        <svg className="w-full h-8 mt-2" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color === 'violet' ? '#8B5CF6' : color === 'blue' ? '#3B82F6' : '#10B981'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color === 'violet' ? '#8B5CF6' : color === 'blue' ? '#3B82F6' : '#10B981'} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline
                fill="none"
                stroke={color === 'violet' ? '#8B5CF6' : color === 'blue' ? '#3B82F6' : '#10B981'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
            <polygon
                fill={`url(#sparkline-gradient-${color})`}
                points={`0,100 ${points} 100,100`}
            />
        </svg>
    )
}

export function DashboardClient({ initialCatalogs, initialProducts, totalProductCount, initialStats, allProductIds = [] }: DashboardClientProps) {
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
    const { user, isLoading, adjustCatalogsCount } = useUser()

    // Veri normalizasyonu: Catalogs ve Products'ın her zaman array olmasını sağla
    const currentCatalogs: Catalog[] = Array.isArray(initialCatalogs) ? initialCatalogs : (initialCatalogs as any)?.data || []
    const currentProducts = Array.isArray(initialProducts) ? initialProducts : (initialProducts as any)?.products || []
    const recentCatalogs = currentCatalogs.slice(0, 3)

    // Ürün sayısını güvenli hesapla (Deduplicate & Clean & Validate against Master List)
    const getSafeProductCount = useCallback((catalog: any) => {
        if (!catalog) return 0;
        const rawIds = Array.isArray(catalog.product_ids) ? catalog.product_ids :
            (catalog as any).productIds && Array.isArray((catalog as any).productIds) ? (catalog as any).productIds :
                (typeof (catalog as any).product_ids === 'string' ? (catalog as any).product_ids.split(',') : []);

        // Benzersiz ve boş olmayan ID'leri temizle
        const uniqueIds = Array.from(new Set(
            rawIds
                .map((id: any) => String(id).trim())
                .filter((id: string) => id.length > 0 && id !== 'undefined' && id !== 'null')
        ));

        // Eğer Master ID Listesi geldiyse (allProductIds), sadece gerçekten var olanları say (Hayalet ürünleri ele).
        // Eğer liste boş geldiyse (örn: hata oldu), mevcut filtrelemeyi atla ve hepsini say (Eski davranış).
        if (allProductIds && allProductIds.length > 0) {
            const validIds = uniqueIds.filter((id: any) => allProductIds.includes(id));
            return validIds.length;
        }

        return uniqueIds.length;
    }, [allProductIds]);

    // User henüz yüklenmediyse basit bir skeleton göster
    if (isLoading) {
        return (
            <div className="space-y-6 md:space-y-8 animate-pulse">
                <div className="h-10 bg-muted rounded w-1/3"></div>
                <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-muted rounded-xl"></div>
                    ))}
                </div>
                <div className="h-64 bg-muted rounded-xl"></div>
            </div>
        )
    }

    // Gerçek veriye dayalı sparkline - son 10 güne benzetim (gerçek uygulamada API'den)
    const generateSparkline = (current: number) => {
        if (current === 0) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        // Basit bir artış eğrisi oluştur
        const base = Math.max(1, Math.floor(current * 0.6))
        return Array.from({ length: 10 }, (_, i) => Math.floor(base + (current - base) * (i / 9)))
    }

    // Sparkline verileri ve İstatistikler - Gelişmiş çapraz doğrulama
    const totalViews = initialStats?.totalViews || currentCatalogs.reduce((sum, c) => sum + (Number((c as any).view_count) || Number((c as any).views) || 0), 0)
    const productCount = totalProductCount || currentProducts.length

    // Yayınlanmış katalog sayısı - Hem stats hem listeden doğrula (Truthy kontrolü)
    const publishedCount = initialStats?.publishedCatalogs ??
        currentCatalogs.filter((c: any) => !!(c.is_published || c.published || c.status === 'published')).length

    // ... (rest of the functions) ...

    const stats = [
        {
            label: t("dashboard.totalProducts"),
            value: productCount.toString(),
            icon: Package,
            change: user?.maxProducts === 999999 ? t("dashboard.unlimited") : t("dashboard.used", { current: productCount, max: user?.maxProducts || 0 }),
            trend: null,
            trendUp: true,
            color: "violet",
            sparkline: generateSparkline(productCount),
        },
        {
            label: t("dashboard.totalViews"),
            value: totalViews.toLocaleString(),
            icon: Eye,
            change: t("dashboard.allCatalogs"),
            trend: null,
            trendUp: true,
            color: "blue",
            sparkline: generateSparkline(totalViews),
        },
        {
            label: t("catalogs.published"),
            value: publishedCount.toString(),
            icon: TrendingUp,
            change: t("dashboard.activeCatalogs"),
            trend: null,
            trendUp: true,
            color: "emerald",
            sparkline: generateSparkline(publishedCount),
        },
    ]

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Welcome Section - Enhanced Typography */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {t("dashboard.welcomeUser", { name: user?.name?.split(" ")[0] ?? t("common.user") })} 👋
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground/80 mt-1">
                        {t("landing.heroSubtitle")}
                    </p>
                </div>
            </div>

            {/* Onboarding Checklist */}
            <OnboardingChecklist
                hasProducts={currentProducts.length > 0}
                hasCatalogs={currentCatalogs.length > 0}
            />

            {/* Stats Grid - Premium Design */}
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-3">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card
                            key={stat.label}
                            className="relative overflow-hidden border-0 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 bg-card"
                        >
                            {/* Background Icon - Large & Faded */}
                            <div className="absolute -right-4 -top-4 opacity-[0.06]">
                                <Icon className="w-28 h-28" />
                            </div>

                            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-5 relative z-10">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.label}
                                </CardTitle>
                                <div className={cn(
                                    "p-2 rounded-xl",
                                    stat.color === 'violet' && "bg-violet-100 dark:bg-violet-900/30",
                                    stat.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30",
                                    stat.color === 'emerald' && "bg-emerald-100 dark:bg-emerald-900/30",
                                )}>
                                    <Icon className={cn(
                                        "w-4 h-4",
                                        stat.color === 'violet' && "text-violet-600 dark:text-violet-400",
                                        stat.color === 'blue' && "text-blue-600 dark:text-blue-400",
                                        stat.color === 'emerald' && "text-emerald-600 dark:text-emerald-400",
                                    )} />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 relative z-10">
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <div className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                            {stat.value}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-muted-foreground">{stat.change}</p>
                                            {stat.trend && (
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "text-[10px] px-1.5 py-0 h-4 font-medium border-0",
                                                        stat.trendUp
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    )}
                                                >
                                                    {stat.trendUp ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
                                                    {stat.trend}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Sparkline */}
                                <Sparkline data={stat.sparkline} color={stat.color} />
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Recent Catalogs - Enhanced */}
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 sm:p-5 border-b bg-muted/30">
                    <div>
                        <CardTitle className="text-lg font-semibold">{t("dashboard.recentActivity")}</CardTitle>
                        <CardDescription className="text-sm">{t("catalogs.title")}</CardDescription>
                    </div>
                    {currentCatalogs.length > 0 && (
                        <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary" asChild>
                            <Link href="/dashboard/catalogs">
                                {t("catalogs.view")}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    {recentCatalogs.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground mb-4">{t("products.noProductsDesc")}</p>
                            <Button
                                onClick={async () => {
                                    const maxCatalogs = user?.plan === 'pro' ? 999999 : (user?.plan === 'plus' ? 10 : 1)
                                    if (currentCatalogs.length >= maxCatalogs) {
                                        toast.error(t("catalogs.limitReached") || "Limit doldu")
                                        window.location.href = "/dashboard/catalogs?limit_reached=true"
                                        return
                                    }

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
                                        toast.error(error instanceof Error ? error.message : "Hata oluştu", { id: toastId })
                                    }
                                }}
                                className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                {t("dashboard.createCatalog")}
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {recentCatalogs.map((catalog: Catalog) => (
                                <div
                                    key={catalog.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        {/* Catalog Thumbnail/Preview */}
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center shrink-0 border border-violet-200/50 dark:border-violet-800/50 overflow-hidden relative">
                                            {catalog.logo_url ? (
                                                <NextImage src={catalog.logo_url} alt="" fill className="object-cover" unoptimized />
                                            ) : (
                                                (() => {
                                                    const catalogProducts = initialProducts
                                                        .filter(p => catalog.product_ids?.includes(p.id))
                                                        .filter(p => p.images?.[0] || p.image_url) // En az bir görseli olanlar
                                                        .slice(0, 4);

                                                    if (catalogProducts.length === 0) {
                                                        return <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" />;
                                                    }

                                                    if (catalogProducts.length === 1) {
                                                        const imgUrl = (catalogProducts[0].images?.[0] || catalogProducts[0].image_url) as string;
                                                        return <NextImage src={imgUrl} alt="" fill className="object-cover" unoptimized />;
                                                    }

                                                    return (
                                                        <div className="grid grid-cols-2 w-full h-full gap-0.5 bg-violet-100/50">
                                                            {catalogProducts.map((p, i) => {
                                                                const imgUrl = (p.images?.[0] || p.image_url) as string;
                                                                return (
                                                                    <div key={p.id} className={cn(
                                                                        "relative w-full h-full",
                                                                        catalogProducts.length === 3 && i === 2 && "col-span-2"
                                                                    )}>
                                                                        <NextImage
                                                                            src={imgUrl}
                                                                            alt=""
                                                                            fill
                                                                            className="object-cover"
                                                                            unoptimized
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                                                {catalog.name || (catalog as any).title || t("common.untitled")}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-muted-foreground">
                                                    {getSafeProductCount(catalog)} {t('products.product').toLowerCase()}
                                                </span>
                                                <span className="text-muted-foreground/30">•</span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <UserPen className="w-3 h-3" />
                                                    {(() => {
                                                        const updateErrorText = t("common.updateError") || "Bilinmiyor";
                                                        const dateStr = catalog.updated_at || catalog.created_at || (catalog as any).updatedAt || (catalog as any).createdAt || (catalog as any).updated_At;
                                                        if (!dateStr) return "-";
                                                        try {
                                                            const date = new Date(dateStr)
                                                            if (isNaN(date.getTime())) {
                                                                // Alternatif parse denemesi (ISO olmayan formatlar için)
                                                                const altDate = new Date(String(dateStr).replace(' ', 'T'));
                                                                if (isNaN(altDate.getTime())) return updateErrorText;
                                                                const diffInSeconds = Math.floor((new Date().getTime() - altDate.getTime()) / 1000);
                                                                if (diffInSeconds < 60) return "Az önce";
                                                                return formatDistanceToNow(altDate, { addSuffix: true, locale: tr })
                                                            }
                                                            const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
                                                            if (diffInSeconds < 60) return "Az önce";
                                                            return formatDistanceToNow(date, { addSuffix: true, locale: tr })
                                                        } catch {
                                                            return updateErrorText;
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3 sm:mt-0 ml-16 sm:ml-0">
                                        <Badge
                                            variant={catalog.is_published ? "default" : "secondary"}
                                            className={cn(
                                                "text-xs font-medium",
                                                catalog.is_published && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-0"
                                            )}
                                        >
                                            {catalog.is_published ? t("dashboard.published") : t("dashboard.draft")}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Link href={`/dashboard/builder?id=${catalog.id}`}>
                                                {t("dashboard.edit")}
                                                <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions - Premium Cards with Patterns */}
            <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2">
                {/* Add Product Card */}
                <Card className="relative overflow-hidden border-0 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all group">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5" />

                    {/* Dot Pattern */}
                    <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.15) 1px, transparent 0)',
                        backgroundSize: '20px 20px'
                    }} />

                    {/* Floating Icon */}
                    <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Package className="w-32 h-32 text-violet-500" />
                    </div>

                    <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                        <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/30 transition-shadow">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base">{t("dashboard.addProduct")}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">{t("dashboard.importExcel")}</p>
                        </div>
                        <Button
                            asChild
                            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                        >
                            <Link href="/dashboard/products?action=import" className="gap-2">
                                <Plus className="w-4 h-4" />
                                {t("products.addProduct")}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Templates Card */}
                <Card className="relative overflow-hidden border-0 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all group">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />

                    {/* Line Pattern */}
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'linear-gradient(45deg, rgba(245, 158, 11, 0.1) 25%, transparent 25%, transparent 50%, rgba(245, 158, 11, 0.1) 50%, rgba(245, 158, 11, 0.1) 75%, transparent 75%, transparent)',
                        backgroundSize: '40px 40px'
                    }} />

                    {/* Floating Icon */}
                    <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Palette className="w-32 h-32 text-amber-500" />
                    </div>

                    <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30 transition-shadow">
                            <Palette className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base">{t("catalogs.template")}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">{t("marketing.feature1")}</p>
                        </div>
                        <Button
                            variant="secondary"
                            asChild
                            className="w-full sm:w-auto bg-white/80 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 shadow-md hover:shadow-lg transition-all border-0"
                        >
                            <Link href="/dashboard/templates" className="gap-2">
                                <Sparkles className="w-4 h-4" />
                                {t("sidebar.templates")}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
