"use client"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { formatCurrency } from "@/lib/utils/helpers"

interface ActiveFiltersProps {
    search: string
    selectedCategory: string
    stockFilter: string
    priceRange: [number, number]
    onClearSearch: () => void
    onClearCategory: () => void
    onClearStock: () => void
    onClearPrice: () => void
    onClearAll: () => void
}

const STOCK_LABEL_KEYS: Record<string, string> = {
    in_stock: "filters.inStock",
    low_stock: "filters.lowStock",
    out_of_stock: "filters.outOfStock",
}

/** Uygulanan filtreleri tek tek kaldırılabilir etiketler olarak gösterir. */
export function ActiveFilters({
    search,
    selectedCategory,
    stockFilter,
    priceRange,
    onClearSearch,
    onClearCategory,
    onClearStock,
    onClearPrice,
    onClearAll,
}: ActiveFiltersProps) {
    const { t: baseT } = useTranslation()
    const t = (key: string, params?: Record<string, unknown>) => baseT(key, params) as string
    const [min, max] = priceRange

    const chips: Array<{ key: string; label: string; onRemove: () => void }> = []
    if (search.trim()) chips.push({ key: "search", label: t("products.chips.search", { value: search.trim() }), onRemove: onClearSearch })
    if (selectedCategory !== "all") chips.push({ key: "category", label: selectedCategory, onRemove: onClearCategory })
    if (stockFilter !== "all") chips.push({ key: "stock", label: t(STOCK_LABEL_KEYS[stockFilter] ?? "filters.all"), onRemove: onClearStock })
    if (min > 0 || max > 0) {
        const label = min > 0 && max > 0
            ? t("products.chips.priceRange", { min: formatCurrency(min), max: formatCurrency(max) })
            : min > 0
                ? t("products.chips.priceMin", { value: formatCurrency(min) })
                : t("products.chips.priceMax", { value: formatCurrency(max) })
        chips.push({ key: "price", label, onRemove: onClearPrice })
    }

    if (chips.length === 0) return null

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
                <span
                    key={chip.key}
                    className="inline-flex h-7 items-center gap-1 rounded-full border bg-card pl-3 pr-1 text-xs font-medium text-foreground"
                >
                    <span className="max-w-48 truncate">{chip.label}</span>
                    <button
                        type="button"
                        onClick={chip.onRemove}
                        aria-label={`${t("filters.clear")}: ${chip.label}`}
                        className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <X className="size-3" />
                    </button>
                </span>
            ))}
            {chips.length > 1 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onClearAll}>
                    {t("products.clearFilters")}
                </Button>
            )}
        </div>
    )
}
