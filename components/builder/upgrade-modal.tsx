"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Check, Sparkles, X, Crown, Zap, Star, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/user-context"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const plans = [
  {
    id: "free",
    name: "Ücretsiz",
    icon: Star,
    price: { monthly: 0, yearly: 0 },
    color: "from-slate-400 to-slate-500",
    features: ["1 Katalog", "50 Ürün", "1 PDF", "Filigran"],
  },
  {
    id: "plus",
    name: "Plus",
    icon: Zap,
    price: { monthly: 500, yearly: 5000 },
    color: "from-blue-500 to-cyan-500",
    features: ["10 Katalog", "1.000 Ürün", "50 PDF", "Filigransız"],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    price: { monthly: 1000, yearly: 10000 },
    popular: true,
    color: "from-violet-600 to-indigo-600",
    features: ["Sınırsız", "Sınırsız", "Sınırsız", "Tüm Özellikler"],
  },
]

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [isYearly, setIsYearly] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()

  const currentPlan = user?.plan || "free"

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true)
    setSelectedPlan(planId)

    try {
      if (planId === "pro" || planId === "plus") {
        const { upgradeUserToPro } = await import("@/lib/actions/user")
        await upgradeUserToPro()
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
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Plan Seçimi</DialogTitle>
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 sm:p-5 text-white text-center">
          <h2 className="text-xl font-bold mb-1">Planınızı Seçin</h2>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className={cn("text-xs", !isYearly ? "font-bold" : "opacity-70")}>Aylık</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-white/30 h-5 w-9"
            />
            <span className={cn("text-xs flex items-center gap-1", isYearly ? "font-bold" : "opacity-70")}>
              Yıllık
              <Badge className="bg-green-500 text-white border-0 text-[9px] px-1.5 py-0">2 AY BEDAVA</Badge>
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="p-4 grid grid-cols-3 gap-3">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrent = currentPlan === plan.id
            const monthlyPrice = isYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-xl border-2 p-3 transition-all text-center",
                  plan.popular
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-lg"
                    : "border-border hover:border-primary/50",
                  isCurrent && "ring-2 ring-green-500"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-600 text-[9px] px-2">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    POPÜLER
                  </Badge>
                )}

                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center bg-gradient-to-br text-white",
                  plan.color
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                <h3 className="font-bold text-sm">{plan.name}</h3>

                {/* Price */}
                <div className="my-2">
                  {monthlyPrice === 0 ? (
                    <span className="text-lg font-bold">Ücretsiz</span>
                  ) : (
                    <div>
                      <span className="text-xl font-bold">₺{monthlyPrice}</span>
                      <span className="text-xs text-muted-foreground">/ay</span>
                    </div>
                  )}
                </div>

                {/* Features - Compact */}
                <ul className="text-[10px] text-muted-foreground space-y-0.5 mb-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center justify-center gap-1">
                      <Check className="w-2.5 h-2.5 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <Button size="sm" variant="outline" className="w-full h-7 text-xs" disabled>
                    Mevcut
                  </Button>
                ) : plan.id === "free" ? (
                  <Button size="sm" variant="outline" className="w-full h-7 text-xs" disabled>
                    Temel
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className={cn(
                      "w-full h-7 text-xs",
                      plan.popular && "bg-violet-600 hover:bg-violet-700"
                    )}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-3 h-3 mr-1" />
                        Seç
                      </>
                    )}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 text-center text-[10px] text-muted-foreground">
          ✓ Güvenli ödeme • ✓ İstediğiniz zaman iptal • ✓ 7 gün para iade
        </div>
      </DialogContent>
    </Dialog>
  )
}
