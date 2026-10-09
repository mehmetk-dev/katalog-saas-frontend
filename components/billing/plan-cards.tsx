"use client"

import Link from "next/link"

import { PlanFeatureList } from "@/components/billing/plan-feature-list"
import { Button } from "@/components/ui/button"
import { buildCheckoutHref, CHECKOUT_PLANS } from "@/lib/billing/plans"
import { PLAN_ORDER, RECOMMENDED_PLAN } from "@/lib/billing/plan-features"
import type { PlanType } from "@/lib/constants"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

const PLAN_CTA_KEYS: Record<PlanType, string> = { free: "pricingPage.ctaFree", plus: "pricingPage.ctaPlus", pro: "pricingPage.ctaPro" }

export function BillingCycleToggle({ isYearly, onChange }: { isYearly: boolean; onChange: (yearly: boolean) => void }) {
    const { t } = useTranslation()

    return (
        <div className="inline-flex rounded-lg border border-border bg-muted p-1" role="group">
            {[false, true].map((yearly) => (
                <button
                    key={String(yearly)}
                    type="button"
                    onClick={() => onChange(yearly)}
                    aria-pressed={isYearly === yearly}
                    className={cn(
                        "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                        isYearly === yearly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    {t(yearly ? "pricingPage.yearly" : "pricingPage.monthly")}
                    {yearly ? (
                        <span className="rounded bg-success-soft px-1.5 py-0.5 text-xs font-medium text-success-soft-foreground">
                            {t("pricingPage.freeMonths")}
                        </span>
                    ) : null}
                </button>
            ))}
        </div>
    )
}

interface PlanCardsProps {
    isYearly: boolean
    /** Giriş yapmış kullanıcının planı: kartı "mevcut plan" olarak işaretler */
    currentPlan?: PlanType
}

/** Fiyatlandırma sayfası ve plan yükseltme penceresi aynı kartları gösterir */
export function PlanCards({ isYearly, currentPlan }: PlanCardsProps) {
    const { t, language } = useTranslation()
    const formatPrice = (value: number) =>
        new Intl.NumberFormat(language === "en" ? "en-US" : "tr-TR", { maximumFractionDigits: 0 }).format(value)

    return (
        <div className="grid items-stretch gap-4 md:grid-cols-3">
            {PLAN_ORDER.map((plan) => {
                const paid = plan === "free" ? null : CHECKOUT_PLANS[plan]
                const monthly = paid ? (isYearly ? paid.yearlyPrice / 12 : paid.monthlyPrice) : 0
                const recommended = plan === RECOMMENDED_PLAN
                const isCurrent = currentPlan === plan
                const href = paid ? buildCheckoutHref(paid.id, isYearly ? "yearly" : "monthly") : "/auth?tab=signup"
                // Giriş yapmış kullanıcı ücretsiz plana "geçemez"; düşürme abonelik iptaliyle olur
                const actionDisabled = isCurrent || (currentPlan !== undefined && plan === "free")

                return (
                    <div
                        key={plan}
                        className={cn(
                            "relative flex flex-col rounded-xl border bg-card p-6",
                            recommended ? "border-foreground shadow-sm" : "border-border",
                        )}
                    >
                        {recommended ? (
                            <span className="absolute -top-3 left-6 rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-brand-foreground">
                                {t("planCatalog.recommended")}
                            </span>
                        ) : null}

                        <h3 className="text-lg font-semibold text-card-foreground">{t(`planCatalog.names.${plan}`)}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t(`planCatalog.taglines.${plan}`)}</p>

                        <div className="mt-6 flex items-baseline gap-1">
                            <span className="text-4xl font-semibold tracking-tight text-card-foreground">
                                {paid ? `₺${formatPrice(monthly)}` : t("pricingPage.free")}
                            </span>
                            {paid ? <span className="text-sm text-muted-foreground">{t("pricingPage.month")}</span> : null}
                        </div>
                        <p className="mt-1 min-h-5 text-xs text-muted-foreground">
                            {paid && isYearly ? `₺${formatPrice(paid.yearlyPrice)}${t("pricingPage.perYear")} · ` : ""}
                            {paid ? t("checkout.vatIncluded") : ""}
                        </p>

                        {actionDisabled ? (
                            <Button variant="outline" size="lg" className="mt-6 h-11 w-full" disabled>
                                {isCurrent ? t("upgradeModal.currentPlan") : t(`planCatalog.names.${plan}`)}
                            </Button>
                        ) : (
                            <Button asChild variant={recommended ? "brand" : "outline"} size="lg" className="mt-6 h-11 w-full">
                                <Link href={href}>{t(PLAN_CTA_KEYS[plan])}</Link>
                            </Button>
                        )}

                        <PlanFeatureList plan={plan} className="mt-6 border-t border-border pt-6" />
                    </div>
                )
            })}
        </div>
    )
}
