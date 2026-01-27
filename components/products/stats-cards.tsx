"use client"

import { Package, TrendingUp, AlertTriangle } from "lucide-react"
import { useTranslation } from "@/lib/i18n-provider"

interface ProductStatsCardsProps {
    stats: {
        total: number
        inStock: number
        lowStock: number
        outOfStock: number
    }
}

export function ProductStatsCards({ stats }: ProductStatsCardsProps) {
    const { t } = useTranslation()

    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Toplam Ürün */}
            <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-md">
                <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                    <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 items-center justify-center shrink-0">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-lg sm:text-2xl md:text-3xl font-bold text-violet-600 dark:text-violet-400">{stats.total}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("sidebar.products")}</p>
                    </div>
                </div>
            </div>

            {/* Aktif Stok */}
            <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-md">
                <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                    <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-lg sm:text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.inStock}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("products.inStock")}</p>
                    </div>
                </div>
            </div>

            {/* Kritik Stok */}
            <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-md">
                <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                    <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-lg sm:text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.lowStock + stats.outOfStock}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("products.critical")}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
