"use client"

import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Language } from "@/lib/translations"
import type { ExcelAiIntent } from "@/lib/excel-ai/types"

interface PendingIntentCardProps {
    intent: ExcelAiIntent
    language: Language
    selectedCount: number
    visibleCount: number
    totalCount: number
    isApplying: boolean
    isGenerating: boolean
    onApply: () => void
    onDismiss: () => void
}

function getScopeLabel(scope: ExcelAiIntent["scope"], language: Language): string {
    if (language === "tr") {
        if (scope === "selected") return "Seçili"
        if (scope === "all") return "Tüm ürünler"
        return "Mevcut sayfa"
    }
    if (scope === "selected") return "Selected"
    if (scope === "all") return "All products"
    return "Current page"
}

function estimateTargetCount(
    scope: ExcelAiIntent["scope"],
    selectedCount: number,
    visibleCount: number,
    totalCount: number,
): number {
    if (scope === "selected") return selectedCount
    if (scope === "all") return totalCount
    return visibleCount
}

export function PendingIntentCard({
    intent,
    language,
    selectedCount,
    visibleCount,
    totalCount,
    isApplying,
    isGenerating,
    onApply,
    onDismiss,
}: PendingIntentCardProps) {
    return (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <div className="text-xs font-semibold text-primary">
                {language === "tr" ? "Bekleyen Önizleme" : "Pending Preview"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
                {language === "tr" ? "Kapsam" : "Scope"}: {getScopeLabel(intent.scope, language)}
                {" | "}
                {language === "tr" ? "Tahmini ürün" : "Estimated products"}:{" "}
                {estimateTargetCount(intent.scope, selectedCount, visibleCount, totalCount)}
            </div>
            <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={onApply} disabled={isApplying || isGenerating}>
                    {isApplying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {language === "tr" ? "Uygula" : "Apply"}
                </Button>
                <Button size="sm" variant="ghost" onClick={onDismiss} disabled={isApplying || isGenerating}>
                    {language === "tr" ? "İptal" : "Dismiss"}
                </Button>
            </div>
        </div>
    )
}
