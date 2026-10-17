"use client"

import { BookPlus, Boxes, FileDown, Loader2, MoreHorizontal, Percent, Tag, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

interface ProductsBulkActionsBarProps {
    selectedCount: number
    onClearSelection: () => void
    onBulkPriceUpdate: () => void
    onBulkCategory: () => void
    onBulkStock: () => void
    onAddToCatalog: () => void
    onExportSelected: () => void
    onBulkDelete: () => void
    isPending: boolean
}

const BAR_BUTTON = "h-9 gap-2 px-2.5 sm:px-3 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"

/** Seçim yapılınca ekranın altında beliren toplu işlem çubuğu */
export function ProductsBulkActionsBar({
    selectedCount,
    onClearSelection,
    onBulkPriceUpdate,
    onBulkCategory,
    onBulkStock,
    onAddToCatalog,
    onExportSelected,
    onBulkDelete,
    isPending,
}: ProductsBulkActionsBarProps) {
    const { t: baseT } = useTranslation()
    const t = (key: string, params?: Record<string, unknown>) => baseT(key, params) as string

    if (selectedCount === 0) return null

    const primaryActions = [
        { key: "price", icon: Percent, label: t("products.price"), title: t("products.bulkPriceUpdate"), onClick: onBulkPriceUpdate },
        { key: "category", icon: Tag, label: t("filters.category"), title: t("products.bulkEdit.categoryTitle"), onClick: onBulkCategory },
        { key: "catalog", icon: BookPlus, label: t("products.bulkEdit.addToCatalogShort"), title: t("products.bulkEdit.catalogTitle"), onClick: onAddToCatalog },
    ]

    return (
        <div
            role="toolbar"
            aria-label={t("products.bulkEdit.toolbarLabel")}
            className="fixed inset-x-3 bottom-4 z-50 flex justify-center duration-300 animate-in slide-in-from-bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-6"
        >
            <div className="flex max-w-full items-center gap-0.5 rounded-full border border-primary bg-primary py-1.5 pl-3 pr-1.5 shadow-2xl sm:gap-1 sm:pl-4">
                <span className="mr-1 flex items-center gap-2 whitespace-nowrap text-sm font-medium tabular-nums text-primary-foreground">
                    {isPending && <Loader2 className="size-3.5 animate-spin" />}
                    {/* Dar ekranda yalnızca sayı; metin ekran okuyucuya kalır */}
                    <span className="sm:hidden" aria-hidden>{selectedCount}</span>
                    <span className="sr-only sm:not-sr-only">{t("products.selected", { count: selectedCount })}</span>
                </span>
                <div className="mx-0.5 h-5 w-px bg-primary-foreground/20 sm:mx-1" />

                {primaryActions.map(({ key, icon: Icon, label, title, onClick }) => (
                    <Button key={key} variant="ghost" size="sm" className={BAR_BUTTON} onClick={onClick} disabled={isPending} title={title} aria-label={title}>
                        <Icon className="size-4" />
                        <span className="hidden lg:inline">{label}</span>
                    </Button>
                ))}

                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={cn(BAR_BUTTON, "w-9 px-0")} disabled={isPending} aria-label={t("products.moreTools")} title={t("products.moreTools")}>
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" side="top" className="w-52">
                        <DropdownMenuItem onClick={onBulkStock}>
                            <Boxes />
                            {t("products.bulkEdit.stockTitle")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onExportSelected}>
                            <FileDown />
                            {t("products.bulkEdit.exportSelected")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(BAR_BUTTON, "hover:bg-destructive hover:text-destructive-foreground")}
                    onClick={onBulkDelete}
                    disabled={isPending}
                    title={t("products.deleteSelected")}
                    aria-label={t("products.deleteSelected")}
                >
                    <Trash2 className="size-4" />
                    <span className="hidden lg:inline">{t("common.delete")}</span>
                </Button>

                <div className="mx-0.5 h-5 w-px bg-primary-foreground/20 sm:mx-1" />
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-9 rounded-full p-0 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    onClick={onClearSelection}
                    aria-label={t("products.clearSelection")}
                    title={t("products.clearSelection")}
                >
                    <X className="size-4" />
                </Button>
            </div>
        </div>
    )
}
