import { Download, FileText, Package, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AdminStats, TranslationFn } from "@/components/admin/admin-dashboard/types"

interface OverviewTabProps {
    stats: AdminStats
    t: TranslationFn
}

export function OverviewTab({ stats, t }: OverviewTabProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("admin.totalUsers")}</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.usersCount}</div>
                    <p className="text-xs text-muted-foreground">{t("admin.totalUsersDesc")}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("admin.totalProducts")}</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.productsCount}</div>
                    <p className="text-xs text-muted-foreground">{t("admin.totalProductsDesc")}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("admin.totalCatalogs")}</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.catalogsCount}</div>
                    <p className="text-xs text-muted-foreground">{t("admin.totalCatalogsDesc")}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("admin.downloads")}</CardTitle>
                    <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalExports}</div>
                    <p className="text-xs text-muted-foreground">{t("admin.downloadsDesc")}</p>
                </CardContent>
            </Card>
        </div>
    )
}
