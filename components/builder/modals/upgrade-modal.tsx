"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import { Check, MousePointer2, Link2, ShieldCheck, CalendarPlus, BadgeCheck } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/contexts/user-context"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { buildCheckoutHref, CHECKOUT_PLANS } from "@/lib/billing/plans"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: string
}

// PERF(F7): Module-scope constants — never recreated on render
const PlanIcons = {
  free: (
    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 16.5L12 3L19.5 16.5" className="stroke-success" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3V12M12 21V19M8 21H16" className="stroke-success" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13L12 11L15 13" className="stroke-success" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="url(#plus-grad)" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      <defs>
        <linearGradient id="plus-grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  ),
  pro: (
    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19L3 6L9 11L12 3L15 11L21 6L18 19H6Z" fill="url(#pro-grad)" className="drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
      <path d="M6 21C6 21.55 6.45 22 7 22H17C17.55 22 18 21.55 18 21V19H6V21Z" fill="url(#pro-grad)" />
      <defs>
        <linearGradient id="pro-grad" x1="3" y1="3" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9333EA" />
          <stop offset="1" stopColor="#E879F9" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [isYearly, setIsYearly] = useState(true)
  const { user } = useUser()
  const { t } = useTranslation()

  const currentPlan = user?.plan || "free"

  const plans = useMemo(() => [
    {
      id: "free",
      name: t("upgradeModal.plans.free.name"),
      description: t("upgradeModal.plans.free.desc"),
      icon: PlanIcons.free,
      price: { monthly: 0, yearly: 0 },
      color: "from-success/10 to-transparent",
      accentColor: "emerald",
      bgColor: "bg-card dark:bg-card/40",
      borderColor: "border-success/20",
      features: [
        { text: t("upgradeModal.planFeatures.freeCatalog"), included: true },
        { text: t("upgradeModal.planFeatures.freeTemplates"), included: true },
        { text: t("upgradeModal.planFeatures.freeProducts"), included: true },
        { text: t("upgradeModal.planFeatures.clickAndGo"), included: true },
        { text: t("upgradeModal.planFeatures.highQualityPdf"), included: true },
        { text: t("upgradeModal.planFeatures.watermarkWarning"), included: "warning" },
      ],
    },
    {
      id: "plus",
      name: t("upgradeModal.plans.plus.name"),
      description: t("upgradeModal.plans.plus.desc"),
      icon: PlanIcons.plus,
      price: {
        monthly: CHECKOUT_PLANS.plus.monthlyPrice,
        yearly: CHECKOUT_PLANS.plus.yearlyPrice,
      },
      popular: true,
      color: "from-info/10 to-transparent",
      accentColor: "blue",
      bgColor: "bg-gradient-to-br from-info-soft/50 to-background dark:to-card/40",
      borderColor: "border-info/20",
      features: [
        { text: t("upgradeModal.planFeatures.plusCatalogs"), included: true },
        { text: t("upgradeModal.planFeatures.allPremiumTemplates"), included: true },
        { text: t("upgradeModal.planFeatures.plusProducts"), included: true },
        { text: t("upgradeModal.planFeatures.clickAndGo"), included: "highlight", icon: <MousePointer2 className="w-3 h-3" /> },
        { text: t("upgradeModal.planFeatures.noWatermarkBrand"), included: true },
        { text: t("upgradeModal.planFeatures.highQualityPdf"), included: true },
      ],
    },
    {
      id: "pro",
      name: t("upgradeModal.plans.pro.name"),
      description: t("upgradeModal.plans.pro.desc"),
      icon: PlanIcons.pro,
      price: {
        monthly: CHECKOUT_PLANS.pro.monthlyPrice,
        yearly: CHECKOUT_PLANS.pro.yearlyPrice,
      },
      color: "from-primary/10 to-transparent",
      accentColor: "purple",
      bgColor: "bg-gradient-to-br from-muted/50 to-background dark:to-card/40",
      borderColor: "border-border",
      features: [
        { text: t("upgradeModal.planFeatures.unlimitedCatalogs"), included: true },
        { text: t("upgradeModal.planFeatures.allPremiumTemplates"), included: true },
        { text: t("upgradeModal.planFeatures.unlimitedProducts"), included: true },
        { text: t("upgradeModal.planFeatures.clickAndGo"), included: "highlight", icon: <Link2 className="w-3 h-3" /> },
        { text: t("upgradeModal.planFeatures.noWatermarkBrand"), included: true },
        { text: t("upgradeModal.planFeatures.vipSupport"), included: true },
      ],
    },
  ], [t]) // deps: t for language changes

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] p-0 overflow-hidden border-0 shadow-2xl max-h-[90vh] flex flex-col bg-background">
        <DialogTitle className="sr-only">{t("upgradeModal.title")}</DialogTitle>

        {/* Compact Minimalist Header */}
        <div className="relative border-b border-border bg-gradient-to-b from-background to-muted/20 pb-1">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-full bg-primary/5 blur-[80px] pointer-events-none" />

          <div className="relative px-6 pt-5 pb-3">
            <div className="flex flex-col items-center gap-4">
              <div className="text-center space-y-0.5">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{t("upgradeModal.title")}</h2>
                <p className="text-xs text-muted-foreground">{t("upgradeModal.subtitle")}</p>
              </div>

              {/* Tight Pill Toggle */}
              <div className="relative flex items-center p-1 bg-muted/50 rounded-full border border-border shadow-inner w-full max-w-[300px]">
                <div
                  className={cn(
                    "absolute h-[calc(100%-8px)] rounded-full bg-background shadow-sm border border-border/10 transition-all duration-300 ease-in-out",
                    isYearly ? "left-[calc(50%+4px)] w-[calc(50%-8px)]" : "left-1 w-[calc(50%-8px)]"
                  )}
                />
                <button onClick={() => setIsYearly(false)} className={cn("relative flex-1 py-1.5 text-[11px] font-bold z-10 transition-colors", !isYearly ? "text-foreground" : "text-muted-foreground")}>
                  {t("upgradeModal.monthly")}
                </button>
                <button onClick={() => setIsYearly(true)} className={cn("relative flex-1 py-1.5 text-[11px] font-bold z-10 flex items-center justify-center gap-1.5 transition-colors", isYearly ? "text-foreground" : "text-muted-foreground")}>
                  {t("upgradeModal.yearly")}
                  <span className="text-[8px] sm:text-[9px] text-success font-bold px-1.5 py-0.5 bg-success-soft rounded-full whitespace-nowrap">{t("upgradeModal.yearlyBonus")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Plans Grid */}
        <div className="pt-4 pb-6 px-4 md:p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar bg-muted/30 dark:bg-background/20">
          <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-x-visible pt-5 pb-4 md:pb-0 md:pt-0 snap-x snap-mandatory scrollbar-none">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id
              const monthlyPrice = isYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border p-5 transition-all duration-300 shrink-0 w-[280px] md:w-full snap-center flex flex-col",
                    plan.bgColor,
                    plan.borderColor,
                    plan.popular && "ring-1 ring-info/30 shadow-lg bg-card dark:bg-card z-10",
                    isCurrent && "opacity-90"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-info py-0.5 px-3 rounded-full shadow-sm">
                      <span className="text-[9px] font-bold text-white uppercase tracking-tighter">{t("upgradeModal.mostPopular")}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-card shadow-sm border border-border/50 shrink-0">
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-none">{plan.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-4 text-left border-b border-border/10 pb-4 min-h-[52px] flex items-end">
                    {monthlyPrice === 0 ? (
                      <span className="text-xl font-bold text-foreground">{t("upgradeModal.free")}</span>
                    ) : (
                      <div className="flex flex-col animate-in fade-in zoom-in-95 duration-300" key={isYearly ? "yearly" : "monthly"}>
                        {isYearly && (
                          <span className="text-[10px] text-muted-foreground/60 line-through font-medium leading-none mb-0.5">
                            ₺{plan.price.monthly}
                          </span>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-foreground leading-none">₺{monthlyPrice}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{t("upgradeModal.perMonth")}</span>
                        </div>
                        <span className="mt-1 text-[9px] font-bold text-success">
                          {t("upgradeModal.vatIncluded")}
                        </span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1 text-left">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px]">
                        {feature.included === true || feature.included === "highlight" ? (
                          <Check className={cn("w-3 h-3 shrink-0", plan.id === "free" ? "text-success" : plan.id === "plus" ? "text-info" : "text-primary")} />
                        ) : feature.included === "warning" ? (
                          <span className="text-warning-soft-foreground font-bold shrink-0 text-xs px-1">!</span>
                        ) : (
                          <div className="w-1 h-1 rounded-full bg-border shrink-0 mx-1" />
                        )}
                        <span className={cn(
                          "line-clamp-1 truncate",
                          feature.included === "highlight"
                            ? `font-bold ${plan.id === "plus" ? "text-info" : "text-primary"} flex items-center gap-1`
                            : feature.included === "warning" ? "text-warning-soft-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {feature.text}
                          {'icon' in feature && feature.icon}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent || plan.id === "free" ? (
                    <Button
                      className={cn(
                        "w-full h-9 rounded-xl font-bold transition-all text-[11px]",
                        isCurrent
                          ? "bg-muted text-muted-foreground cursor-default"
                          : "bg-success-soft text-success border border-success/20"
                      )}
                      disabled
                    >
                      {isCurrent ? t("upgradeModal.current") : t("upgradeModal.select")}
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className={cn(
                        "w-full h-9 rounded-xl font-bold transition-all text-[11px]",
                        plan.id === "pro"
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                          : "bg-info hover:bg-info/90 text-info-foreground shadow-sm"
                      )}
                    >
                      <Link href={buildCheckoutHref(plan.id === "plus" ? "plus" : "pro", isYearly ? "yearly" : "monthly")}>
                        {t("upgradeModal.select")}
                      </Link>
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mini Trust Badges Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/10">
          <div className="flex items-center justify-around text-[10px] font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>{t("upgradeModal.securePayment")}</span>
            </div>
            <div className="flex items-center gap-1.5 border-x border-border/50 px-8">
              <CalendarPlus className="w-3.5 h-3.5 text-info" />
              <span>{t("upgradeModal.cancelAnytime")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5 text-primary" />
              <span>{t("upgradeModal.support247Badge")}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
