"use client"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
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

type Tone = "default" | "success" | "warning" | "destructive"

const DOT_TONE: Record<Tone, string> = {
    default: "bg-muted-foreground/40",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
}

/**
 * Stok özeti şeridi. Stok hücreleri aynı zamanda stok filtresidir: tıklayınca liste o duruma
 * daralır, tekrar tıklayınca filtre kalkar.
 */
export function ProductStatsCards({ stats, stockFilter, onStockFilterChange }: ProductStatsCardsProps) {
    const { t: baseT } = useTranslation()
    const t = (key: string, params?: Record<string, unknown>) => baseT(key, params) as string

    const cells: Array<{ filter: StockFilter; label: string; value: number; tone: Tone; hint?: string }> = [
        { filter: "all", label: t("products.totalProducts"), value: stats.total, tone: "default" },
        { filter: "in_stock", label: t("products.inStock"), value: stats.inStock, tone: "success", hint: t("products.inStockHint") },
        { filter: "low_stock", label: t("products.lowStock"), value: stats.lowStock, tone: stats.lowStock > 0 ? "warning" : "default", hint: t("products.lowStockHint") },
        { filter: "out_of_stock", label: t("products.outOfStock"), value: stats.outOfStock, tone: stats.outOfStock > 0 ? "destructive" : "default" },
    ]

    return (
        <div
            role="group"
            aria-label={t("products.stockSummary")}
            className="snap-x rounded-xl sm:flex sm:overflow-x-auto sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden"
        >
            {/* Mobilde 2x2 (eskiden yatay kayıyordu ve son iki kutu görünmüyordu); ayraçlar gap-px + bg-border ile */}
            <div className="grid min-w-full grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border shadow-sm sm:flex">
                {cells.map((cell) => {
                    const active = stockFilter === cell.filter
                    return (
                        <button
                            key={cell.filter}
                            type="button"
                            aria-pressed={active}
                            title={cell.hint}
                            onClick={() => onStockFilterChange(active && cell.filter !== "all" ? "all" : cell.filter)}
                            className={cn(
                                "group relative flex min-w-0 flex-1 snap-start flex-col items-start gap-1 bg-card px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:min-w-[8.5rem]",
                                active && "bg-muted hover:bg-muted"
                            )}
                        >
                            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <span aria-hidden className={cn("size-1.5 rounded-full", DOT_TONE[cell.tone])} />
                                {cell.label}
                            </span>
                            <span className="text-xl font-semibold tracking-tight tabular-nums text-foreground">
                                {formatNumber(cell.value)}
                            </span>
                            {active && <span aria-hidden className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-foreground" />}
                        </button>
                    )
                })}
                <div className="col-span-2 flex min-w-0 flex-1 snap-start items-center justify-between gap-1 bg-card px-4 py-2.5 sm:min-w-[9.5rem] sm:flex-col sm:items-start sm:justify-start sm:py-3">
                    <span className="text-xs font-medium text-muted-foreground">{t("products.stockValue")}</span>
                    <span className="text-base font-semibold tracking-tight tabular-nums text-foreground sm:text-xl">
                        {formatMoney(stats.totalValue ?? 0)}
                    </span>
                </div>
            </div>
        </div>
    )
}
