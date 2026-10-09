"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { PlanFeatureList } from "@/components/billing/plan-feature-list"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cancelSubscription } from "@/lib/actions/notifications"
import type { PlanType } from "@/lib/constants"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useUser, type User as AppUser } from "@/lib/contexts/user-context"

type TFunction = (key: string, params?: Record<string, unknown>) => string

interface SubscriptionTabProps {
  onUpgradeClick: () => void
  t: TFunction
  user: AppUser | null
}

const PLAN_DESC_KEYS: Record<PlanType, string> = {
  free: "settings.planDescFree",
  plus: "settings.planDescPlus",
  pro: "settings.planDescPro",
}

export function SubscriptionTab({ onUpgradeClick, t, user }: SubscriptionTabProps) {
  const { language } = useTranslation()
  const { refreshUser } = useUser()
  const [isCancelling, setIsCancelling] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const plan = (user?.plan || "free") as PlanType
  const isPaid = plan !== "free"
  const isCancelled = user?.subscriptionStatus === "cancelled"
  const endDate = user?.subscriptionEnd
    ? new Date(user.subscriptionEnd).toLocaleDateString(language === "en" ? "en-US" : "tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const result = await cancelSubscription()
      if ("error" in result && result.error) {
        toast.error(t("settings.cancelError"))
        return
      }
      toast.success(t("settings.cancelSuccess"))
      setDialogOpen(false)
      await refreshUser()
    } catch {
      toast.error(t("settings.cancelError"))
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
          {t("settings.currentPlanTitle")}
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-sm font-medium text-foreground">
            {t(`planCatalog.names.${plan}`)}
          </span>
        </CardTitle>
        <CardDescription>{t(PLAN_DESC_KEYS[plan])}</CardDescription>
        {isPaid ? (
          <p className="pt-1 text-sm text-muted-foreground">
            {isCancelled && endDate
              ? t("settings.cancelledUntil", { date: endDate })
              : endDate
                ? `${t("settings.validUntil", { date: endDate })} · ${t("settings.noAutoRenew")}`
                : t("settings.noAutoRenew")}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-8 pt-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">{t("settings.planFeatures")}</h3>
          {/* Fiyatlandırma sayfası ve plan penceresiyle aynı liste */}
          <PlanFeatureList plan={plan} />
        </div>

        <div className="flex flex-col gap-4">
          {plan !== "pro" ? (
            <div className="flex flex-col items-start justify-center gap-3 rounded-xl border border-border bg-muted/40 p-6">
              <h3 className="text-lg font-semibold text-foreground">
                {plan === "plus" ? t("plans.upgradeToPro") : t("plans.upgrade")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {plan === "plus" ? t("plans.upgradeDescPro") : t("plans.upgradeDescPlus")}
              </p>
              <Button variant="brand" onClick={onUpgradeClick}>
                {plan === "plus" ? t("plans.upgradeToProBtn") : t("plans.viewPlans")}
              </Button>
            </div>
          ) : null}

          {isPaid && !isCancelled ? (
            <AlertDialog open={dialogOpen} onOpenChange={(open) => !isCancelling && setDialogOpen(open)}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-fit text-destructive hover:text-destructive">
                  {t("settings.cancelSubscription")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("settings.cancelTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {endDate ? t("settings.cancelDesc", { date: endDate }) : t("settings.cancelDescNoDate")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isCancelling}>{t("settings.cancelKeep")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      // Dialog'un kendiliğinden kapanmasını engelle; sonuç gelince kapanır
                      event.preventDefault()
                      void handleCancel()
                    }}
                    disabled={isCancelling}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isCancelling ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                    {t("settings.cancelConfirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
