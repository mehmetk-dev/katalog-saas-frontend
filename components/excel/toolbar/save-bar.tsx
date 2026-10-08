"use client"

import { Save, X, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/contexts/i18n-provider"

interface SaveBarProps {
  editedCount: number
  newCount: number
  deletedCount: number
  errorCount: number
  canSave: boolean
  isSaving: boolean
  onSave: () => void
  onDiscard: () => void
}

export function SaveBar({
  editedCount, newCount, deletedCount, errorCount,
  canSave, isSaving, onSave, onDiscard,
}: SaveBarProps) {
  const { t } = useTranslation()

  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2.5 border-b bg-warning-soft/80 backdrop-blur-sm">
      <AlertTriangle className="h-4 w-4 text-warning-soft-foreground shrink-0" />

      {/* Change summary */}
      <div className="flex items-center gap-2 flex-wrap text-sm">
        {editedCount > 0 && (
          <Badge variant="secondary" className="bg-warning-soft text-warning-soft-foreground">
            {t("excel.edited", { count: editedCount })}
          </Badge>
        )}
        {newCount > 0 && (
          <Badge variant="secondary" className="bg-success-soft text-success-soft-foreground">
            {t("excel.newRows", { count: newCount })}
          </Badge>
        )}
        {deletedCount > 0 && (
          <Badge variant="secondary" className="bg-destructive-soft text-destructive-soft-foreground">
            {t("excel.deleted", { count: deletedCount })}
          </Badge>
        )}
        {errorCount > 0 && (
          <Badge variant="destructive" className="animate-pulse">
            {t("excel.errors", { count: errorCount })}
          </Badge>
        )}
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <Button variant="ghost" size="sm" onClick={onDiscard} disabled={isSaving} className="gap-1.5">
        <X className="h-3.5 w-3.5" />
        {t("excel.discard")}
      </Button>

      <Button
        size="sm"
        onClick={onSave}
        disabled={!canSave || isSaving}
        title={!canSave ? (t("excel.fixErrors") as string) : undefined}
        className="gap-1.5"
      >
        <Save className="h-3.5 w-3.5" />
        {isSaving ? t("excel.saving") : t("excel.save")}
      </Button>
    </div>
  )
}
