"use client"

import { Package, TrendingUp, AlertTriangle } from "lucide-react"
import { useTranslation } from "@/lib/i18n-provider"
import { cn } from "@/lib/utils"

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

    const cards = [
        {
            label: t("sidebar.products"),
            value: stats.total,
            icon: Package,
            color: "violet",
            theme: "border-l-violet-500",
            bg: "bg-gradient-to-br from-violet-50/50 to-white dark:from-violet-900/10 dark:to-gray-900",
            iconColor: "text-violet-600 dark:text-violet-400",
            iconBg: "bg-violet-100 dark:bg-violet-900/40",
            progress: 100
        },
        {
            label: t("products.inStock"),
            value: stats.inStock,
            icon: TrendingUp,
            color: "emerald",
            theme: "border-l-emerald-500",
            bg: "bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-gray-900",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
            progress: stats.total > 0 ? (stats.inStock / stats.total) * 100 : 0
        },
        {
            label: t("products.critical"),
            value: stats.lowStock + stats.outOfStock,
            icon: AlertTriangle,
            color: "amber",
            theme: "border-l-amber-500",
            bg: "bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-900/10 dark:to-gray-900",
            iconColor: "text-amber-600 dark:text-amber-400",
            iconBg: "bg-amber-100 dark:bg-amber-900/40",
            progress: stats.total > 0 ? ((stats.lowStock + stats.outOfStock) / stats.total) * 100 : 0
        }
    ]

    return (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    className={cn(
                        "relative overflow-hidden rounded-xl p-4 sm:p-5 transition-all duration-300",
                        "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800",
                        "border-l-4 shadow-sm hover:shadow-md hover:-translate-y-0.5",
                        card.theme,
                        card.bg
                    )}
                >
                    {/* Watermark Icon - Top Right */}
                    <div className="absolute -right-2 -top-2 opacity-5 dark:opacity-10 group-hover:opacity-10 transition-opacity">
                        <card.icon className={cn("w-16 h-16 sm:w-24 sm:h-24 rotate-12", card.iconColor)} />
                    </div>

                    <div className="flex flex-col h-full relative z-10">
                        {/* Icon Container */}
                        <div className={cn(
                            "flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg mb-3 shrink-0",
                            card.iconBg
                        )}>
                            <card.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", card.iconColor)} />
                        </div>

                        {/* Typography Hierarchy */}
                        <div className="flex flex-col mt-auto">
                            <span className={cn(
                                "text-2xl sm:text-4xl font-extrabold tracking-tight",
                                card.iconColor
                            )}>
                                {card.value.toLocaleString()}
                            </span>
                            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mt-1">
                                {card.label as string}
                            </span>
                        </div>
                    </div>

                    {/* Visual Cue - Progress Bar */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800">
                        <div
                            className={cn(
                                "h-full transition-all duration-1000",
                                card.color === "violet" ? "bg-violet-500" :
                                    card.color === "emerald" ? "bg-emerald-500" : "bg-amber-500"
                            )}
                            style={{ width: `${Math.min(100, card.progress)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}
