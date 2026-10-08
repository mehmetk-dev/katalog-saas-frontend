"use client"

import { useEffect, useState } from "react"
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

const SORT_OPTIONS = [
    { value: "order", labelKey: "filters.sortManual" },
    { value: "created_at", labelKey: "filters.sortNew" },
    { value: "name", labelKey: "filters.sortName" },
    { value: "price", labelKey: "filters.sortPrice" },
    { value: "stock", labelKey: "filters.sortStock" },
] as const

const STOCK_OPTIONS = [
    { value: "all", labelKey: "filters.all" },
    { value: "in_stock", labelKey: "filters.inStock" },
    { value: "low_stock", labelKey: "filters.lowStock" },
    { value: "out_of_stock", labelKey: "filters.outOfStock" },
] as const

interface ProductsFilterSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sortField: string
    sortOrder: "asc" | "desc"
    onSortFieldChange: (field: string) => void
    onSortOrderChange: (order: "asc" | "desc") => void
    selectedCategory: string
    onCategoryChange: (category: string) => void
    categories: string[]
    stockFilter: string
    onStockFilterChange: (filter: string) => void
    /** [min, max]; 0 = sınır yok */
    priceRange: [number, number]
    onPriceRangeChange: (range: [number, number]) => void
    hasActiveFilters: boolean
    onClearFilters: () => void
    filteredCount: number
}

function ToggleButton({ active, className, ...props }: React.ComponentProps<typeof Button> & { active: boolean }) {
    return (
        <Button
            variant={active ? "default" : "outline"}
            size="sm"
            aria-pressed={active}
            className={cn("justify-center", className)}
            {...props}
        />
    )
}

function parsePriceInput(value: string): number {
    const parsed = Number(value.replace(",", "."))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function ProductsFilterSheet({
    open,
    onOpenChange,
    sortField,
    sortOrder,
    onSortFieldChange,
    onSortOrderChange,
    selectedCategory,
    onCategoryChange,
    categories,
    stockFilter,
    onStockFilterChange,
    priceRange,
    onPriceRangeChange,
    hasActiveFilters,
    onClearFilters,
    filteredCount,
}: ProductsFilterSheetProps) {
    const { t: baseT } = useTranslation()
    const t = (key: string) => baseT(key) as string

    // Fiyat alanları her tuşta sunucuya gitmesin: taslak tutulur, alandan çıkınca/Enter'da uygulanır
    const [minDraft, setMinDraft] = useState(priceRange[0] ? String(priceRange[0]) : "")
    const [maxDraft, setMaxDraft] = useState(priceRange[1] ? String(priceRange[1]) : "")
    useEffect(() => {
        setMinDraft(priceRange[0] ? String(priceRange[0]) : "")
        setMaxDraft(priceRange[1] ? String(priceRange[1]) : "")
    }, [priceRange])

    const commitPrice = () => {
        const next: [number, number] = [parsePriceInput(minDraft), parsePriceInput(maxDraft)]
        if (next[0] !== priceRange[0] || next[1] !== priceRange[1]) onPriceRangeChange(next)
    }

    const isManualOrder = sortField === "order"

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-sm">
                <SheetHeader className="border-b">
                    <SheetTitle>{t("products.filterBy")}</SheetTitle>
                    <SheetDescription>{t("filters.description")}</SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-6 overflow-y-auto p-4">
                    {/* Sıralama */}
                    <div className="space-y-2">
                        <Label>{t("filters.sort")}</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {SORT_OPTIONS.map((opt) => (
                                <ToggleButton key={opt.value} active={sortField === opt.value} onClick={() => onSortFieldChange(opt.value)}>
                                    {t(opt.labelKey)}
                                </ToggleButton>
                            ))}
                        </div>
                        <div className={cn("flex items-center gap-2 pt-1", isManualOrder && "opacity-50")}>
                            <span className="text-xs text-muted-foreground">{t("filters.sortDirection")}</span>
                            <div className="flex gap-1.5">
                                <ToggleButton active={!isManualOrder && sortOrder === "asc"} disabled={isManualOrder} onClick={() => onSortOrderChange("asc")}>
                                    <ArrowUpNarrowWide className="size-3.5" />
                                    {t("filters.ascending")}
                                </ToggleButton>
                                <ToggleButton active={!isManualOrder && sortOrder === "desc"} disabled={isManualOrder} onClick={() => onSortOrderChange("desc")}>
                                    <ArrowDownWideNarrow className="size-3.5" />
                                    {t("filters.descending")}
                                </ToggleButton>
                            </div>
                        </div>
                    </div>

                    {/* Kategori */}
                    <div className="space-y-2">
                        <Label>{t("filters.category")}</Label>
                        <Select value={selectedCategory} onValueChange={onCategoryChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t("filters.allCategories")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Stok */}
                    <div className="space-y-2">
                        <Label>{t("filters.stockStatus")}</Label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {STOCK_OPTIONS.map((opt) => (
                                <ToggleButton key={opt.value} active={stockFilter === opt.value} onClick={() => onStockFilterChange(opt.value)}>
                                    {t(opt.labelKey)}
                                </ToggleButton>
                            ))}
                        </div>
                    </div>

                    {/* Fiyat */}
                    <div className="space-y-2">
                        <Label>{t("filters.priceRange")}</Label>
                        <div className="flex items-center gap-2">
                            {([["min", minDraft, setMinDraft], ["max", maxDraft, setMaxDraft]] as const).map(([key, value, setValue], index) => (
                                <div key={key} className="contents">
                                    {index === 1 && <span className="text-muted-foreground">–</span>}
                                    <div className="relative flex-1">
                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₺</span>
                                        <Input
                                            inputMode="decimal"
                                            aria-label={t(`filters.${key}`)}
                                            placeholder={key === "min" ? t("filters.min") : t("filters.noLimit")}
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            onBlur={commitPrice}
                                            onKeyDown={(e) => { if (e.key === "Enter") commitPrice() }}
                                            className="pl-7"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <SheetFooter className="flex-row gap-2 border-t">
                    {hasActiveFilters && (
                        <Button variant="outline" className="flex-1" onClick={onClearFilters}>
                            {t("filters.clear")}
                        </Button>
                    )}
                    <Button
                        className="flex-1"
                        onClick={() => {
                            commitPrice()
                            onOpenChange(false)
                        }}
                    >
                        {t("filters.showResults")}
                        <span className="tabular-nums opacity-70">({filteredCount})</span>
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
