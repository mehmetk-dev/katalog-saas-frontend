"use client"

import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

interface ProductsToolbarProps {
    selectedCount: number
    totalFilteredCount: number
    onSelectAll: (checked: boolean) => void
    search: string
    onSearchChange: (value: string) => void
    onOpenFilters: () => void
    /** Aktif filtre sayısı (arama hariç) */
    activeFilterCount: number
    viewMode: "grid" | "list"
    onViewModeChange: (mode: "grid" | "list") => void
}

export function ProductsToolbar({
    selectedCount,
    totalFilteredCount,
    onSelectAll,
    search,
    onSearchChange,
    onOpenFilters,
    activeFilterCount,
    viewMode,
    onViewModeChange,
}: ProductsToolbarProps) {
    const { t: baseT } = useTranslation()
    const t = (key: string, params?: Record<string, unknown>) => baseT(key, params) as string
    const allSelected = selectedCount > 0 && selectedCount === totalFilteredCount
    const selectAllLabel = selectedCount > 0 ? t("products.productsSelected", { count: selectedCount }) : t("products.selectAll")

    return (
        <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-card" title={selectAllLabel}>
                <Checkbox
                    checked={allSelected ? true : selectedCount > 0 ? "indeterminate" : false}
                    onCheckedChange={(checked) => onSelectAll(checked === true)}
                    aria-label={selectAllLabel}
                />
            </div>

            <div className="relative min-w-0 flex-1 sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={t("products.searchPlaceholder")}
                    aria-label={t("products.searchPlaceholder")}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="bg-card pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        aria-label={t("filters.clear")}
                        className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>

            <Button variant="outline" onClick={onOpenFilters} className="shrink-0 bg-card">
                <SlidersHorizontal className="size-4" />
                <span className="hidden sm:inline">{t("products.filterBy")}</span>
                {activeFilterCount > 0 && (
                    <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 tabular-nums">{activeFilterCount}</Badge>
                )}
            </Button>

            <div role="radiogroup" aria-label="view" className="ml-auto flex shrink-0 rounded-md border bg-card p-0.5">
                {([["list", List], ["grid", LayoutGrid]] as const).map(([mode, Icon]) => (
                    <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={viewMode === mode}
                        aria-label={mode}
                        onClick={() => onViewModeChange(mode)}
                        className={cn(
                            "flex size-8 items-center justify-center rounded transition-colors",
                            viewMode === mode ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Icon className="size-4" />
                    </button>
                ))}
            </div>
        </div>
    )
}
