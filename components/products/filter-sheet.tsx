"use client"

import { Filter, X, Check, SortAsc, SortDesc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-provider"

interface ProductsFilterSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sortField: string
    sortOrder: "asc" | "desc"
    onSortFieldChange: (field: any) => void
    onSortOrderChange: (order: "asc" | "desc") => void
    selectedCategory: string
    onCategoryChange: (category: string) => void
    categories: string[]
    stockFilter: string
    onStockFilterChange: (filter: any) => void
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[320px] sm:w-[380px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        {t("products.filterBy")}
                    </SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                    {/* Sıralama */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Sıralama</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: "created_at", label: "Yeni" },
                                { value: "name", label: "İsim" },
                                { value: "price", label: "Fiyat" },
                                { value: "stock", label: "Stok" },
                            ].map((opt) => (
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
                                    {opt.label}
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
                        <Label className="text-sm font-medium">{t("filters.category")}</Label>
                        <Select value={selectedCategory} onValueChange={onCategoryChange}>
                            <SelectTrigger>
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

                    {/* Stok Durumu */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t("filters.stockStatus")}</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: "all", label: t("filters.all") },
                                { value: "in_stock", label: t("filters.inStock") },
                                { value: "low_stock", label: t("filters.lowStock") },
                                { value: "out_of_stock", label: t("filters.outOfStock") },
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
                        <Label className="text-sm font-medium">{t("filters.priceRange")}</Label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
                                <Input
                                    type="number"
                                    placeholder={t("filters.min")}
                                    value={priceRange[0] || ""}
                                    onChange={(e) => onPriceRangeChange([Number(e.target.value) || 0, priceRange[1]])}
                                    className="pl-7 h-9"
                                />
                            </div>
                            <span className="text-muted-foreground">-</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
                                <Input
                                    type="number"
                                    placeholder={t("filters.max")}
                                    value={priceRange[1] || ""}
                                    onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value) || maxPrice])}
                                    className="pl-7 h-9"
                                />
                            </div>
                        </div>
                        {/* Hızlı Fiyat Seçenekleri */}
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { label: "Tümü", min: 0, max: maxPrice },
                                { label: "₺0-100", min: 0, max: 100 },
                                { label: "₺100-500", min: 100, max: 500 },
                                { label: "₺500-1000", min: 500, max: 1000 },
                                { label: "₺1000+", min: 1000, max: maxPrice },
                            ].map((opt) => (
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
                                    {t("filters.clear")}
                                </Button>
                            )}
                            <Button
                                className={cn("flex-1 gap-2 bg-violet-600 hover:bg-violet-700", !hasActiveFilters && "w-full")}
                                onClick={() => onOpenChange(false)}
                            >
                                <Check className="w-4 h-4" />
                                {t("filters.apply")} ({filteredCount} {t("products.product")})
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
