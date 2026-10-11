import { Download, FileText, Package, Users } from "lucide-react"

import { StatCard } from "@/components/ui/stat-card"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { AdminStats, TranslationFn } from "@/components/admin/admin-dashboard/types"

interface OverviewTabProps {
    stats: AdminStats
    t: TranslationFn
}

export function OverviewTab({ stats, t }: OverviewTabProps) {
    const { language } = useTranslation()
    const format = (value: number) => value.toLocaleString(language === "en" ? "en-US" : "tr-TR")

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label={t("admin.totalUsers")} value={format(stats.usersCount)} icon={Users} hint={t("admin.totalUsersDesc")} />
            <StatCard label={t("admin.totalProducts")} value={format(stats.productsCount)} icon={Package} hint={t("admin.totalProductsDesc")} />
            <StatCard label={t("admin.totalCatalogs")} value={format(stats.catalogsCount)} icon={FileText} hint={t("admin.totalCatalogsDesc")} />
            <StatCard label={t("admin.downloads")} value={format(stats.totalExports)} icon={Download} hint={t("admin.downloadsDesc")} />
        </div>
    )
}
