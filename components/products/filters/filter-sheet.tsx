"use client"

import { useMemo } from "react"
import { Filter, X, Check, SortAsc, SortDesc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"

const SORT_OPTIONS = [
    { value: "created_at", labelKey: "filters.sortNew" },
    { value: "name", labelKey: "filters.sortName" },
    { value: "price", labelKey: "filters.sortPrice" },
    { value: "stock", labelKey: "filters.sortStock" },
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
    priceRange: [number, number]
    onPriceRangeChange: (range: [number, number]) => void
    maxPrice: number
    hasActiveFilters: boolean
    onClearFilters: () => void
    filteredCount: number
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
    maxPrice,
    hasActiveFilters,
    onClearFilters,
    filteredCount,
}: ProductsFilterSheetProps) {
    const { t } = useTranslation()

    const priceQuickOptions = useMemo(() => [
        { label: t("filters.all") as string, min: 0, max: maxPrice },
        { label: "₺0-100", min: 0, max: 100 },
        { label: "₺100-500", min: 100, max: 500 },
        { label: "₺500-1000", min: 500, max: 1000 },
        { label: "₺1000+", min: 1000, max: maxPrice },
    ], [maxPrice, t])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[320px] sm:w-[380px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        {t("products.filterBy") as string}
                    </SheetTitle>
                    <SheetDescription>
                        {t("filters.description") as string}
                    </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                    {/* Sıralama */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">{t("filters.sort") as string}</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {SORT_OPTIONS.map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant={sortField === opt.value ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "justify-between",
                                        sortField === opt.value && "bg-violet-600 hover:bg-violet-700"
                                    )}
                                    onClick={() => {
                                        if (sortField === opt.value) {
                                            onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")
                                        } else {
                                            onSortFieldChange(opt.value)
                                            onSortOrderChange("desc")
                                        }
                                    }}
                                >
                                    {t(opt.labelKey) as string}
                                    {sortField === opt.value && (
                                        sortOrder === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t pt-4" />

                    {/* Kategori */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t("filters.category") as string}</Label>
                        <Select value={selectedCategory} onValueChange={onCategoryChange}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("filters.allCategories") as string} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("filters.allCategories") as string}</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Stok Durumu */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t("filters.stockStatus") as string}</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: "all", label: t("filters.all") as string },
                                { value: "in_stock", label: t("filters.inStock") as string },
                                { value: "low_stock", label: t("filters.lowStock") as string },
                                { value: "out_of_stock", label: t("filters.outOfStock") as string },
                            ].map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant={stockFilter === opt.value ? "default" : "outline"}
                                    size="sm"
                                    className={stockFilter === opt.value ? "bg-violet-600 hover:bg-violet-700" : ""}
                                    onClick={() => onStockFilterChange(opt.value)}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Fiyat Aralığı */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">{t("filters.priceRange") as string}</Label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
                                <Input
                                    type="number"
                                    placeholder={t("filters.min") as string}
                                    value={priceRange[0] || ""}
                                    onChange={(e) => onPriceRangeChange([Math.max(0, Number(e.target.value) || 0), priceRange[1]])}
                                    className="pl-7 h-9"
                                />
                            </div>
                            <span className="text-muted-foreground">-</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
                                <Input
                                    type="number"
                                    placeholder={t("filters.max") as string}
                                    value={priceRange[1] || ""}
                                    onChange={(e) => onPriceRangeChange([priceRange[0], Math.max(0, Number(e.target.value) || maxPrice)])}
                                    className="pl-7 h-9"
                                />
                            </div>
                        </div>
                        {/* Hızlı Fiyat Seçenekleri */}
                        <div className="flex flex-wrap gap-1.5">
                            {priceQuickOptions.map((opt) => (
                                <Button
                                    key={opt.label}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => onPriceRangeChange([opt.min, opt.max])}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Alt Butonlar */}
                    <div className="pt-4 border-t space-y-2">
                        <div className="flex gap-2 pt-2">
                            {hasActiveFilters && (
                                <Button variant="outline" className="flex-1 gap-2" onClick={onClearFilters}>
                                    <X className="w-4 h-4" />
                                    {t("filters.clear") as string}
                                </Button>
                            )}
                            <Button
                                className={cn("flex-1 gap-2 bg-violet-600 hover:bg-violet-700", !hasActiveFilters && "w-full")}
                                onClick={() => onOpenChange(false)}
                            >
                                <Check className="w-4 h-4" />
                                {t("filters.apply") as string} ({filteredCount} {t("products.product") as string})
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
