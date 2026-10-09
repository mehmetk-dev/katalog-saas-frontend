"use client"

import { PlanFeatureList } from "@/components/billing/plan-feature-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlanType } from "@/lib/constants"
import type { User as AppUser } from "@/lib/contexts/user-context"

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
  const plan = (user?.plan || "free") as PlanType

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          {t("settings.currentPlanTitle")}
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-sm font-medium text-foreground">
            {t(`planCatalog.names.${plan}`)}
          </span>
        </CardTitle>
        <CardDescription>{t(PLAN_DESC_KEYS[plan])}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 pt-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">{t("settings.planFeatures")}</h3>
          {/* Fiyatlandırma sayfası ve plan penceresiyle aynı liste */}
          <PlanFeatureList plan={plan} />
        </div>

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
      </CardContent>
    </Card>
  )
}
