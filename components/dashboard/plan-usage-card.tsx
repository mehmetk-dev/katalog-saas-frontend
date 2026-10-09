"use client"

import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { getPlanLimits, type PlanType } from "@/lib/constants"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { User } from "@/lib/contexts/user-context"
import { cn } from "@/lib/utils"

interface UsageRowProps {
  label: string
  used: number
  max: number
  unlimitedLabel: string
}

function UsageRow({ label, used, max, unlimitedLabel }: UsageRowProps) {
  const unlimited = !Number.isFinite(max) || max >= 999999
  const ratio = unlimited || max <= 0 ? 0 : Math.min(100, (used / max) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium tabular-nums text-sidebar-foreground", ratio >= 100 && "text-destructive")}>
          {unlimited ? `${used} · ${unlimitedLabel}` : `${used}/${max}`}
        </span>
      </div>
      {!unlimited ? <Progress value={ratio} className="h-1.5" /> : null}
    </div>
  )
}

/** Sidebar'daki plan ve kullanım kartı — limitler lib/constants'tan, PDF kullanımı aylık */
export function PlanUsageCard({ user, isLoading, onUpgrade }: { user: User | null; isLoading: boolean; onUpgrade: () => void }) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    )
  }

  const plan = (user?.plan || "free") as PlanType
  const limits = getPlanLimits(plan)

  return (
    <div className="space-y-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-sidebar-foreground">{t(`planCatalog.names.${plan}`)}</span>
        {user?.subscriptionStatus === "cancelled" ? (
          <span className="text-xs text-muted-foreground">{t("sidebar.planCancelled")}</span>
        ) : null}
      </div>

      <div className="space-y-2.5">
        <UsageRow label={t("sidebar.catalogs")} used={user?.catalogsCount ?? 0} max={limits.maxCatalogs} unlimitedLabel={t("plans.unlimited")} />
        <UsageRow label={t("sidebar.products")} used={user?.productsCount ?? 0} max={limits.maxProducts} unlimitedLabel={t("plans.unlimited")} />
        <UsageRow label={t("sidebar.pdfThisMonth")} used={user?.exportsUsed ?? 0} max={limits.maxExports} unlimitedLabel={t("plans.unlimited")} />
      </div>

      {plan !== "pro" ? (
        <Button size="sm" variant={plan === "free" ? "brand" : "outline"} className="w-full gap-2" onClick={onUpgrade}>
          {t("settings.upgrade")}
          <ArrowUpRight className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}
