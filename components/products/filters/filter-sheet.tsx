"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
import { formatNumberForInput } from "@/lib/utils/number-input"
import { normalizePriceRange, parsePriceFilterInput } from "@/components/products/products-page-utils"

const STOCK_OPTIONS = [
    { value: "all", labelKey: "filters.all" },
    { value: "in_stock", labelKey: "filters.inStock" },
    { value: "low_stock", labelKey: "filters.lowStock" },
    { value: "out_of_stock", labelKey: "filters.outOfStock" },
] as const

interface ProductsFilterSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
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


export function ProductsFilterSheet({
    open,
    onOpenChange,
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
    const { t: baseT, language } = useTranslation()
    const t = (key: string) => baseT(key) as string

    // Fiyat alanları her tuşta sunucuya gitmesin: taslak tutulur, alandan çıkınca/Enter'da uygulanır
    const toDraft = (value: number) => (value ? formatNumberForInput(value, language) : "")
    const [minDraft, setMinDraft] = useState(toDraft(priceRange[0]))
    const [maxDraft, setMaxDraft] = useState(toDraft(priceRange[1]))
    useEffect(() => {
        setMinDraft(priceRange[0] ? formatNumberForInput(priceRange[0], language) : "")
        setMaxDraft(priceRange[1] ? formatNumberForInput(priceRange[1], language) : "")
    }, [priceRange, language])

    const commitPrice = () => {
        const next = normalizePriceRange([parsePriceFilterInput(minDraft, language), parsePriceFilterInput(maxDraft, language)])
        if (next[0] !== priceRange[0] || next[1] !== priceRange[1]) onPriceRangeChange(next)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
                <SheetHeader className="border-b p-4 pr-12">
                    <SheetTitle>{t("products.filterBy")}</SheetTitle>
                    <SheetDescription>{t("filters.description")}</SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-6 overflow-y-auto p-4">
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

                <SheetFooter className="flex-row gap-2 border-t p-4">
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
