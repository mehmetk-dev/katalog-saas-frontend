"use client"

import { useState, useMemo } from "react"
import { Check, Sparkles, Crown, Zap, Star, CreditCard, Shield, Rocket, Gift } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/user-context"
import { useTranslation } from "@/lib/i18n-provider"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [isYearly, setIsYearly] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()
  const { t } = useTranslation()

  const currentPlan = user?.plan || "free"

  const plans = useMemo(() => [
    {
      id: "free",
      name: t("upgradeModal.plans.free.name"),
      description: t("upgradeModal.plans.free.desc"),
      icon: Star,
      emoji: "📦",
      price: { monthly: 0, yearly: 0 },
      color: "from-slate-400 to-slate-500",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      features: [
        { text: t("upgradeModal.features.catalogLimit", { count: 1 }), included: true },
        { text: t("upgradeModal.features.productLimit", { count: 50 }), included: true },
        { text: t("upgradeModal.features.pdfLimit", { count: 1 }), included: true },
        { text: t("upgradeModal.features.standardPdf"), included: true },
        { text: t("upgradeModal.features.watermark"), included: false },
        { text: t("upgradeModal.features.premiumTemplates"), included: false },
        { text: t("upgradeModal.features.prioritySupport"), included: false },
      ],
    },
    {
      id: "plus",
      name: t("upgradeModal.plans.plus.name"),
      description: t("upgradeModal.plans.plus.desc"),
      icon: Zap,
      emoji: "⚡",
      price: { monthly: 500, yearly: 5000 },
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      borderColor: "border-blue-300",
      features: [
        { text: t("upgradeModal.features.catalogLimit", { count: 10 }), included: true },
        { text: t("upgradeModal.features.productLimit", { count: 1000 }), included: true },
        { text: t("upgradeModal.features.pdfLimit", { count: 50 }), included: true },
        { text: t("upgradeModal.features.standardPdf"), included: true },
        { text: t("upgradeModal.features.noWatermark"), included: true },
        { text: t("upgradeModal.features.premiumTemplates"), included: true },
        { text: t("upgradeModal.features.prioritySupport"), included: false },
      ],
    },
    {
      id: "pro",
      name: t("upgradeModal.plans.pro.name"),
      description: t("upgradeModal.plans.pro.desc"),
      icon: Crown,
      emoji: "👑",
      price: { monthly: 1000, yearly: 10000 },
      popular: true,
      color: "from-violet-600 to-purple-600",
      bgColor: "bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50",
      borderColor: "border-violet-400",
      features: [
        { text: t("upgradeModal.features.unlimitedCatalogs"), included: true },
        { text: t("upgradeModal.features.unlimitedProducts"), included: true },
        { text: t("upgradeModal.features.unlimitedPdf"), included: true },
        { text: t("upgradeModal.features.highResPdf"), included: true },
        { text: t("upgradeModal.features.noWatermark"), included: true },
        { text: t("upgradeModal.features.allTemplates"), included: true },
        { text: t("upgradeModal.features.support247"), included: true },
      ],
    },
  ], [t])

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true)
    setSelectedPlan(planId)

    try {
      if (planId === "pro") {
        const { upgradeUserToPro } = await import("@/lib/actions/user")
        await upgradeUserToPro()
        window.location.reload()
      } else if (planId === "plus") {
        const { upgradeUserToPlus } = await import("@/lib/actions/user")
        await upgradeUserToPlus()
        window.location.reload()
      }
    } catch (error) {
      console.error("Upgrade error:", error)
    } finally {
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-0 shadow-2xl">
        <DialogTitle className="sr-only">{t("upgradeModal.title")}</DialogTitle>

        {/* Clean Modern Header with Plan Info */}
        <div className="relative bg-white border-b overflow-hidden">
          {/* Mesh gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-white to-cyan-100 opacity-60" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-400/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-400/30 to-transparent rounded-full blur-3xl" />

          <div className="relative p-5">
            <div className="flex items-center justify-between gap-4">
              {/* Left - Current Plan Info */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                  currentPlan === "pro" ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30" :
                    currentPlan === "plus" ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-500/30" :
                      "bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-500/30"
                )}>
                  {currentPlan === "pro" ? <Crown className="w-5 h-5 text-white" /> :
                    currentPlan === "plus" ? <Zap className="w-5 h-5 text-white" /> :
                      <Star className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-gray-900">
                      {currentPlan === "pro" ? t("upgradeModal.plans.pro.name") : currentPlan === "plus" ? t("upgradeModal.plans.plus.name") : t("upgradeModal.plans.free.name")}
                    </h2>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-medium",
                      currentPlan === "pro" ? "bg-violet-100 text-violet-700" :
                        currentPlan === "plus" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                    )}>
                      {t("upgradeModal.current")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-gray-500">
                      📦 {t("upgradeModal.catalogsCount", { count: user?.catalogsCount || 0, limit: currentPlan === "pro" ? "∞" : currentPlan === "plus" ? "10" : "1" })}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      📋 {t("upgradeModal.productsCount", { count: user?.productsCount || 0, limit: currentPlan === "pro" ? "∞" : currentPlan === "plus" ? "1000" : "50" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right - Toggle */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setIsYearly(false)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md transition-all font-medium",
                    !isYearly
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {t("upgradeModal.monthly")}
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5",
                    isYearly
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {t("upgradeModal.yearly")}
                  <span className="text-[9px] bg-gradient-to-r from-emerald-500 to-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    -17%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-3 sm:p-4 lg:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
            {plans.map((plan) => {
              const Icon = plan.icon
              const isCurrent = currentPlan === plan.id
              const monthlyPrice = isYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly
              const yearlyTotal = plan.price.yearly

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-xl border-2 p-4 transition-all hover:shadow-lg",
                    plan.bgColor,
                    plan.borderColor,
                    plan.popular && "shadow-lg shadow-violet-500/20 md:scale-105",
                    isCurrent && "ring-2 ring-green-500 ring-offset-1"
                  )}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 px-4 py-1 text-xs shadow-lg">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t("upgradeModal.mostPopular")}
                    </Badge>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrent && (
                    <Badge className="absolute -top-3 right-4 bg-green-500 text-white border-0 px-3 py-1 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      {t("upgradeModal.current")}
                    </Badge>
                  )}

                  {/* Icon & Name */}
                  <div className="text-center mb-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center bg-gradient-to-br text-white shadow-md",
                      plan.color
                    )}>
                      <span className="text-2xl">{plan.emoji}</span>
                    </div>
                    <h3 className="font-bold text-base">{plan.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Price - Fixed height */}
                  <div className="text-center mb-3 h-16 flex flex-col justify-center">
                    {monthlyPrice === 0 ? (
                      <div>
                        <span className="text-2xl font-bold text-gray-900">{t("upgradeModal.free")}</span>
                      </div>
                    ) : (
                      <div>
                        <div className="h-4">
                          {isYearly && (
                            <span className="text-xs text-muted-foreground line-through">
                              ₺{plan.price.monthly}/{t("upgradeModal.monthly").toLowerCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-end justify-center gap-0.5">
                          <span className="text-2xl font-bold text-gray-900">₺{monthlyPrice}</span>
                          <span className="text-xs text-muted-foreground mb-0.5">/{t("upgradeModal.monthly").toLowerCase()}</span>
                        </div>
                        <div className="h-4">
                          {isYearly && (
                            <span className="text-[10px] text-green-600 font-medium">
                              {t("upgradeModal.saveYearly", { amount: plan.price.monthly * 12 - plan.price.yearly })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5 mb-3">
                    {plan.features.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs">
                        {feature.included ? (
                          <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <span className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                            <span className="w-1.5 h-0.5 bg-gray-300 rounded" />
                          </span>
                        )}
                        <span className={cn(
                          feature.included ? "text-gray-700" : "text-gray-400"
                        )}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full h-9 text-xs font-medium"
                      disabled
                    >
                      {t("upgradeModal.current")}
                    </Button>
                  ) : plan.id === "free" ? (
                    <Button
                      variant="outline"
                      className="w-full h-9 text-xs font-medium"
                      disabled
                    >
                      {t("upgradeModal.basic")}
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full h-9 text-xs font-medium transition-all",
                        plan.popular
                          ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                          : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      )}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isLoading}
                    >
                      {isLoading && selectedPlan === plan.id ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="w-3 h-3 mr-1" />
                          {t("upgradeModal.select")}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer - Trust Badges */}
        <div className="px-4 pb-4 pt-1">
          <div className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-500" />
              <span>{t("upgradeModal.securePayment")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              <span>{t("upgradeModal.cancelAnytime")}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
