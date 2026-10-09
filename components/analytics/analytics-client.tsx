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
import { StatCard } from "@/components/ui/stat-card"
import { useTranslation } from "@/lib/contexts/i18n-provider"
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

// Pie chart color palette — constant, no need to recreate per render
// Tema grafik renkleri (globals.css --chart-*)
const DEVICE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']

export function AnalyticsClient({ stats: initialStats, catalogs }: AnalyticsClientProps) {
    const { t: baseT, language } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
    const { ref: barChartRef, size: barChartSize } = useElementSize<HTMLDivElement>()
    const { ref: pieChartRef, size: pieChartSize } = useElementSize<HTMLDivElement>()

    // React Query — timeRange değişince otomatik refetch, cache ile dedup
    // Fix #3: Only use initialStats for 30d (SSR default), other ranges fetch fresh
    const initialDataForRange = timeRange === "30d" ? initialStats : undefined
    const { data: stats, isLoading } = useDashboardStats(timeRange, initialDataForRange)

    const validatedStats = useMemo(() => stats || {
        totalViews: 0,
        periodViews: 0,
        publishedCatalogs: 0,
        totalCatalogs: 0,
        totalProducts: 0,
        topCatalogs: [],
        uniqueVisitors: 0,
        deviceStats: [],
        dailyViews: [],
        prevTotalViews: 0,
        prevUniqueVisitors: 0,
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
            // Fix #8: Use locale date string to match PostgreSQL CURRENT_DATE
            const dateStr = d.toLocaleDateString('sv-SE') // YYYY-MM-DD lokal
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
            name: d.device_type === 'mobile' ? t('dashboard.analytics.deviceMobile') :
                d.device_type === 'desktop' ? t('dashboard.analytics.deviceDesktop') :
                    d.device_type === 'tablet' ? 'Tablet' : t('dashboard.analytics.deviceOther'),
            value: d.view_count,
            percentage: d.percentage
        }))
        return data.length > 0 ? data : []
    }, [validatedStats.deviceStats, t])

    // Fix #11: Dynamic trend label based on timeRange
    const trendLabel = useMemo(() => {
        if (timeRange === '7d') return t("dashboard.analytics.vsLast7Days")
        if (timeRange === '90d') return t("dashboard.analytics.vsLast90Days")
        return t("dashboard.analytics.vsLastMonth")
    }, [timeRange, t])

    // KPI Trendleri — Fix #3: Use previous period data from backend
    // Fix #2: totalViews (all-time) as main value, trend compares period vs prev period
    const kpiStats = useMemo(() => [
        {
            // Seçilen dönemin görüntülenmesi (önceden tüm zamanlar gösteriliyor, dönem seçimi sayıyı değiştirmiyordu)
            label: t("dashboard.analytics.views"),
            value: validatedStats.periodViews,
            icon: Eye,
            color: "violet" as const,
            trend: calculateTrend(validatedStats.periodViews, validatedStats.prevTotalViews),
            hint: t("dashboard.analytics.allTimeViews", { count: validatedStats.totalViews.toLocaleString(language === "en" ? "en-US" : "tr-TR") }),
        },
        {
            label: t("dashboard.analytics.uniqueVisitors"),
            value: validatedStats.uniqueVisitors || 0,
            icon: Users,
            color: "blue" as const,
            trend: calculateTrend(validatedStats.uniqueVisitors || 0, validatedStats.prevUniqueVisitors)
        },
        {
            label: t("dashboard.analytics.publishedCatalogs"),
            value: validatedStats.publishedCatalogs,
            icon: FileText,
            color: "emerald" as const,
            trend: { show: false, value: 0, isPositive: true },
            hint: t("dashboard.analytics.ofCatalogs", { count: validatedStats.totalCatalogs }),
        },
        {
            label: t("dashboard.analytics.totalProducts"),
            value: validatedStats.totalProducts,
            icon: Package,
            color: "amber" as const,
            trend: { show: false, value: 0, isPositive: true },
            hint: t("dashboard.analytics.currentTotal"),
        }
    ] as Array<{ label: string; value: number; icon: typeof Eye; color: string; trend: ReturnType<typeof calculateTrend>; hint?: string }>, [validatedStats, t, language])

    const hasCatalogs = catalogs.length > 0

    return (
        <div className={cn(
            "space-y-6 md:space-y-8 relative transition-all duration-500",
            isLoading && "opacity-50 pointer-events-none blur-[1px]"
        )}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {t("dashboard.analytics.title")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("dashboard.analytics.subtitle")}
                    </p>
                </div>

                <div className="flex items-center p-1 bg-muted/50 rounded-xl border border-border/50 backdrop-blur-sm self-start md:self-center">
                    {(["7d", "30d", "90d"] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            aria-pressed={timeRange === range}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                timeRange === range
                                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {range === "7d" ? t("dashboard.analytics.last7Days") :
                                range === "30d" ? t("dashboard.analytics.last30Days") :
                                    t("dashboard.analytics.last90Days")}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid - 2 columns on mobile to see charts sooner */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {kpiStats.map((stat) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value.toLocaleString(language === "en" ? "en-US" : "tr-TR")}
                        icon={stat.icon}
                        hint={
                            <span className="flex flex-wrap items-center gap-1.5">
                                {stat.trend.show && stat.value > 0 ? (
                                    <>
                                        <Badge variant="outline" className={cn(
                                            "border-0 px-1.5 py-0 text-[10px] font-semibold",
                                            stat.trend.isPositive ? "bg-success-soft text-success-soft-foreground" : "bg-destructive-soft text-destructive-soft-foreground"
                                        )}>
                                            {stat.trend.isPositive ? <ArrowUpRight className="mr-0.5 size-2.5" /> : <ArrowDownRight className="mr-0.5 size-2.5" />}
                                            {stat.trend.value}%
                                        </Badge>
                                        <span>{trendLabel}</span>
                                        {stat.hint ? <span className="basis-full">{stat.hint}</span> : null}
                                    </>
                                ) : (
                                    <span>{stat.hint ?? t("dashboard.analytics.currentPeriodData")}</span>
                                )}
                            </span>
                        }
                    />
                ))}
            </div>

            {/* Main Chart Section */}
            <div className="grid gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4 border-border/50 shadow-sm min-w-0">
                    <CardHeader className="flex flex-row items-center justify-between border-b">
                        <div className="text-left">
                            <CardTitle className="text-base font-semibold">{t("dashboard.analytics.viewsOverTime")}</CardTitle>
                            <CardDescription className="text-xs">
                                {t("dashboard.analytics.dailyViewsDescription")}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-xs font-medium text-muted-foreground">{t("dashboard.analytics.views")}</span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div ref={barChartRef} className="h-[300px] w-full min-w-0">
                            {barChartSize.width > 0 && barChartSize.height > 0 && (
                                <ResponsiveContainer width={barChartSize.width} height={barChartSize.height} minWidth={0}>
                                    <BarChart data={barChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.85} />
                                                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.25} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            dy={10}
                                            interval={timeRange === '7d' ? 0 : (timeRange === '30d' ? 5 : 14)}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'var(--muted)' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                fontSize: '12px',
                                                backgroundColor: 'var(--color-card, white)',
                                                color: 'var(--card-foreground)'
                                            }}
                                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--card-foreground)' }}
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
                    <CardHeader className="text-left border-b">
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
                                                    <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30">
                                    <LucidePieChart className="w-12 h-12 mb-2" />
                                    <span className="text-xs">{t('dashboard.analytics.waitingForData')}</span>
                                </div>
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold">
                                    {devicePieData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground">{t("dashboard.analytics.views")}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {devicePieData.map((device, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
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
                <CardHeader className="border-b text-left">
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
                                    {t('dashboard.analytics.createFirstCatalog')}
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">{t('dashboard.analytics.catalogNameHeader')}</th>
                                        <th className="px-6 py-3 font-medium text-right">{t("dashboard.analytics.views")}</th>
                                        <th className="px-6 py-3 font-medium hidden md:table-cell">{t('dashboard.analytics.popularity')}</th>
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
                                                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-primary font-bold text-sm shrink-0 shadow-sm">
                                                            {cName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{cName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-mono font-bold text-base">{catalog.views.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell w-64">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-muted-foreground w-8">{language === 'tr' ? `%${Math.round(percentage)}` : `${Math.round(percentage)}%`}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {validatedStats.topCatalogs.length === 0 && (
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
            <div className="p-4 bg-accent border border-border rounded-2xl flex items-start gap-4 text-left">
                <div className="p-2 bg-card rounded-lg shadow-sm border border-border">
                    <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-primary">
                        {t("dashboard.analytics.realTimeTracking")}
                    </p>
                    <p className="text-xs text-primary/70 leading-relaxed">
                        {t("dashboard.analytics.dataDisclaimer")}
                    </p>
                </div>
            </div>
        </div>
    )
}
