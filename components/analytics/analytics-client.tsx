"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import {
    Users,
    Eye,
    ArrowUpRight,
    ArrowDownRight,
    FileText,
    Sparkles,
    LayoutGrid,
    Package,
    PieChart as LucidePieChart
} from "lucide-react"
import Link from "next/link"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n-provider"
import { DashboardStats, Catalog } from "@/lib/actions/catalogs"
import { cn } from "@/lib/utils"
import { useDashboardStats } from "@/lib/hooks/use-catalogs"

interface AnalyticsClientProps {
    stats: DashboardStats | null
    catalogs: Catalog[]
}

function useElementSize<T extends HTMLElement>() {
    const ref = useRef<T | null>(null)
    const [size, setSize] = useState({ width: 0, height: 0 })

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const updateSize = () => {
            const rect = element.getBoundingClientRect()
            setSize({
                width: Math.max(0, Math.floor(rect.width)),
                height: Math.max(0, Math.floor(rect.height)),
            })
        }

        updateSize()

        const observer = new ResizeObserver(() => {
            updateSize()
        })

        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    return { ref, size }
}

// Gerçek Trend Hesaplama Fonksiyonu
function calculateTrend(currentValue: number, previousValue: number) {
    if (previousValue === 0) {
        if (currentValue === 0) return { value: 0, isPositive: true, show: false }
        return { value: 100, isPositive: true, show: true }
    }
    const percentChange = ((currentValue - previousValue) / previousValue) * 100
    return {
        value: Math.abs(Math.round(percentChange * 10) / 10),
        isPositive: percentChange >= 0,
        show: Math.abs(percentChange) > 0
    }
}

