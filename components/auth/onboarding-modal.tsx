"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sofa, Shirt, Package, Utensils, Laptop, MoreHorizontal } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const industryKeys = [
  { id: "furniture", labelKey: "auth.industryFurniture", icon: Sofa },
  { id: "fashion", labelKey: "auth.industryFashion", icon: Shirt },
  { id: "wholesale", labelKey: "auth.industryWholesale", icon: Package },
  { id: "food", labelKey: "auth.industryFood", icon: Utensils },
  { id: "electronics", labelKey: "auth.industryElectronics", icon: Laptop },
  { id: "other", labelKey: "auth.industryOther", icon: MoreHorizontal },
] as const

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string | null>(null)

  const handleContinue = () => {
    if (!selected) return
    // TODO: Send selected industry to API when endpoint is available
    // e.g. await apiFetch("/users/preferences", { method: "POST", body: JSON.stringify({ industry: selected }) })
    onOpenChange(false)
    router.push("/dashboard")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('auth.onboardingTitle')}</DialogTitle>
          <DialogDescription>{t('auth.onboardingDesc')}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4">
          {industryKeys.map((industry) => {
            const Icon = industry.icon
            return (
              <button
                key={industry.id}
                onClick={() => setSelected(industry.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  "hover:border-primary/50 hover:bg-accent",
                  selected === industry.id ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <Icon className={cn("w-6 h-6", selected === industry.id ? "text-primary" : "text-muted-foreground")} />
                <span
                  className={cn("text-sm font-medium", selected === industry.id ? "text-primary" : "text-foreground")}
                >
                  {t(industry.labelKey)}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false)
              router.push("/dashboard")
            }}
          >
            {t('auth.onboardingSkip')}
          </Button>
          <Button onClick={handleContinue} disabled={!selected}>
            {t('auth.onboardingContinue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
