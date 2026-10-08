"use client"

import { ChevronLeft, ChevronRight, FileText, Maximize2, Rows3, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"

interface PreviewControlBarProps {
  viewMode: "single" | "multi"
  onViewModeChange: (mode: "single" | "multi") => void
  scale: number
  onScaleChange: (scale: number) => void
  /** Panel genişliğine sığdır (otomatik ölçeklemeyi yeniden açar) */
  onFit: () => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const MIN_SCALE = 0.3
const MAX_SCALE = 2

export function PreviewControlBar({
  viewMode,
  onViewModeChange,
  scale,
  onScaleChange,
  onFit,
  currentPage,
  totalPages,
  onPageChange,
}: PreviewControlBarProps) {
  const { t: baseT } = useTranslation()
  const t = (key: string) => baseT(key) as string

  const segment = "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors"

  return (
    <div className="z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background/90 px-2 backdrop-blur sm:px-3">
      {/* Tek sayfa / tüm sayfalar */}
      <div role="radiogroup" className="flex items-center rounded-lg bg-muted p-0.5">
        <button
          type="button"
          role="radio"
          aria-checked={viewMode === "single"}
          title={t("preview.singlePage")}
          onClick={() => onViewModeChange("single")}
          className={cn(segment, viewMode === "single" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          <FileText className="size-3.5" />
          <span className="hidden xl:inline">{t("preview.singlePage")}</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={viewMode === "multi"}
          title={t("preview.allPages")}
          onClick={() => onViewModeChange("multi")}
          className={cn(segment, viewMode === "multi" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          <Rows3 className="size-3.5" />
          <span className="hidden xl:inline">{t("preview.allPages")}</span>
        </button>
      </div>

      {/* Sayfa geçişi */}
      {viewMode === "single" && totalPages > 1 && (
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            aria-label={t("preview.previousPage")}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-14 text-center text-xs font-medium tabular-nums text-muted-foreground">
            {currentPage + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            aria-label={t("preview.nextPage")}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Yakınlaştırma */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onScaleChange(Math.max(MIN_SCALE, Math.round((scale - 0.1) * 10) / 10))}
          disabled={scale <= MIN_SCALE}
          aria-label={t("preview.zoomOut")}
        >
          <ZoomOut className="size-4" />
        </Button>
        <span className="hidden w-10 text-center text-xs font-medium tabular-nums text-muted-foreground sm:inline">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onScaleChange(Math.min(MAX_SCALE, Math.round((scale + 0.1) * 10) / 10))}
          disabled={scale >= MAX_SCALE}
          aria-label={t("preview.zoomIn")}
        >
          <ZoomIn className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onFit} title={t("preview.fit")} aria-label={t("preview.fit")}>
          <Maximize2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
