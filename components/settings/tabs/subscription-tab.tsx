"use client"

import { CheckCircle2, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User as AppUser } from "@/lib/contexts/user-context"
import { cn } from "@/lib/utils"

type TFunction = (key: string, params?: Record<string, unknown>) => string

interface SubscriptionTabProps {
  onUpgradeClick: () => void
  t: TFunction
  user: AppUser | null
}

export function SubscriptionTab({ onUpgradeClick, t, user }: SubscriptionTabProps) {
  return (
    <Card className="border-0 shadow-md ring-1 ring-border bg-card overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
        <CreditCard className="w-64 h-64 -rotate-12 transform translate-x-16 -translate-y-16" />
      </div>
      <CardHeader className={cn("bg-gradient-to-r from-muted/50 via-muted/30 to-background", "dark:from-muted/20 dark:to-transparent border-b")}>
        <CardTitle className="flex items-center gap-2 text-xl text-foreground">
          {t("settings.currentPlanTitle")}
          <span
            className={cn(
              "px-3 py-1 rounded-full text-sm font-semibold shadow-sm",
              user?.plan === "pro"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                : user?.plan === "plus"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  : "bg-secondary text-secondary-foreground",
            )}
          >
            {user?.plan === "pro" ? t("plans.pro") : user?.plan === "plus" ? t("plans.plus") : t("plans.free")}
          </span>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {user?.plan === "pro"
            ? t("settings.planDescPro")
            : user?.plan === "plus"
              ? t("settings.planDescPlus")
              : t("settings.planDescFree")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8 pb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              {t("settings.planFeatures")}
            </h3>
            <ul className="space-y-3 pl-2">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className={cn("w-2 h-2 rounded-full", user?.plan !== "free" ? "bg-green-500" : "bg-yellow-500")} />
                {user?.plan === "pro"
                  ? t("plans.features.unlimitedCatalogs")
                  : user?.plan === "plus"
                    ? t("plans.features.catalogsCount", { count: 10 })
                    : t("plans.features.catalogsCount", { count: 1 })}
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className={cn("w-2 h-2 rounded-full", user?.plan !== "free" ? "bg-green-500" : "bg-yellow-500")} />
                {user?.plan !== "free" ? t("plans.features.unlimitedProducts") : t("plans.features.productLimit", { count: 50 })}
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className={cn("w-2 h-2 rounded-full", user?.plan !== "free" ? "bg-green-500" : "bg-muted")} />
                {user?.plan !== "free" ? t("plans.features.categoryManagement") : t("plans.features.noCategoryManagement")}
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className={cn("w-2 h-2 rounded-full", user?.plan !== "free" ? "bg-green-500" : "bg-yellow-500")} />
                {user?.plan !== "free" ? t("plans.features.premiumTemplates") : t("plans.features.basicTemplates")}
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className={cn("w-2 h-2 rounded-full", user?.plan === "pro" || user?.plan === "plus" ? "bg-green-500" : "bg-muted")} />
                {user?.plan === "pro"
                  ? t("plans.features.advancedAnalytics")
                  : user?.plan === "plus"
                    ? t("plans.features.basicExport")
                    : t("plans.features.noAnalytics")}
              </li>
            </ul>
          </div>

          {(user?.plan === "free" || user?.plan === "plus") && (
            <div
              className={cn(
                "flex flex-col items-center justify-center p-6",
                "bg-gradient-to-br from-indigo-50 to-purple-50",
                "dark:from-indigo-950/20 dark:to-purple-950/20",
                "rounded-xl border border-indigo-100",
                "dark:border-indigo-500/20 text-center space-y-4",
              )}
            >
              <h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-lg">
                {user?.plan === "plus" ? t("plans.upgradeToPro") : t("plans.upgrade")}
              </h3>
              <p className="text-sm text-indigo-700/80 dark:text-indigo-200/60">
                {user?.plan === "plus" ? t("plans.upgradeDescPro") : t("plans.upgradeDescPlus")}
              </p>
              <Button
                size="lg"
                onClick={onUpgradeClick}
                className={cn(
                  "w-full bg-gradient-to-r from-indigo-600 to-purple-600",
                  "hover:from-indigo-700 hover:to-purple-700",
                  "shadow-lg shadow-indigo-500/20 text-white font-semibold",
                )}
              >
                {user?.plan === "plus" ? t("plans.upgradeToProBtn") : t("plans.viewPlans")}
              </Button>
            </div>
          )}

          {user?.plan === "pro" && (
            <div
              className={cn(
                "flex flex-col items-center justify-center p-6",
                "bg-green-50 dark:bg-green-950/20 rounded-xl",
                "border border-green-100 dark:border-green-500/20",
                "text-center space-y-4",
              )}
            >
              <h3 className="font-bold text-green-900 dark:text-green-300 text-lg">{t("settings.greatChoice")}</h3>
              <p className="text-sm text-green-700/80 dark:text-green-200/60">{t("settings.planDescPro")}</p>
              <Button
                variant="outline"
                className={cn(
                  "w-full border-green-200 dark:border-green-500/30",
                  "text-green-700 dark:text-green-400",
                  "hover:bg-green-100 dark:hover:bg-green-900/40",
                )}
              >
                {t("settings.billingHistory")}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
