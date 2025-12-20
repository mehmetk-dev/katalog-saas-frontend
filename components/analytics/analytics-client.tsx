"use client"

import { TrendingUp, Users, Eye, Clock, ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Globe, Smartphone, Monitor, Tablet } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n-provider"
import { DashboardStats, Catalog } from "@/lib/actions/catalogs"
import { cn } from "@/lib/utils"

interface AnalyticsClientProps {
    stats: DashboardStats | null
    catalogs: Catalog[]
}

export function AnalyticsClient({ stats, catalogs }: AnalyticsClientProps) {
    const { t } = useTranslation()

    // Mock data for charts
    const viewData = [45, 52, 38, 65, 48, 80, 70, 95, 85, 110, 100, 130];
    const topCatalogs = stats?.topCatalogs || [];

    const deviceData = [
        { name: 'Mobile', value: 65, icon: Smartphone, color: 'bg-violet-500' },
        { name: 'Desktop', value: 25, icon: Monitor, color: 'bg-blue-500' },
        { name: 'Tablet', value: 10, icon: Tablet, color: 'bg-emerald-500' },
    ];

    const locationData = [
        { name: 'İstanbul', value: 45 },
        { name: 'Ankara', value: 20 },
        { name: 'İzmir', value: 15 },
        { name: 'Diğer', value: 20 },
    ];

    return (
        <div className="space-y-8 relative">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -z-10 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
                <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.analytics.title")}</h1>
                <p className="text-muted-foreground mt-1">
                    {t("dashboard.analytics.subtitle")}
                </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.analytics.totalViews")}</CardTitle>
                        <Eye className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalViews.toLocaleString() || 0}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            <span className="text-xs font-medium text-emerald-500">+12%</span>
                            <span className="text-xs text-muted-foreground ml-1">{t("dashboard.analytics.last30Days")}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Unique Visitors</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.totalViews ? Math.floor(stats.totalViews * 0.7) : 0).toLocaleString()}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            <span className="text-xs font-medium text-emerald-500">+8.2%</span>
                            <span className="text-xs text-muted-foreground ml-1">{t("dashboard.analytics.last30Days")}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Session</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2m 45s</div>
                        <div className="flex items-center gap-1 mt-1">
                            <ArrowDownRight className="h-3 w-3 text-red-500" />
                            <span className="text-xs font-medium text-red-500">-3%</span>
                            <span className="text-xs text-muted-foreground ml-1">{t("dashboard.analytics.last30Days")}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4.2%</div>
                        <div className="flex items-center gap-1 mt-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            <span className="text-xs font-medium text-emerald-500">+1.5%</span>
                            <span className="text-xs text-muted-foreground ml-1">{t("dashboard.analytics.last30Days")}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Main Chart Card */}
                <Card className="md:col-span-4 border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-violet-500" />
                            {t("dashboard.analytics.viewsOverTime")}
                        </CardTitle>
                        <CardDescription>{t("dashboard.analytics.last30Days")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[240px] w-full flex items-end gap-1 sm:gap-2 pt-4">
                            {viewData.map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-violet-100 hover:bg-violet-500 transition-all rounded-t-sm relative"
                                        style={{ height: `${(val / 130) * 100}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {val} {t("dashboard.analytics.views")}
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground uppercase hidden sm:block">W{i + 1}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Device Context Card */}
                <Card className="md:col-span-3 border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-blue-500" />
                            {t("dashboard.analytics.deviceStats")}
                        </CardTitle>
                        <CardDescription>{t("dashboard.analytics.last30Days")}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <div className="flex h-4 w-full rounded-full overflow-hidden bg-muted">
                            {deviceData.map((d) => (
                                <div
                                    key={d.name}
                                    className={cn("h-full", d.color)}
                                    style={{ width: `${d.value}%` }}
                                />
                            ))}
                        </div>
                        <div className="space-y-3">
                            {deviceData.map((d) => {
                                const Icon = d.icon;
                                return (
                                    <div key={d.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-1.5 rounded-lg bg-muted text-foreground")}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium">{d.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold">{d.value}%</span>
                                            <div className={cn("w-2 h-2 rounded-full", d.color)} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Top Catalogs Table */}
                <Card className="md:col-span-4 border-0 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-emerald-500" />
                            {t("dashboard.analytics.topCatalogs")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {topCatalogs.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    {t("dashboard.analytics.noData")}
                                </div>
                            ) : (
                                topCatalogs.map((catalog, i) => (
                                    <div key={catalog.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-muted-foreground/50 w-4">#{i + 1}</span>
                                            <div>
                                                <p className="text-sm font-semibold">{catalog.name}</p>
                                                <p className="text-xs text-muted-foreground">catalog_id: {catalog.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{catalog.views} {t("dashboard.analytics.views")}</p>
                                            <div className="w-24 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${(catalog.views / (topCatalogs[0]?.views || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Geographic Stats Card */}
                <Card className="md:col-span-3 border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-amber-500" />
                            {t("dashboard.analytics.locationStats")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {locationData.map((loc) => (
                                <div key={loc.name} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{loc.name}</span>
                                        <span className="text-muted-foreground">{loc.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 rounded-full"
                                            style={{ width: `${loc.value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
