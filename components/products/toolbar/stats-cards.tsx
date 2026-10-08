"use client"

import { AlertTriangle, CheckCircle2, Package, Wallet } from "lucide-react"

import { StatCard } from "@/components/ui/stat-card"
import { useTranslation } from "@/lib/contexts/i18n-provider"

interface ProductStatsCardsProps {
    stats: {
        total: number
        inStock: number
        lowStock: number
        outOfStock: number
        totalValue?: number
    }
}

const formatNumber = (value: number) => new Intl.NumberFormat("tr-TR").format(value)
// Pano özeti: kuruş göstermeye gerek yok
const formatMoney = (value: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value)

export function ProductStatsCards({ stats }: ProductStatsCardsProps) {
    const { t: baseT } = useTranslation()
    const t = (key: string, params?: Record<string, unknown>) => baseT(key, params) as string
    const critical = stats.lowStock + stats.outOfStock

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t("products.totalProducts")} value={formatNumber(stats.total)} icon={Package} />
            <StatCard
                label={t("products.inStock")}
                value={formatNumber(stats.inStock)}
                icon={CheckCircle2}
                tone="success"
                hint={t("products.inStockHint")}
            />
            <StatCard
                label={t("products.critical")}
                value={formatNumber(critical)}
                icon={AlertTriangle}
                tone={critical > 0 ? "warning" : "default"}
                hint={t("products.criticalHint", { low: stats.lowStock, out: stats.outOfStock })}
            />
            <StatCard
                label={t("products.stockValue")}
                value={formatMoney(stats.totalValue ?? 0)}
                icon={Wallet}
            />
        </div>
    )
}
