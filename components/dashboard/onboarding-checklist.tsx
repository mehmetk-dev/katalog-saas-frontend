"use client"

import { useState, useCallback, useEffect } from "react"
import { CheckCircle2, ChevronRight, X } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import { useTranslation } from "@/lib/contexts/i18n-provider"

interface OnboardingChecklistProps {
    hasProducts: boolean
    hasCatalogs: boolean
}

const ONBOARDING_DISMISSED_KEY = 'fogcatalog-onboarding-dismissed'

export function OnboardingChecklist({ hasProducts, hasCatalogs }: OnboardingChecklistProps) {
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
    const [isVisible, setIsVisible] = useState(true)

    // Restore dismiss state from localStorage after mount
    useEffect(() => {
        if (localStorage.getItem(ONBOARDING_DISMISSED_KEY) === 'true') {
            setIsVisible(false)
        }
    }, [])

    const handleDismiss = useCallback(() => {
        setIsVisible(false)
        localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true')
    }, [])

    if (!isVisible) return null

    // Adımlar
    const steps = [
        {
            id: "product",
            title: t("dashboard.onboarding.steps.product.title"),
            description: t("dashboard.onboarding.steps.product.description"),
            cta: t("dashboard.onboarding.steps.product.cta"),
            href: "/dashboard/products",
            completed: hasProducts,
        },
        {
            id: "catalog",
            title: t("dashboard.onboarding.steps.catalog.title"),
            description: t("dashboard.onboarding.steps.catalog.description"),
            cta: t("dashboard.onboarding.steps.catalog.cta"),
            href: "/dashboard/builder",
            completed: hasCatalogs,
        },
        {
            id: "share",
            title: t("dashboard.onboarding.steps.share.title"),
            description: t("dashboard.onboarding.steps.share.description"),
            cta: t("dashboard.onboarding.steps.share.cta"),
            href: "/dashboard/catalogs",
            completed: hasCatalogs, // Katalog varsa paylaşılabilir varsayalım
        },
    ]

    const completedCount = steps.filter((s) => s.completed).length
    const progress = (completedCount / steps.length) * 100

    if (completedCount === steps.length) return null // Hepsi bittiyse gösterme

    return (
        <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-violet-100 dark:border-violet-800/50 shadow-sm relative overflow-hidden text-left">
            {/* Dekoratif arka plan */}
            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
                <svg width="200" height="200" viewBox="0 0 100 100" fill="currentColor" className="text-violet-600 dark:text-violet-400">
                    <circle cx="50" cy="50" r="40" />
                </svg>
            </div>

            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-lg text-violet-900 dark:text-violet-200">{t("dashboard.onboarding.title")}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Progress value={progress} className="w-24 h-2 bg-violet-200 dark:bg-violet-900/50" />
                        <span>{t("dashboard.onboarding.completed", { percent: Math.round(progress) })}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={handleDismiss}>
                    <X className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={cn(
                            "flex flex-col gap-3 p-4 rounded-lg border transition-all duration-200",
                            step.completed
                                ? "bg-white/50 dark:bg-card/50 border-transparent opacity-60"
                                : "bg-white dark:bg-card border-violet-100 dark:border-violet-800/50 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className={cn(
                                "p-2 rounded-full",
                                step.completed
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                    : "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                            )}>
                                {step.completed ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 flex items-center justify-center font-bold text-foreground">{index + 1}</div>}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className={cn("font-medium text-foreground", step.completed && "line-through text-muted-foreground transition-all")}>{step.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{step.description}</p>
                        </div>
                        {!step.completed && (
                            <Button size="sm" variant="outline" className="mt-auto w-full group border-violet-200 dark:border-violet-800/50 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300" asChild>
                                <Link href={step.href} prefetch={false}>
                                    {step.cta}
                                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

