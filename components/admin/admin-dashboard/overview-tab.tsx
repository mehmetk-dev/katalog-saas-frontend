import { StatItem, StatStrip } from "@/components/ui/stat-card"
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
        <StatStrip>
            <StatItem label={t("admin.totalUsers")} value={format(stats.usersCount)} hint={t("admin.totalUsersDesc")} />
            <StatItem label={t("admin.totalProducts")} value={format(stats.productsCount)} hint={t("admin.totalProductsDesc")} />
            <StatItem label={t("admin.totalCatalogs")} value={format(stats.catalogsCount)} hint={t("admin.totalCatalogsDesc")} />
            <StatItem label={t("admin.downloads")} value={format(stats.totalExports)} hint={t("admin.downloadsDesc")} />
        </StatStrip>
    )
}
