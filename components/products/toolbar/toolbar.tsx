"use client"

import { Fragment } from "react"
import { ArrowUpDown, Columns3, Search, SlidersHorizontal, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
import { InlineFilters } from "@/components/products/filters/inline-filters"
import { PRODUCT_COLUMNS, type ProductColumn } from "@/components/products/hooks/use-product-columns"
import type { ProductsView, SortField, SortOrder, StockFilter } from "@/components/products/products-page-utils"
import { ProductsViewSwitch } from "./view-switch"

/** Sıralama seçenekleri: alan + yön birlikte tek seçim (ayrı "yön" düğmesi kafa karıştırıyordu) */
export const SORT_CHOICES: Array<{ field: SortField; order: SortOrder; labelKey: string }> = [
    { field: "order", order: "asc", labelKey: "products.sort.manual" },
    { field: "created_at", order: "desc", labelKey: "products.sort.newest" },
    { field: "created_at", order: "asc", labelKey: "products.sort.oldest" },
    { field: "name", order: "asc", labelKey: "products.sort.nameAsc" },
    { field: "name", order: "desc", labelKey: "products.sort.nameDesc" },
    { field: "price", order: "asc", labelKey: "products.sort.priceAsc" },
    { field: "price", order: "desc", labelKey: "products.sort.priceDesc" },
    { field: "stock", order: "asc", labelKey: "products.sort.stockAsc" },
    { field: "stock", order: "desc", labelKey: "products.sort.stockDesc" },
    { field: "category", order: "asc", labelKey: "products.sort.categoryAsc" },
    { field: "category", order: "desc", labelKey: "products.sort.categoryDesc" },
]

const sortKey = (field: SortField, order: SortOrder) => `${field}:${order}`

/** "/" kısayolu bu alana odaklanır */
export const PRODUCTS_SEARCH_INPUT_ID = "products-search"

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
    onViewModeChange: (view: ProductsView) => void
    sortField: SortField
    sortOrder: SortOrder
    onSortChange: (field: SortField, order: SortOrder) => void
    categories: string[]
    selectedCategory: string
    onCategoryChange: (category: string) => void
    stockFilter: StockFilter
    onStockFilterChange: (filter: StockFilter) => void
    priceRange: [number, number]
    onPriceRangeChange: (range: [number, number]) => void
    onClearFilters: () => void
    visibleColumns: ProductColumn[]
    onToggleColumn: (column: ProductColumn, visible: boolean) => void
}

const COLUMN_LABEL_KEYS: Record<ProductColumn, string> = {
    sku: "products.columns.sku",
    price: "products.price",
    stock: "products.stock",
    category: "products.category",
    catalogs: "products.columns.catalogs",
    updated: "products.columns.updated",
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
    sortField,
    sortOrder,
    onSortChange,
    categories,
    selectedCategory,
    onCategoryChange,
    stockFilter,
    onStockFilterChange,
    priceRange,
    onPriceRangeChange,
    onClearFilters,
    visibleColumns,
    onToggleColumn,
}: ProductsToolbarProps) {
    const { t: baseT } = useTranslation()
    const t = (key: string, params?: Record<string, unknown>) => baseT(key, params) as string
    const allSelected = selectedCount > 0 && selectedCount === totalFilteredCount
    const selectAllLabel = selectedCount > 0 ? t("products.productsSelected", { count: selectedCount }) : t("products.selectAll")
    const activeSort = SORT_CHOICES.find((c) => c.field === sortField && c.order === sortOrder) ?? SORT_CHOICES[0]

    return (
        // Mobilde arama kendi satırında tam genişlik; diğer kontroller altında
        <div className="flex flex-wrap items-center gap-2">
            {/* Liste görünümünde masaüstünde seçim kutusu tablo başlığında; burada yalnızca grid ve mobil için */}
            <div
                className={cn("flex size-9 shrink-0 items-center justify-center rounded-md border bg-card", viewMode === "list" && "md:hidden")}
                title={selectAllLabel}
            >
                <Checkbox
                    checked={allSelected ? true : selectedCount > 0 ? "indeterminate" : false}
                    onCheckedChange={(checked) => onSelectAll(checked === true)}
                    aria-label={selectAllLabel}
                />
            </div>

            <div className="relative order-first w-full min-w-0 sm:order-none sm:w-auto sm:max-w-md sm:flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id={PRODUCTS_SEARCH_INPUT_ID}
                    type="search"
                    placeholder={t("products.searchPlaceholder")}
                    aria-label={t("products.searchPlaceholder")}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="bg-card pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
                />
                {!search && (
                    <kbd aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[11px] leading-5 text-muted-foreground md:block">
                        /
                    </kbd>
                )}
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

            {/* Geniş ekranda filtreler doğrudan araç çubuğunda; daha dar ekranlarda yan panelde */}
            <InlineFilters
                className="hidden xl:flex"
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={onCategoryChange}
                stockFilter={stockFilter}
                onStockFilterChange={onStockFilterChange}
                priceRange={priceRange}
                onPriceRangeChange={onPriceRangeChange}
            />
            {activeFilterCount > 0 && (
                <Button variant="ghost" onClick={onClearFilters} className="hidden shrink-0 text-muted-foreground xl:inline-flex">
                    {t("filters.clear")}
                </Button>
            )}

            <Button variant="outline" onClick={onOpenFilters} className="shrink-0 bg-card xl:hidden">
                <SlidersHorizontal className="size-4" />
                <span className="hidden sm:inline">{t("products.filterBy")}</span>
                {activeFilterCount > 0 && (
                    <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 tabular-nums">{activeFilterCount}</Badge>
                )}
            </Button>

            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shrink-0 bg-card" aria-label={`${t("products.sort.label")}: ${t(activeSort.labelKey)}`}>
                        <ArrowUpDown className="size-4" />
                        <span className="hidden max-w-40 truncate lg:inline">{t(activeSort.labelKey)}</span>
                        <span className="hidden sm:inline lg:hidden">{t("products.sort.label")}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t("products.sort.label")}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                        value={sortKey(activeSort.field, activeSort.order)}
                        onValueChange={(value) => {
                            const choice = SORT_CHOICES.find((c) => sortKey(c.field, c.order) === value)
                            if (choice) onSortChange(choice.field, choice.order)
                        }}
                    >
                        {SORT_CHOICES.map((choice, index) => (
                            <Fragment key={sortKey(choice.field, choice.order)}>
                                {index === 1 && <DropdownMenuSeparator />}
                                <DropdownMenuRadioItem value={sortKey(choice.field, choice.order)}>
                                    {t(choice.labelKey)}
                                </DropdownMenuRadioItem>
                            </Fragment>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-auto flex shrink-0 items-center gap-2">
            {viewMode === "list" && (
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="hidden bg-card md:inline-flex" aria-label={t("products.columns.menu")} title={t("products.columns.menu")}>
                            <Columns3 className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t("products.columns.menu")}</DropdownMenuLabel>
                        {PRODUCT_COLUMNS.map((column) => (
                            <DropdownMenuCheckboxItem
                                key={column}
                                checked={visibleColumns.includes(column)}
                                onCheckedChange={(checked) => onToggleColumn(column, checked === true)}
                                onSelect={(e) => e.preventDefault()}
                            >
                                {t(COLUMN_LABEL_KEYS[column])}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            <ProductsViewSwitch value={viewMode} onChange={onViewModeChange} t={t} />
            </div>
        </div>
    )
}
