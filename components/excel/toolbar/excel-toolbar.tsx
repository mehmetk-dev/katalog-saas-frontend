"use client"

import { Search, Plus, Trash2, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/contexts/i18n-provider"

interface ExcelToolbarProps {
  selectedCount: number
  totalCount: number
  search: string
  onSearchChange: (value: string) => void
  onAddRow: () => void
  onDeleteSelected: () => void
  onClearSelection?: () => void
  onOpenAI?: () => void
}

export function ExcelToolbar({
  selectedCount, totalCount, search, onSearchChange,
  onAddRow, onDeleteSelected, onClearSelection, onOpenAI,
}: ExcelToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t("excel.searchPlaceholder") as string}
          className="pl-9 h-8 text-sm"
        />
      </div>

      {/* Count */}
      <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
        {totalCount} {t("products.title")}
      </span>

      <div className="flex-1" />

      {/* Actions */}
      <Button variant="outline" size="sm" onClick={onAddRow} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("excel.addProduct")}</span>
      </Button>

      {selectedCount > 0 && (
        <>
          {onClearSelection && (
            <Button variant="ghost" size="sm" onClick={onClearSelection} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">{t("excel.clearSelection")}</span>
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={onDeleteSelected} className="gap-1.5">
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("excel.deleteSelected")}</span>
            <span className="tabular-nums">({selectedCount})</span>
          </Button>
        </>
      )}

      {/* AI Button — Faz 2 */}
      {onOpenAI && (
        <Button variant="outline" size="sm" onClick={onOpenAI} disabled className="gap-1.5 opacity-50">
          <Sparkles className="h-3.5 w-3.5" />
          AI
        </Button>
      )}
    </div>
  )
}
