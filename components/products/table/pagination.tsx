"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

interface ProductsPaginationProps {
    currentPage: number
    totalPages: number
    itemsPerPage: number
    totalItems: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (size: number) => void
    pageSizeOptions: number[]
}

/** Görünen sayfa numaraları: ilk, son, mevcut ±1; aralar "…" */
function getPageItems(current: number, total: number): Array<number | "gap"> {
    const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total))
    const sorted = [...pages].sort((a, b) => a - b)
    const items: Array<number | "gap"> = []
    sorted.forEach((page, i) => {
        if (i > 0 && page - sorted[i - 1] > 1) items.push("gap")
        items.push(page)
    })
    return items
}

export function ProductsPagination({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange,
    pageSizeOptions,
}: ProductsPaginationProps) {
    const { t: baseT } = useTranslation()
    const t = (key: string, params?: Record<string, unknown>) => baseT(`products.pagination.${key}`, params) as string

    // Ürün yoksa sayfalama gösterilmez ("0 üründen 1-0" gibi anlamsız metin olmasın)
    if (totalItems === 0 || totalPages === 0) return null

    const from = (currentPage - 1) * itemsPerPage + 1
    const to = Math.min(currentPage * itemsPerPage, totalItems)
    const isFirst = currentPage <= 1
    const isLast = currentPage >= totalPages

    return (
        <nav aria-label="pagination" className="mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="tabular-nums">{t("range", { total: totalItems, from, to })}</span>
                <div className="hidden items-center gap-2 sm:flex">
                    <span className="text-xs">{t("perPage")}</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(parseInt(value))}>
                        <SelectTrigger size="sm" className="w-[72px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" className="hidden sm:inline-flex" onClick={() => onPageChange(1)} disabled={isFirst} aria-label={t("first")} title={t("first")}>
                        <ChevronsLeft className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(currentPage - 1)} disabled={isFirst} aria-label={t("previous")} title={t("previous")}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    {getPageItems(currentPage, totalPages).map((item, i) =>
                        item === "gap" ? (
                            <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                        ) : (
                            <Button
                                key={item}
                                variant={item === currentPage ? "default" : "ghost"}
                                size="icon-sm"
                                className={cn("tabular-nums", item === currentPage && "pointer-events-none")}
                                onClick={() => onPageChange(item)}
                                aria-label={t("page", { page: item })}
                                aria-current={item === currentPage ? "page" : undefined}
                            >
                                {item}
                            </Button>
                        )
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(currentPage + 1)} disabled={isLast} aria-label={t("next")} title={t("next")}>
                        <ChevronRight className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="hidden sm:inline-flex" onClick={() => onPageChange(totalPages)} disabled={isLast} aria-label={t("last")} title={t("last")}>
                        <ChevronsRight className="size-4" />
                    </Button>
                </div>
            )}
        </nav>
    )
}
