"use client"

import { Search, X, Filter, LayoutGrid, List, MoreHorizontal, FileDown, Image as ImageIcon, Sparkles, Percent, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { useTranslation } from "@/lib/i18n-provider"

interface ProductsToolbarProps {
    selectedCount: number
    totalFilteredCount: number
    onSelectAll: (checked: boolean) => void
    search: string
    onSearchChange: (value: string) => void
    onOpenFilters: () => void
    hasActiveFilters: boolean
    viewMode: "grid" | "list"
    onViewModeChange: (mode: "grid" | "list") => void
    itemsPerPage: number
    onItemsPerPageChange: (size: number) => void
    pageSizeOptions: number[]
    onOpenImportExport: () => void
    onOpenBulkImageUpload: () => void
    onOpenBulkPriceUpdate: () => void
    onBulkDelete: () => void
    onAddTestProducts: () => void
    onAddProduct: () => void
}

export function ProductsToolbar({
    selectedCount,
    totalFilteredCount,
    onSelectAll,
    search,
    onSearchChange,
    onOpenFilters,
    hasActiveFilters,
    viewMode,
    onViewModeChange,
    itemsPerPage,
    onItemsPerPageChange,
    pageSizeOptions,
    onOpenImportExport,
    onOpenBulkImageUpload,
    onOpenBulkPriceUpdate,
    onBulkDelete,
    onAddTestProducts,
    onAddProduct
}: ProductsToolbarProps) {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl p-2 shadow-sm">
            {/* Tümünü Seç Checkbox */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center justify-center h-7 w-7 sm:h-9 sm:w-9 shrink-0">
                        <Checkbox
                            checked={selectedCount > 0 && selectedCount === totalFilteredCount}
                            onCheckedChange={onSelectAll}
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    {selectedCount > 0 ? `${t("products.selected", { count: selectedCount })} - ${t("products.clear")}` : t("products.selectAll")}
                </TooltipContent>
            </Tooltip>

            {/* Arama */}
            <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder={t("products.searchPlaceholder")}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 pr-9 h-9 border-0 bg-gray-50 dark:bg-gray-800"
                />
                {search && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Filtre Butonu */}
            <Button
                variant={hasActiveFilters ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5 shrink-0 h-9"
                onClick={onOpenFilters}
            >
                <Filter className="w-4 h-4" />
                <span className="hidden md:inline">{t("products.filterBy")}</span>
                {hasActiveFilters && (
                    <Badge variant="destructive" className="ml-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                        !
                    </Badge>
                )}
            </Button>

            {/* Görünüm Seçici */}
            <div className="hidden sm:flex items-center border rounded-lg p-0.5 shrink-0">
                <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onViewModeChange("grid")}
                >
                    <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onViewModeChange("list")}
                >
                    <List className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Sayfa Boyutu */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                >
                    <SelectTrigger className="h-9 w-[70px] px-2 text-xs justify-between bg-white dark:bg-gray-900 border-0 shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-gray-800">
                        <span className="truncate">{itemsPerPage}</span>
                    </SelectTrigger>
                    <SelectContent>
                        {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                                {size} {t("products.perPage")}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Menü (Mobil & Masaüstü için ortak drop) */}
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem className="gap-2" onClick={onOpenImportExport}>
                        <FileDown className="w-4 h-4 text-violet-600" />
                        {t("importExport.title")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2" onClick={onOpenBulkImageUpload}>
                        <ImageIcon className="w-4 h-4" />
                        {t("products.bulkImageUpload")}
                    </DropdownMenuItem>
                    {selectedCount > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                {t("products.productsSelected", { count: selectedCount })}
                            </DropdownMenuLabel>
                            <DropdownMenuItem className="gap-2" onClick={onOpenBulkPriceUpdate}>
                                <Percent className="w-4 h-4 text-blue-600" />
                                {t("products.bulkPriceUpdate")}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={onBulkDelete}>
                                <Trash2 className="w-4 h-4" />
                                {t("products.deleteSelected")}
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2" onClick={onAddTestProducts}>
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {t("products.addTestProducts")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* + Ürün Ekle Butonu */}
            <Button
                onClick={onAddProduct}
                size="sm"
                className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20 shrink-0"
            >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t("products.addProduct")}</span>
            </Button>
        </div>
    )
}
