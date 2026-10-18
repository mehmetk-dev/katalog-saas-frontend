"use client"

import { StatItem, StatStrip, type StatTone } from "@/components/ui/stat-card"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { StockFilter } from "@/components/products/products-page-utils"

interface ProductStatsCardsProps {
    stats: {
        total: number
        inStock: number
        lowStock: number
        outOfStock: number
        totalValue?: number
    }
    stockFilter: StockFilter
    onStockFilterChange: (filter: StockFilter) => void
}

const formatNumber = (value: number) => new Intl.NumberFormat("tr-TR").format(value)
// Pano özeti: kuruş göstermeye gerek yok
const formatMoney = (value: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value)

/**
 * Stok özeti şeridi. Stok hücreleri aynı zamanda stok filtresidir: tıklayınca liste o duruma
 * daralır, tekrar tıklayınca filtre kalkar.
 */
export function ProductStatsCards({ stats, stockFilter, onStockFilterChange }: ProductStatsCardsProps) {
    const { t: baseT } = useTranslation()
    const t = (key: string, params?: Record<string, unknown>) => baseT(key, params) as string

    const cells: Array<{ filter: StockFilter; label: string; value: number; tone: StatTone; hint?: string }> = [
        { filter: "all", label: t("products.totalProducts"), value: stats.total, tone: "default" },
        { filter: "in_stock", label: t("products.inStock"), value: stats.inStock, tone: "success", hint: t("products.inStockHint") },
        { filter: "low_stock", label: t("products.lowStock"), value: stats.lowStock, tone: stats.lowStock > 0 ? "warning" : "default", hint: t("products.lowStockHint") },
        { filter: "out_of_stock", label: t("products.outOfStock"), value: stats.outOfStock, tone: stats.outOfStock > 0 ? "destructive" : "default" },
    ]

    return (
        <StatStrip role="group" aria-label={t("products.stockSummary")}>
            {cells.map((cell) => {
                const active = stockFilter === cell.filter
                return (
                    <StatItem
                        key={cell.filter}
                        label={cell.label}
                        value={formatNumber(cell.value)}
                        dot={cell.tone}
                        title={cell.hint}
                        active={active}
                        onClick={() => onStockFilterChange(active && cell.filter !== "all" ? "all" : cell.filter)}
                    />
                )
            })}
            <StatItem label={t("products.stockValue")} value={formatMoney(stats.totalValue ?? 0)} />
        </StatStrip>
    )
}
