"use client"

import { Table2, Crown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/contexts/i18n-provider"

interface ProGateProps {
  onUpgrade: () => void
}

export function ProGate({ onUpgrade }: ProGateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Table2 className="h-8 w-8 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{t("excel.proOnly")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("excel.proOnlyDesc")}</p>
        </div>

        <Button onClick={onUpgrade} size="lg" className="gap-2">
          <Crown className="h-4 w-4" />
          {t("excel.upgrade")}
        </Button>
      </div>
    </div>
  )
}