export function AnalyticsClient({ stats: initialStats, catalogs }: AnalyticsClientProps) {
    const { t: baseT, language } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
    const { ref: barChartRef, size: barChartSize } = useElementSize<HTMLDivElement>()
    const { ref: pieChartRef, size: pieChartSize } = useElementSize<HTMLDivElement>()

    // React Query — timeRange değişince otomatik refetch, cache ile dedup
    const { data: stats, isLoading } = useDashboardStats(timeRange, initialStats)

    const validatedStats = useMemo(() => stats || {
        totalViews: 0,
        publishedCatalogs: 0,
        totalCatalogs: 0,
        totalProducts: 0,
        topCatalogs: [],
        uniqueVisitors: 0,
        deviceStats: [],
        dailyViews: []
    }, [stats])

    // Grafik Verisi Hazırlığı (Zaman akışını korumak için eksik günleri 0 ile doldurur)
    const barChartData = useMemo(() => {
        const rawData = validatedStats.dailyViews || []
        const daysCount = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;

        const data = []
        const now = new Date()

        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date()
            d.setDate(now.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            const match = rawData.find(rd => rd.view_date === dateStr)

            data.push({
                name: d.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                    weekday: daysCount <= 7 ? 'short' : undefined,
                    day: 'numeric',
                    month: daysCount > 7 ? 'short' : undefined
                }),
                views: match ? (match.view_count || 0) : 0,
                fullDate: dateStr
            })
        }

        return data
    }, [validatedStats.dailyViews, language, timeRange])

    // Cihaz Dağılımı Verisi
    const devicePieData = useMemo(() => {
        const data = (validatedStats.deviceStats || []).map(d => ({
            name: d.device_type === 'mobile' ? (language === 'tr' ? 'Mobil' : 'Mobile') :
                d.device_type === 'desktop' ? (language === 'tr' ? 'Masaüstü' : 'Desktop') :
                    d.device_type === 'tablet' ? 'Tablet' : (language === 'tr' ? 'Diğer' : 'Other'),
            value: d.view_count,
            percentage: d.percentage
        }))
        return data.length > 0 ? data : []
    }, [validatedStats.deviceStats, language])

    const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B']

    // KPI Trendleri
    const kpiStats = useMemo(() => [
        {
            label: t("dashboard.analytics.totalViews"),
            value: validatedStats.totalViews,
            icon: Eye,
            color: "violet" as const,
            trend: calculateTrend(validatedStats.totalViews, 0)
        },
        {
            label: t("dashboard.analytics.uniqueVisitors"),
            value: validatedStats.uniqueVisitors || 0,
            icon: Users,
            color: "blue" as const,
            trend: calculateTrend(validatedStats.uniqueVisitors || 0, 0)
        },
        {
            label: t("dashboard.analytics.publishedCatalogs"),
            value: validatedStats.publishedCatalogs,
            icon: FileText,
            color: "emerald" as const,
            trend: { show: false, value: 0, isPositive: true }
        },
        {
            label: t("dashboard.analytics.totalProducts"),
            value: validatedStats.totalProducts,
            icon: Package,
            color: "amber" as const,
            trend: { show: false, value: 0, isPositive: true }
        }
    ], [validatedStats, t])

    const hasCatalogs = catalogs.length > 0

    return (
        <div className={cn(
            "space-y-6 md:space-y-8 relative transition-all duration-500",
            isLoading && "opacity-50 pointer-events-none blur-[1px]"
        )}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                        {t("dashboard.analytics.title")}
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                        {t("dashboard.analytics.subtitle")}
                    </p>
                </div>

                <div className="flex items-center p-1 bg-muted/50 rounded-xl border border-border/50 backdrop-blur-sm self-start md:self-center">
                    {(["7d", "30d", "90d"] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                timeRange === range
                                    ? "bg-white dark:bg-slate-800 text-foreground shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {range === "7d" ? t("dashboard.analytics.last7Days") :
                                range === "30d" ? t("dashboard.analytics.last30Days") :
                                    (language === 'tr' ? "90 GÜN" : "90 DAYS")}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid - 2 columns on mobile to see charts sooner */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {kpiStats.map((stat, i) => (
                    <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
                        <div className={cn(
                            "absolute right-0 top-0 w-24 h-24 -mr-8 -mt-8 opacity-5 group-hover:opacity-10 transition-opacity",
                            stat.color === 'violet' && "text-violet-600",
                            stat.color === 'blue' && "text-blue-600",
                            stat.color === 'emerald' && "text-emerald-600",
                            stat.color === 'amber' && "text-amber-600",
                        )}>
                            <stat.icon className="w-full h-full" />
                        </div>
                        <CardHeader className="pb-1 sm:pb-2 space-y-0 text-left px-3 sm:px-6">
                            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-left px-3 sm:px-6 pb-3 sm:pb-6">
                            <div className="text-xl sm:text-2xl font-bold">{stat.value.toLocaleString()}</div>
                            <div className="flex items-center gap-1.5 mt-1 min-h-[20px]">
                                {stat.trend.show && stat.value > 0 ? (
                                    <>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] px-1.5 py-0 border-0 font-bold",
                                            stat.trend.isPositive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40" : "bg-red-50 text-red-600 dark:bg-red-900/20"
                                        )}>
                                            {stat.trend.isPositive ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
                                            {stat.trend.value}%
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                            {t("dashboard.analytics.vsLastMonth")}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground">
                                        {t("dashboard.analytics.currentPeriodData")}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Chart Section */}
            <div className="grid gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4 border-border/50 shadow-sm min-w-0">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5 py-4">
                        <div className="text-left">
                            <CardTitle className="text-base font-semibold">{t("dashboard.analytics.viewsOverTime")}</CardTitle>
                            <CardDescription className="text-xs">
                                {t("dashboard.analytics.dailyViewsDescription")}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-violet-500" />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">{t("dashboard.analytics.views")}</span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div ref={barChartRef} className="h-[300px] w-full min-w-0">
                            {barChartSize.width > 0 && barChartSize.height > 0 && (
                                <ResponsiveContainer width={barChartSize.width} height={barChartSize.height} minWidth={0}>
                                    <BarChart data={barChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#64748B' }}
                                            dy={10}
                                            interval={timeRange === '7d' ? 0 : (timeRange === '30d' ? 5 : 14)}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                            tick={{ fontSize: 10, fill: '#64748B' }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                fontSize: '12px',
                                                backgroundColor: 'white'
                                            }}
                                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#1e293b' }}
                                            formatter={(value: unknown) => [`${value} ${t("dashboard.analytics.views")}`, '']}
                                        />
                                        <Bar
                                            dataKey="views"
                                            fill="url(#barGradient)"
                                            radius={[6, 6, 0, 0]}
                                            barSize={32}
                                            animationDuration={1500}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Device Distribution Card */}
                <Card className="lg:col-span-3 border-border/50 shadow-sm flex flex-col min-w-0">
                    <CardHeader className="text-left border-b bg-muted/5 py-4">
                        <CardTitle className="text-base font-semibold">{t("dashboard.analytics.deviceStats")}</CardTitle>
                        <CardDescription className="text-xs">
                            {t("dashboard.analytics.deviceDistributionDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center gap-6 pt-6">
                        <div ref={pieChartRef} className="h-[180px] w-full relative min-w-0">
                            {devicePieData.length > 0 ? (
                                pieChartSize.width > 0 && pieChartSize.height > 0 && (
                                    <ResponsiveContainer width={pieChartSize.width} height={pieChartSize.height} minWidth={0}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={devicePieData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                animationBegin={0}
                                                animationDuration={1500}
                                            >
                                                {devicePieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30">
                                    <LucidePieChart className="w-12 h-12 mb-2" />
                                    <span className="text-xs">{language === 'tr' ? 'Veri Bekleniyor' : 'Waiting for Data'}</span>
                                </div>
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold">
                                    {devicePieData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase">{t("dashboard.analytics.views")}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {devicePieData.map((device, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-sm font-medium">{device.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-muted-foreground">{device.value.toLocaleString()}</span>
                                        <span className="text-sm font-bold w-12 text-right">{device.percentage}%</span>
                                    </div>
                                </div>
                            ))}
                            {devicePieData.length === 0 && (
                                <div className="text-center py-4 text-xs text-muted-foreground italic">
                                    {t("dashboard.analytics.noData")}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row - Top Catalogs Table */}
            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/20 text-left py-4">
                    <CardTitle className="text-base font-semibold">{t("dashboard.analytics.topCatalogs")}</CardTitle>
                    <CardDescription className="text-xs">
                        {t("dashboard.analytics.topCatalogsDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {!hasCatalogs ? (
                        <div className="p-12 text-center space-y-4">
                            <LayoutGrid className="w-12 h-12 mx-auto text-muted-foreground/20" />
                            <p className="text-sm text-muted-foreground">{t("dashboard.analytics.noData")}</p>
                            <Button size="sm" asChild variant="outline">
                                <Link href="/dashboard/builder">
                                    {language === 'tr' ? 'İlk Kataloğu Oluştur' : 'Create First Catalog'}
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/30 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">{language === 'tr' ? 'KATALOG ADI' : 'CATALOG NAME'}</th>
                                        <th className="px-6 py-3 font-semibold text-right">{t("dashboard.analytics.views").toUpperCase()}</th>
                                        <th className="px-6 py-3 font-semibold hidden md:table-cell">{language === 'tr' ? 'POPÜLERLİK' : 'POPULARITY'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {validatedStats.topCatalogs.map((catalog, i) => {
                                        const cName = catalog.name || t("dashboard.analytics.untitledCatalog");
                                        const maxViews = Math.max(...validatedStats.topCatalogs.map(c => c.views), 1)
                                        const percentage = (catalog.views / maxViews) * 100
                                        return (
                                            <tr key={i} className="hover:bg-muted/30 transition-colors group cursor-default">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm shrink-0 shadow-sm">
                                                            {cName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">{cName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-mono font-bold text-base">{catalog.views.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell w-64">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-muted-foreground w-8">%{Math.round(percentage)}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {devicePieData.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground italic">
                                                {t("dashboard.analytics.collectingData")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Section - Stripe-like Alert */}
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl flex items-start gap-4 dark:bg-violet-900/10 dark:border-violet-800/20 text-left">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-violet-100 dark:bg-slate-900 dark:border-slate-800">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-violet-900 dark:text-violet-300">
                        {t("dashboard.analytics.realTimeTracking")}
                    </p>
                    <p className="text-xs text-violet-700/70 dark:text-violet-400/70 leading-relaxed">
                        {t("dashboard.analytics.dataDisclaimer")}
                    </p>
                </div>
            </div>
        </div>
    )
}
