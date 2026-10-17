"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
import type { StockFilter } from "@/components/products/products-page-utils"

const STOCK_OPTIONS: Array<{ value: StockFilter; labelKey: string }> = [
    { value: "all", labelKey: "filters.all" },
    { value: "in_stock", labelKey: "filters.inStock" },
    { value: "low_stock", labelKey: "filters.lowStock" },
    { value: "out_of_stock", labelKey: "filters.outOfStock" },
]

const formatPrice = (value: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value)

function parsePriceInput(value: string): number {
    const parsed = Number(value.replace(",", "."))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

interface InlineFiltersProps {
    categories: string[]
    selectedCategory: string
    onCategoryChange: (category: string) => void
    stockFilter: StockFilter
    onStockFilterChange: (filter: StockFilter) => void
    /** [min, max]; 0 = sınır yok */
    priceRange: [number, number]
    onPriceRangeChange: (range: [number, number]) => void
    className?: string
}

/** Filtre düğmesi: seçili değer varsa etiketin yanında gösterilir ("Kategori: Oturma") */
function FilterTrigger({ label, value, active, ...props }: React.ComponentProps<typeof Button> & { label: string; value?: string; active: boolean }) {
    return (
        <Button variant="outline" className={cn("shrink-0 bg-card", active && "border-foreground/30")} {...props}>
            <span className={cn(active && "text-muted-foreground")}>{label}</span>
            {active && value && <span className="max-w-32 truncate font-semibold">{value}</span>}
            <ChevronDown className="size-3.5 opacity-60" />
        </Button>
    )
}

/**
 * Masaüstü araç çubuğundaki filtreler. Mobilde aynı filtreler yan panelde (ProductsFilterSheet) kalır.
 */
export function InlineFilters({
    categories,
    selectedCategory,
    onCategoryChange,
    stockFilter,
    onStockFilterChange,
    priceRange,
    onPriceRangeChange,
    className,
}: InlineFiltersProps) {
    const { t: baseT } = useTranslation()
    const t = (key: string, params?: Record<string, unknown>) => baseT(key, params) as string

    const [priceOpen, setPriceOpen] = useState(false)
    const [minDraft, setMinDraft] = useState("")
    const [maxDraft, setMaxDraft] = useState("")
    useEffect(() => {
        if (!priceOpen) return
        setMinDraft(priceRange[0] ? String(priceRange[0]) : "")
        setMaxDraft(priceRange[1] ? String(priceRange[1]) : "")
    }, [priceOpen, priceRange])

    const applyPrice = () => {
        onPriceRangeChange([parsePriceInput(minDraft), parsePriceInput(maxDraft)])
        setPriceOpen(false)
    }

    const categoryActive = selectedCategory !== "all"
    const stockActive = stockFilter !== "all"
    const priceActive = priceRange[0] > 0 || priceRange[1] > 0
    const stockLabel = STOCK_OPTIONS.find((o) => o.value === stockFilter)?.labelKey
    const priceValue = priceRange[0] > 0 && priceRange[1] > 0
        ? t("products.chips.priceRange", { min: formatPrice(priceRange[0]), max: formatPrice(priceRange[1]) })
        : priceRange[0] > 0
            ? t("products.chips.priceMin", { value: formatPrice(priceRange[0]) })
            : t("products.chips.priceMax", { value: formatPrice(priceRange[1]) })

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <FilterTrigger label={t("filters.category")} value={selectedCategory} active={categoryActive} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-80 w-56 overflow-y-auto">
                    <DropdownMenuRadioGroup value={selectedCategory} onValueChange={onCategoryChange}>
                        <DropdownMenuRadioItem value="all">{t("filters.allCategories")}</DropdownMenuRadioItem>
                        {categories.length > 0 && <DropdownMenuSeparator />}
                        {categories.map((category) => (
                            <DropdownMenuRadioItem key={category} value={category}>
                                <span className="truncate">{category}</span>
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <FilterTrigger label={t("filters.stock")} value={stockLabel ? t(stockLabel) : undefined} active={stockActive} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuRadioGroup value={stockFilter} onValueChange={(value) => onStockFilterChange(value as StockFilter)}>
                        {STOCK_OPTIONS.map((option, index) => (
                            <div key={option.value} className="contents">
                                {index === 1 && <DropdownMenuSeparator />}
                                <DropdownMenuRadioItem value={option.value}>{t(option.labelKey)}</DropdownMenuRadioItem>
                            </div>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <Popover open={priceOpen} onOpenChange={setPriceOpen}>
                <PopoverTrigger asChild>
                    <FilterTrigger label={t("filters.price")} value={priceValue} active={priceActive} />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 space-y-3">
                    <p className="text-sm font-medium">{t("filters.priceRange")}</p>
                    <form
                        className="space-y-3"
                        onSubmit={(e) => {
                            e.preventDefault()
                            applyPrice()
                        }}
                    >
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
                                            className="h-9 pl-7"
                                            autoFocus={index === 0}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            {priceActive && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        onPriceRangeChange([0, 0])
                                        setPriceOpen(false)
                                    }}
                                >
                                    {t("filters.clear")}
                                </Button>
                            )}
                            <Button type="submit" size="sm">{t("filters.apply")}</Button>
                        </div>
                    </form>
                </PopoverContent>
            </Popover>
        </div>
    )
}
