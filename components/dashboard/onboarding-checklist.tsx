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
    /** Paylaşım adımı ancak yayında bir katalog varsa tamamlanmış sayılır */
    hasPublishedCatalog: boolean
}

const ONBOARDING_DISMISSED_KEY = 'fogcatalog-onboarding-dismissed'

export function OnboardingChecklist({ hasProducts, hasCatalogs, hasPublishedCatalog }: OnboardingChecklistProps) {
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
    // localStorage okunana kadar gizli: kapatılmış kart her açılışta bir an görünüp kayboluyordu
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        try {
            setIsVisible(localStorage.getItem(ONBOARDING_DISMISSED_KEY) !== 'true')
        } catch {
            setIsVisible(true)
        }
    }, [])

    const handleDismiss = useCallback(() => {
        setIsVisible(false)
        try {
            localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true')
        } catch {
            // gizli sekme vb.: yalnızca bu oturumda kapanır
        }
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
            completed: hasPublishedCatalog,
        },
    ]

    const completedCount = steps.filter((s) => s.completed).length
    const progress = (completedCount / steps.length) * 100

    if (completedCount === steps.length) return null // Hepsi bittiyse gösterme

    return (
        <Card className="text-left">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="space-y-1.5">
                    <CardTitle className="text-base">{t("dashboard.onboarding.title")}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Progress value={progress} className="h-1.5 w-24" />
                        <span>{t("dashboard.onboarding.completed", { percent: Math.round(progress) })}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={handleDismiss} aria-label={t("common.close")}>
                    <X className="size-4" />
                </Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={cn(
                            "flex flex-col gap-3 rounded-lg border p-4",
                            step.completed ? "bg-muted/40" : "bg-card",
                        )}
                    >
                        <span
                            className={cn(
                                "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                                step.completed ? "bg-success-soft text-success" : "bg-muted text-foreground",
                            )}
                        >
                            {step.completed ? <CheckCircle2 className="size-4" /> : index + 1}
                        </span>
                        <div className="space-y-1">
                            <h3 className={cn("text-sm font-medium text-foreground", step.completed && "text-muted-foreground line-through")}>{step.title}</h3>
                            <p className="line-clamp-2 text-xs text-muted-foreground">{step.description}</p>
                        </div>
                        {!step.completed && (
                            <Button size="sm" variant="outline" className="mt-auto w-full" asChild>
                                <Link href={step.href} prefetch={false}>
                                    {step.cta}
                                    <ChevronRight className="size-3.5" />
                                </Link>
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

