"use client"

import { Check, Info } from "lucide-react"

import { getPlanFeatures } from "@/lib/billing/plan-features"
import type { PlanType } from "@/lib/constants"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

/** Fiyatlandırma sayfası ve plan yükseltme penceresinde aynı özellik listesi */
export function PlanFeatureList({ plan, className }: { plan: PlanType; className?: string }) {
    const { t } = useTranslation()

    return (
        <ul className={cn("space-y-3", className)}>
            {getPlanFeatures(plan).map((feature) => (
                <li key={feature.key} className="flex items-start gap-3 text-sm">
                    {feature.tone === "limited" ? (
                        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    ) : (
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                    )}
                    <span className={feature.tone === "limited" ? "text-muted-foreground" : "text-foreground"}>
                        {t(`planCatalog.features.${feature.key}`, feature.params)}
                    </span>
                </li>
            ))}
        </ul>
    )
}
