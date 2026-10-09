"use client"

import Link from "next/link"
import NextImage from "next/image"
import { useCallback, useMemo } from "react"
import { ArrowRight, Eye, FileSpreadsheet, FolderOpen, LayoutGrid, LayoutTemplate, Loader2, Package, Plus, type LucideIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { enUS, tr } from "date-fns/locale"

import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import type { Catalog, DashboardStats } from "@/lib/actions/catalogs"
import { getPlanLimits } from "@/lib/constants"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useUser } from "@/lib/contexts/user-context"
import { useCreateCatalog } from "@/lib/hooks/use-create-catalog"

interface DashboardClientProps {
    initialCatalogs: Catalog[]
    totalProductCount: number
    initialStats: DashboardStats | null
}

const RECENT_CATALOG_COUNT = 5

function formatUpdatedAt(value: string | undefined, language: string, justNow: string): string | null {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    if (Date.now() - date.getTime() < 60_000) return justNow
    return formatDistanceToNow(date, { addSuffix: true, locale: language === "en" ? enUS : tr })
}

function QuickAction({ href, icon: Icon, title, description }: { href: string; icon: LucideIcon; title: string; description: string }) {
    return (
        <Link
            href={href}
            prefetch={false}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/30"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{title}</span>
                <span className="block truncate text-xs text-muted-foreground">{description}</span>
            </span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
    )
}

export function DashboardClient({ initialCatalogs, totalProductCount, initialStats }: DashboardClientProps) {
    const { t: baseT, language } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
    const { user } = useUser()
    const { createNewCatalog, isCreating } = useCreateCatalog()

    const catalogs = useMemo(() => (Array.isArray(initialCatalogs) ? initialCatalogs : []), [initialCatalogs])
    // Son düzenlenen önce; backend sırasına güvenmeden
    const recentCatalogs = useMemo(
        () =>
            [...catalogs]
                .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
                .slice(0, RECENT_CATALOG_COUNT),
        [catalogs],
    )

    const publishedCount = initialStats?.publishedCatalogs ?? catalogs.filter((c) => c.is_published).length
    const totalCatalogs = initialStats?.totalCatalogs ?? catalogs.length
    const productLimit = getPlanLimits(user?.plan).maxProducts
    const firstName = user?.name?.split(" ")[0]

    return (
        <div className="space-y-6 md:space-y-8">
            <PageHeader
                title={t("dashboard.welcomeUser", { name: firstName ?? t("common.user") })}
                description={t("dashboard.home.subtitle")}
            />

            <OnboardingChecklist hasProducts={totalProductCount > 0} hasCatalogs={totalCatalogs > 0} hasPublishedCatalog={publishedCount > 0} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <StatCard
                    label={t("dashboard.totalProducts")}
                    value={totalProductCount.toLocaleString(language === "en" ? "en-US" : "tr-TR")}
                    icon={Package}
                    hint={
                        Number.isFinite(productLimit)
                            ? t("dashboard.home.productsHint", { count: totalProductCount, max: productLimit })
                            : t("dashboard.home.productsHintUnlimited")
                    }
                />
                <StatCard
                    label={t("dashboard.catalogs")}
                    value={totalCatalogs}
                    icon={FolderOpen}
                    hint={t("dashboard.home.catalogsHint", { published: publishedCount, drafts: Math.max(0, totalCatalogs - publishedCount) })}
                />
                <StatCard
                    className="col-span-2 sm:col-span-1"
                    label={t("dashboard.home.viewsLast30")}
                    value={(initialStats?.periodViews ?? 0).toLocaleString(language === "en" ? "en-US" : "tr-TR")}
                    icon={Eye}
                    hint={
                        <Link href="/dashboard/analytics" prefetch={false} className="hover:text-foreground hover:underline">
                            {initialStats ? t("dashboard.home.viewsHint", { total: initialStats.totalViews ?? 0 }) : t("dashboard.home.seeAnalytics")}
                        </Link>
                    }
                />
            </div>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground">{t("dashboard.home.recentCatalogs")}</h2>
                    {catalogs.length > 0 ? (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard/catalogs" prefetch={false}>
                                {t("dashboard.home.allCatalogs")}
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    ) : null}
                </div>

                {recentCatalogs.length === 0 ? (
                    <EmptyState
                        icon={LayoutGrid}
                        title={t("dashboard.home.noCatalogsTitle")}
                        description={t("dashboard.home.noCatalogsDesc")}
                        action={
                            <Button onClick={createNewCatalog} disabled={isCreating}>
                                {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                                {t("dashboard.home.newCatalog")}
                            </Button>
                        }
                    />
                ) : (
                    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                        {recentCatalogs.map((catalog) => {
                            const preview = catalog.cover_image_url || catalog.logo_url
                            const updated = formatUpdatedAt(catalog.updated_at, language, t("common.justNow"))
                            const productCount = new Set(catalog.product_ids ?? []).size
                            return (
                                <li key={catalog.id}>
                                    <Link
                                        href={`/dashboard/builder?id=${catalog.id}`}
                                        prefetch={false}
                                        className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                                    >
                                        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                            {preview ? (
                                                <NextImage src={preview} alt="" fill sizes="48px" className="object-cover" unoptimized />
                                            ) : (
                                                <LayoutGrid className="size-5 text-muted-foreground" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium text-foreground">
                                                {catalog.name || t("common.untitled")}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {t("dashboard.home.productCount", { count: productCount })}
                                                {updated ? ` · ${updated}` : ""}
                                            </span>
                                        </span>
                                        <Badge variant={catalog.is_published ? "default" : "secondary"} className={catalog.is_published ? "border-0 bg-success-soft text-success-soft-foreground" : undefined}>
                                            {catalog.is_published ? t("dashboard.published") : t("dashboard.draft")}
                                        </Badge>
                                        <ArrowRight className="hidden size-4 text-muted-foreground sm:block" />
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">{t("dashboard.home.quickActions")}</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    <QuickAction href="/dashboard/products?action=new" icon={Package} title={t("dashboard.home.addProduct")} description={t("dashboard.home.addProductDesc")} />
                    <QuickAction href="/dashboard/products?action=import" icon={FileSpreadsheet} title={t("dashboard.home.importProducts")} description={t("dashboard.home.importProductsDesc")} />
                    <QuickAction href="/dashboard/templates" icon={LayoutTemplate} title={t("dashboard.home.browseTemplates")} description={t("dashboard.home.browseTemplatesDesc")} />
                </div>
            </section>
        </div>
    )
}
