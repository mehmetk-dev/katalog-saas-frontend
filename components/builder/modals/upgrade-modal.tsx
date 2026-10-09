"use client"

import { useState } from "react"
import { CalendarCheck, ShieldCheck } from "lucide-react"

import { BillingCycleToggle, PlanCards } from "@/components/billing/plan-cards"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import type { PlanType } from "@/lib/constants"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useUser } from "@/lib/contexts/user-context"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: string
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [isYearly, setIsYearly] = useState(true)
  const { user } = useUser()
  const { t } = useTranslation()

  const currentPlan = (user?.plan || "free") as PlanType

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <div className="flex flex-col items-center gap-4 border-b border-border px-6 pb-5 pt-6 text-center">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-semibold tracking-tight">{t("upgradeModal.title")}</DialogTitle>
            <DialogDescription>{t("upgradeModal.subtitle")}</DialogDescription>
          </div>
          <BillingCycleToggle isYearly={isYearly} onChange={setIsYearly} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 px-4 pb-6 pt-8 sm:px-6">
          <PlanCards isYearly={isYearly} currentPlan={currentPlan} />
        </div>

        <div className="flex items-center justify-center gap-6 border-t border-border px-6 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden />
            {t("upgradeModal.securePayment")}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarCheck className="size-3.5" aria-hidden />
            {t("upgradeModal.cancelAnytime")}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
