"use client"

import { Search, X, Filter, LayoutGrid, List, MoreHorizontal, FileDown, Image as ImageIcon, Sparkles, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { useTranslation } from "@/lib/i18n-provider"
import { cn } from "@/lib/utils"

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
    onAddTestProducts,
    onAddProduct
}: ProductsToolbarProps) {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl p-1.5 shadow-sm border border-gray-200 dark:border-gray-800">
            {/* Tümünü Seç Checkbox */}
            <div className="flex items-center justify-center h-8 w-8 shrink-0">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Checkbox
                            checked={selectedCount > 0 && selectedCount === totalFilteredCount}
                            onCheckedChange={onSelectAll}
                            className="h-4 w-4 border-gray-300 dark:border-gray-700 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                        />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        {selectedCount > 0 ? (t("products.selected", { count: selectedCount }) as string) : (t("products.selectAll") as string)}
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Arama - Compact */}
            <div className="relative flex-1 min-w-0 max-w-[200px] group transition-all focus-within:max-w-[280px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground transition-colors group-focus-within:text-violet-500" />
                <Input
                    placeholder={t("products.searchPlaceholder") as string}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-8 pr-8 h-8 text-[11px] border-0 bg-gray-50 dark:bg-gray-800 focus-visible:ring-1 focus-visible:ring-violet-500/20 rounded-lg placeholder:text-muted-foreground/60"
                />
                {search && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Ayırıcı - sadece desktop */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 hidden sm:block mx-1" />

            {/* Görünüm Seçici - her zaman görünsün (mobil dahil) */}
            <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-0.5 h-8 shrink-0">
                <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className={cn("h-7 w-7 transition-all", viewMode === "grid" && "bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm")}
                    onClick={() => onViewModeChange("grid")}
                >
                    <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className={cn("h-7 w-7 transition-all", viewMode === "list" && "bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm")}
                    onClick={() => onViewModeChange("list")}
                >
                    <List className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Sayfa Boyutu - sadece desktop */}
            <div className="hidden sm:block shrink-0">
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                >
                    <SelectTrigger className="h-8 w-[64px] px-1.5 text-[10px] font-bold bg-gray-50 dark:bg-gray-800 border-0 shadow-none focus:ring-violet-500/20">
                        <span>{itemsPerPage}</span>
                    </SelectTrigger>
                    <SelectContent>
                        {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={size.toString()} className="text-[10px]">
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Filtre Butonu - her zaman görünsün */}
            <Button
                variant={hasActiveFilters ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                    "gap-1 h-8 px-2 transition-all shrink-0",
                    hasActiveFilters ? "bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" : "text-muted-foreground"
                )}
                onClick={onOpenFilters}
            >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px] font-semibold">{t("products.filterBy") as string}</span>
                {hasActiveFilters && (
                    <Badge variant="default" className="h-4 min-w-[16px] px-0.5 bg-violet-600 text-[8px] flex items-center justify-center">
                        !
                    </Badge>
                )}
            </Button>

            {/* Boşluk */}
            <div className="flex-1" />

            {/* İşlemler Dropdown - HER ZAMAN görünsün (mobil dahil) */}
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[11px] font-bold text-muted-foreground/80 border-gray-200 dark:border-gray-800 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">{t("common.actions") as string || "İşlemler"}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5">
                    <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                        {t("common.actions") as string || "Dosya İşlemleri"}
                    </DropdownMenuLabel>
                    <DropdownMenuItem className="gap-2.5 py-2.5 cursor-pointer rounded-lg" onClick={onOpenImportExport}>
                        <FileDown className="w-4 h-4 text-violet-600" />
                        <span className="font-medium text-sm">{t("importExport.title") as string}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2.5 py-2.5 cursor-pointer rounded-lg" onClick={onOpenBulkImageUpload}>
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm">{t("products.bulkImageUpload") as string}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1.5" />

                    <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                        {t("products.tools") as string || "Araçlar"}
                    </DropdownMenuLabel>
                    <DropdownMenuItem className="gap-2.5 py-2.5 cursor-pointer rounded-lg" onClick={onAddTestProducts}>
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="font-medium text-sm">{t("products.addTestProducts") as string}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* + Ürün Ekle - Primary - HER ZAMAN görünsün */}
            <Button
                onClick={onAddProduct}
                size="sm"
                className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shrink-0 h-8 px-3 transition-all font-bold text-[11px]"
            >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("products.addProduct") as string}</span>
            </Button>
        </div>
    )
}
