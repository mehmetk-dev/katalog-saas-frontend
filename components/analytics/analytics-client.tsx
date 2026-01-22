"use client"

import { useState, useMemo, useEffect } from "react"
import {
    Users,
    Eye,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    PieChart,
    Smartphone,
    Monitor,
    Tablet,
    FileText,
    Activity,
    Sparkles,
    Info
} from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-provider"
import { DashboardStats, Catalog, getDashboardStats } from "@/lib/actions/catalogs"
import { cn } from "@/lib/utils"

interface AnalyticsClientProps {
    stats: DashboardStats | null
    catalogs: Catalog[]
}

// Trend hesaplama
function calculateTrend(currentValue: number, previousValue: number): { value: number; isPositive: boolean } {
    if (previousValue === 0) {
        return { value: currentValue > 0 ? 100 : 0, isPositive: currentValue > 0 }
    }
    const percentChange = ((currentValue - previousValue) / previousValue) * 100
    return { value: Math.abs(Math.round(percentChange * 10) / 10), isPositive: percentChange >= 0 }
}

export function AnalyticsClient({ stats: initialStats, catalogs }: AnalyticsClientProps) {
    const { t, language } = useTranslation()
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
    const [stats, setStats] = useState<DashboardStats | null>(initialStats)
    const [isLoading, setIsLoading] = useState(false)

    // TimeRange değiştiğinde veriyi yeniden çek
    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true)
            try {
                const newStats = await getDashboardStats(timeRange)
                if (newStats) {
                    setStats(newStats)
                }
            } catch (error) {
                console.error("Error fetching stats for timeRange:", error)
            } finally {
                setIsLoading(false)
            }
        }

        // TimeRange değiştiğinde her zaman API'den çek
        // İlk render'da initialStats zaten set edilmiş (useState ile)
        fetchStats()
    }, [timeRange]) // initialStats'ı dependency'den çıkardık çünkü sadece ilk render'da kullanılıyor

    // Veri validasyonu: stats null veya geçersizse fallback kullan
    const validatedStats = stats || {
        totalViews: 0,
        publishedCatalogs: 0,
        totalCatalogs: 0,
        totalProducts: 0,
        topCatalogs: [],
        uniqueVisitors: 0,
        deviceStats: [],
        dailyViews: []
    }

    // Gerçek veriler (validated stats kullan)
    const totalViews = validatedStats.totalViews || 0
    const publishedCatalogs = validatedStats.publishedCatalogs ?? catalogs.filter(c => c.is_published).length
    const totalCatalogs = validatedStats.totalCatalogs ?? catalogs.length
    
    // Top catalogs - validated stats kullan
    const topCatalogs = useMemo(() => {
        if (validatedStats.topCatalogs && validatedStats.topCatalogs.length > 0) {
            return validatedStats.topCatalogs
        }
        // API'den gelmediyse, mevcut katalogları görüntülenme sayısına göre sırala
        return catalogs
            .map(catalog => ({
                id: catalog.id,
                name: catalog.name,
                views: catalog.view_count || 0
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5) // En fazla 5 katalog göster
    }, [validatedStats.topCatalogs, catalogs])

    // Gerçek unique visitors (validated stats kullan)
    const uniqueVisitors = validatedStats.uniqueVisitors || 0

    // Cihaz verilerini formatla (validated stats kullan)
    const deviceData = useMemo(() => {
        const realDeviceStats = validatedStats.deviceStats || []
        if (realDeviceStats.length > 0) {
            return realDeviceStats.map(d => ({
                name: d.device_type === 'mobile' ? (language === 'tr' ? 'Mobil' : 'Mobile') :
                    d.device_type === 'desktop' ? (language === 'tr' ? 'Masaüstü' : 'Desktop') :
                        d.device_type === 'tablet' ? 'Tablet' :
                            (language === 'tr' ? 'Bilinmiyor' : 'Unknown'),
                value: d.percentage,
                viewCount: d.view_count,
                icon: d.device_type === 'mobile' ? Smartphone :
                    d.device_type === 'tablet' ? Tablet : Monitor,
                color: d.device_type === 'mobile' ? 'bg-violet-500' :
                    d.device_type === 'tablet' ? 'bg-emerald-500' : 'bg-blue-500',
                textColor: d.device_type === 'mobile' ? 'text-violet-500' :
                    d.device_type === 'tablet' ? 'text-emerald-500' : 'text-blue-500'
            }))
        }
        // Veri yoksa boş dizi
        return []
        // Smartphone, Tablet, Monitor are stable icon imports
    }, [stats?.deviceStats, language])

    // Haftalık görüntülenme verileri (son 12 hafta) - validated stats kullan
    const viewData = useMemo(() => {
        const realDailyViews = validatedStats.dailyViews || []
        if (realDailyViews.length > 0) {
            // Günlük verileri haftalık gruplara böl
            const weeklyData: number[] = []
            let weekViews = 0
            let dayCount = 0

            realDailyViews.forEach((day, i) => {
                weekViews += day.view_count
                dayCount++

                if (dayCount === 7 || i === realDailyViews.length - 1) {
                    weeklyData.push(weekViews)
                    weekViews = 0
                    dayCount = 0
                }
            })

            // En az 4 hafta göster
            while (weeklyData.length < 4) {
                weeklyData.unshift(0)
            }

            return weeklyData.slice(-12) // Son 12 hafta
        }
        // Veri yoksa boş dizi
        return []
    }, [validatedStats.dailyViews])

    // Trend hesaplama
    const lastWeekViews = viewData.length >= 2 ? viewData[viewData.length - 1] : 0
    const prevWeekViews = viewData.length >= 2 ? viewData[viewData.length - 2] : 0
    const viewsTrend = calculateTrend(lastWeekViews, prevWeekViews)

    // Ortalama oturum süresi (tahmini - gerçek veri yok)
    // const avgSessionMinutes = totalViews > 0 ? 2 : 0
    // const avgSessionSeconds = totalViews > 0 ? 30 : 0

    // Dönüşüm oranı (tahmini)
    // const conversionRate = totalViews > 10 ? ((uniqueVisitors / totalViews) * 10).toFixed(1) : "0.0"

    const timeRangeLabel = {
        "7d": t("dashboard.analytics.last7Days"),
        "30d": t("dashboard.analytics.last30Days"),
        "90d": language === 'tr' ? "Son 90 Gün" : "Last 90 Days"
    }

    // Veri var mı kontrolü
    const hasData = totalViews > 0 || uniqueVisitors > 0 || deviceData.length > 0

    return (
        <div className="space-y-8 relative">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -z-10 w-[400px] h-[400px] bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl shadow-lg shadow-violet-500/20">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("dashboard.analytics.title")}</h1>
                        {isLoading && (
                            <div className="ml-2 text-sm text-muted-foreground animate-pulse">
                                {language === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        {t("dashboard.analytics.subtitle")}
                    </p>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl">
                    {(["7d", "30d", "90d"] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            disabled={isLoading}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                timeRange === range
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                                isLoading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {range === "7d" ? (language === 'tr' ? "7 Gün" : "7 Days") :
                                range === "30d" ? (language === 'tr' ? "30 Gün" : "30 Days") :
                                    (language === 'tr' ? "90 Gün" : "90 Days")}
                        </button>
                    ))}
                </div>
            </div>

            {/* No Data Message */}
            {!hasData && (
                <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="py-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            {language === 'tr' ? 'Henüz Veri Yok' : 'No Data Yet'}
                        </h3>
                        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                            {language === 'tr'
                                ? 'Kataloglarınız görüntülendiğinde burada detaylı istatistikler göreceksiniz.'
                                : 'You will see detailed statistics here when your catalogs are viewed.'}
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/builder">
                                <Sparkles className="w-4 h-4 mr-2" />
                                {language === 'tr' ? 'Katalog Oluştur' : 'Create Catalog'}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Quick Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Views */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-background">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("dashboard.analytics.totalViews")}
                        </CardTitle>
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                            <Eye className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalViews.toLocaleString()}</div>
                        {totalViews > 0 && viewsTrend.value > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                                {viewsTrend.isPositive ? (
                                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                                )}
                                <span className={cn(
                                    "text-sm font-semibold",
                                    viewsTrend.isPositive ? "text-emerald-500" : "text-red-500"
                                )}>
                                    {viewsTrend.isPositive ? "+" : "-"}{viewsTrend.value}%
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">
                                    {timeRangeLabel[timeRange]}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Unique Visitors */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {language === 'tr' ? 'Tekil Ziyaretçi' : 'Unique Visitors'}
                        </CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{uniqueVisitors.toLocaleString()}</div>
                        <div className="flex items-center gap-1 mt-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                {language === 'tr' ? 'Benzersiz IP adresleri' : 'Unique IP addresses'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Avg Session */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {language === 'tr' ? 'Yayında Katalog' : 'Published Catalogs'}
                        </CardTitle>
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{publishedCatalogs}</div>
                        <div className="flex items-center gap-1 mt-2">
                            <span className="text-xs text-muted-foreground">
                                {language === 'tr' ? `Toplam ${totalCatalogs} katalogdan` : `Out of ${totalCatalogs} total`}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Products */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {language === 'tr' ? 'Toplam Ürün' : 'Total Products'}
                        </CardTitle>
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{validatedStats.totalProducts || 0}</div>
                        <div className="flex items-center gap-1 mt-2">
                            <span className="text-xs text-muted-foreground">
                                {language === 'tr' ? 'Envanterinizdeki ürünler' : 'Products in your inventory'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Views Over Time Chart */}
                <Card className="lg:col-span-4 border-0 shadow-md">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-violet-500" />
                                    {t("dashboard.analytics.viewsOverTime")}
                                </CardTitle>
                                <CardDescription>{timeRangeLabel[timeRange]}</CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">
                                    {language === 'tr' ? 'toplam' : 'total'}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {viewData.length > 0 ? (
                            <div className="h-[260px] w-full flex items-end gap-1 sm:gap-2 pt-4">
                                {viewData.map((val, i) => {
                                    const maxVal = Math.max(...viewData, 1)
                                    const height = (val / maxVal) * 100
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div
                                                className="w-full bg-gradient-to-t from-violet-500 to-violet-400 hover:from-violet-600 hover:to-violet-500 transition-all rounded-t-md relative cursor-pointer"
                                                style={{ height: `${Math.max(height, 2)}%` }}
                                            >
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                                    {val.toLocaleString()} {t("dashboard.analytics.views")}
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase hidden sm:block">
                                                {language === 'tr' ? `H${i + 1}` : `W${i + 1}`}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="h-[260px] flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>{language === 'tr' ? 'Henüz görüntülenme verisi yok' : 'No view data yet'}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Device Distribution */}
                <Card className="lg:col-span-3 border-0 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-blue-500" />
                            {t("dashboard.analytics.deviceStats")}
                        </CardTitle>
                        <CardDescription>{timeRangeLabel[timeRange]}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {deviceData.length > 0 ? (
                            <>
                                {/* Visual Bar */}
                                <div className="flex h-5 w-full rounded-full overflow-hidden bg-muted shadow-inner">
                                    {deviceData.map((d) => (
                                        <div
                                            key={d.name}
                                            className={cn("h-full transition-all", d.color)}
                                            style={{ width: `${d.value}%` }}
                                        />
                                    ))}
                                </div>

                                {/* Device List */}
                                <div className="space-y-4">
                                    {deviceData.map((d) => {
                                        const Icon = d.icon
                                        return (
                                            <div key={d.name} className="flex items-center justify-between group hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("p-2 rounded-lg", d.color, "bg-opacity-20")}>
                                                        <Icon className={cn("w-5 h-5", d.textColor)} />
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">{d.name}</span>
                                                        <div className="text-xs text-muted-foreground">
                                                            {d.viewCount.toLocaleString()} {t("dashboard.analytics.views")}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-bold">{d.value}%</span>
                                                    <div className={cn("w-3 h-3 rounded-full", d.color)} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">
                                <PieChart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>{language === 'tr' ? 'Cihaz verisi yok' : 'No device data'}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Top Catalogs */}
                <Card className="lg:col-span-4 border-0 shadow-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-500" />
                            {t("dashboard.analytics.topCatalogs")}
                        </CardTitle>
                        <CardDescription>
                            {language === 'tr' ? 'En çok görüntülenen 5 kataloğunuz' : 'Your top 5 most viewed catalogs'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {topCatalogs.length === 0 && catalogs.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                    <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <p className="text-muted-foreground mb-4">{t("dashboard.analytics.noData")}</p>
                                <Button variant="outline" asChild>
                                    <Link href="/dashboard/builder">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        {language === 'tr' ? 'Katalog Oluştur' : 'Create Catalog'}
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {topCatalogs.map((catalog, i) => {
                                    const maxViews = Math.max(...topCatalogs.map(c => c.views), 1)
                                    const percentage = maxViews > 0 ? (catalog.views / maxViews) * 100 : 0
                                    return (
                                        <div key={catalog.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                                                    i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                        i === 1 ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                                                            i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                                                "bg-muted text-muted-foreground"
                                                )}>
                                                    #{i + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold group-hover:text-violet-600 transition-colors truncate">{catalog.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {language === 'tr' ? 'Görüntülenme' : 'Views'}: {catalog.views.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-4">
                                                <p className="font-bold text-lg">{catalog.views.toLocaleString()}</p>
                                                <div className="w-24 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                                                        style={{ width: `${Math.max(percentage, 2)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="lg:col-span-3 border-0 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-500" />
                            {language === 'tr' ? 'Nasıl Çalışır?' : 'How It Works'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
                            <h4 className="font-semibold text-violet-700 dark:text-violet-300 mb-2 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                {language === 'tr' ? 'Görüntülenme' : 'Views'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                {language === 'tr'
                                    ? 'Her benzersiz ziyaretçi günde bir kez sayılır. Aynı IP aynı gün tekrar açsa sayılmaz.'
                                    : 'Each unique visitor is counted once per day. Same IP opening again on same day is not counted.'}
                            </p>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {language === 'tr' ? 'Tekil Ziyaretçi' : 'Unique Visitors'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                {language === 'tr'
                                    ? 'IP adresi ve tarayıcı bilgisi ile benzersiz ziyaretçiler tespit edilir.'
                                    : 'Unique visitors are identified by IP address and browser info.'}
                            </p>
                        </div>

                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                            <h4 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                {language === 'tr' ? 'Sahip Görüntüleme' : 'Owner Views'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                {language === 'tr'
                                    ? 'Siz kendi kataloglarınızı açtığınızda görüntülenme sayılmaz.'
                                    : 'When you view your own catalogs, it is not counted.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Summary Footer */}
            {hasData && (
                <Card className="border-0 shadow-md bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 dark:from-violet-950/30 dark:via-indigo-950/30 dark:to-blue-950/30">
                    <CardContent className="py-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-background rounded-xl shadow-sm">
                                    <Sparkles className="w-6 h-6 text-violet-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">
                                        {language === 'tr' ? 'Kataloglarınız Büyüyor!' : 'Your Catalogs are Growing!'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {language === 'tr'
                                            ? `${publishedCatalogs} yayında katalog ile ${totalViews} görüntülenme elde ettiniz.`
                                            : `You achieved ${totalViews} views with ${publishedCatalogs} published catalogs.`}
                                    </p>
                                </div>
                            </div>
                            <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                                <Link href="/dashboard/builder">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    {language === 'tr' ? 'Yeni Katalog Oluştur' : 'Create New Catalog'}
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
