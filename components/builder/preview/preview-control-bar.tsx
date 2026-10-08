"use client"

import { FileText, List, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"

interface PreviewControlBarProps {
  viewMode: "single" | "multi"
  onViewModeChange: (mode: "single" | "multi") => void
  scale: number
  onScaleChange: (scale: number) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PreviewControlBar({
  viewMode,
  onViewModeChange,
  scale,
  onScaleChange,
  currentPage,
  totalPages,
  onPageChange,
}: PreviewControlBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2.5 bg-background/80 dark:bg-[#080a12]/80 backdrop-blur-xl border-b border-border shrink-0 z-30 shadow-sm gap-1 md:gap-2">
      {/* View Mode Toggle */}
      <div className="flex items-center">
        <div className="flex bg-muted p-0.5 rounded-xl border border-border">
          <Button
            variant={viewMode === 'single' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(
              "h-7 px-1.5 2xl:px-3 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
              viewMode === 'single' && "bg-card shadow-sm text-foreground"
            )}
            onClick={() => onViewModeChange('single')}
          >
            <FileText className="w-3.5 h-3.5 2xl:mr-1" />
            <span className="hidden 2xl:inline">{(t('preview.singlePage') as string) || 'Tek Sayfa'}</span>
          </Button>
          <Button
            variant={viewMode === 'multi' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(
              "h-7 px-1.5 2xl:px-3 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
              viewMode === 'multi' && "bg-card shadow-sm text-foreground"
            )}
            onClick={() => onViewModeChange('multi')}
          >
            <List className="w-3.5 h-3.5 2xl:mr-1" />
            <span className="hidden 2xl:inline">{(t('preview.allPages') as string) || 'Tüm Sayfalar'}</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-3 min-w-0 justify-end">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-muted p-0.5 rounded-xl border border-border shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 md:h-8 px-1.5 md:px-2 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => onScaleChange(Math.max(0.3, scale - 0.1))}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] font-bold w-8 text-center text-muted-foreground tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 md:h-8 px-1.5 md:px-2 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => onScaleChange(Math.min(2.0, scale + 0.1))}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Page Navigation - only in single view mode */}
        {viewMode === 'single' && totalPages > 1 && (
          <>
            {/* Small screen: compact prev/next */}
            <div className="flex md:hidden items-center gap-0.5 bg-muted px-1 py-0.5 rounded-xl border border-border shrink-0">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-muted-foreground" onClick={() => onPageChange(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[9px] font-black text-muted-foreground tabular-nums px-0.5 whitespace-nowrap">
                {currentPage + 1}/{totalPages}
              </span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-muted-foreground" onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Large screen: slider */}
            <div className="hidden md:flex items-center gap-3 bg-muted px-4 py-1.5 rounded-2xl border border-border min-w-[200px] max-w-[300px] flex-1">
              <div className="text-[9px] font-black text-muted-foreground tabular-nums shrink-0">
                {currentPage + 1}
              </div>
              <Slider
                value={[currentPage]}
                max={totalPages - 1}
                step={1}
                onValueChange={([val]) => onPageChange(val)}
                className="flex-1 cursor-pointer"
              />
              <div className="text-[9px] font-black text-muted-foreground tabular-nums shrink-0">
                {totalPages}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
