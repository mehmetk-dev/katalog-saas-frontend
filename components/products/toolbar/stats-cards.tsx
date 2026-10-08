"use client"

import { Package, TrendingUp, AlertTriangle } from "lucide-react"
import { useTranslation } from "@/lib/contexts/i18n-provider"
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
            theme: "border-l-primary",
            bg: "bg-gradient-to-br from-muted/50 to-background",
            iconColor: "text-primary",
            iconBg: "bg-accent",
            progress: 100
        },
        {
            label: t("products.inStock"),
            value: stats.inStock,
            icon: TrendingUp,
            color: "emerald",
            theme: "border-l-success",
            bg: "bg-gradient-to-br from-success-soft/50 to-background",
            iconColor: "text-success",
            iconBg: "bg-success-soft",
            progress: stats.total > 0 ? (stats.inStock / stats.total) * 100 : 0
        },
        {
            label: t("products.critical"),
            value: stats.lowStock + stats.outOfStock,
            icon: AlertTriangle,
            color: "amber",
            theme: "border-l-warning",
            bg: "bg-gradient-to-br from-warning-soft/50 to-background",
            iconColor: "text-warning-soft-foreground",
            iconBg: "bg-warning-soft",
            progress: stats.total > 0 ? ((stats.lowStock + stats.outOfStock) / stats.total) * 100 : 0
        }
    ]

    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    className={cn(
                        "relative overflow-hidden rounded-xl p-2.5 sm:p-4 md:p-5 transition-all duration-300",
                        "bg-card border border-border",
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
                            "flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-lg mb-2 sm:mb-3 shrink-0",
                            card.iconBg
                        )}>
                            <card.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5", card.iconColor)} />
                        </div>

                        {/* Typography Hierarchy */}
                        <div className="flex flex-col mt-auto">
                            <span className={cn(
                                "text-xl sm:text-2xl md:text-4xl font-bold tracking-tight",
                                card.iconColor
                            )}>
                                {card.value.toLocaleString()}
                            </span>
                            <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mt-0.5 sm:mt-1">
                                {card.label as string}
                            </span>
                        </div>
                    </div>

                    {/* Visual Cue - Progress Bar */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-muted">
                        <div
                            className={cn(
                                "h-full transition-all duration-1000",
                                card.color === "violet" ? "bg-primary" :
                                    card.color === "emerald" ? "bg-success" : "bg-warning"
                            )}
                            style={{ width: `${Math.min(100, card.progress)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}
