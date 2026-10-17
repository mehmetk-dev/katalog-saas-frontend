"use client"

import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, Copy, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Product, ProductViewProps } from "../types"

interface ProductActionsMenuProps {
    product: Product
    index: number
    total: number
    view: Pick<
        ProductViewProps,
        "t" | "isPending" | "canReorder" | "isFirstPage" | "isLastPage" | "onEdit" | "handleDuplicate" | "initiateDelete" | "setPreviewProduct" | "moveProduct"
    >
    triggerClassName?: string
}

/** Liste ve ızgara görünümünün ortak "⋯" menüsü. Manuel sıradayken taşıma seçeneklerini de içerir. */
export function ProductActionsMenu({ product, index, total, view, triggerClassName }: ProductActionsMenuProps) {
    const { t, isPending, canReorder, isFirstPage, isLastPage } = view
    const isFirst = index === 0
    const isLast = index === total - 1

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn("text-muted-foreground", triggerClassName)}
                    aria-label={t("products.actions")}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => view.setPreviewProduct(product)}>
                    <Eye /> {t("products.preview")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => view.onEdit(product)}>
                    <Pencil /> {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => view.handleDuplicate(product)} disabled={isPending}>
                    <Copy /> {t("products.duplicate")}
                </DropdownMenuItem>
                {canReorder && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t("products.reorder.menuLabel")}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => view.moveProduct(product.id, "top")} disabled={isFirstPage && isFirst}>
                            <ArrowUpToLine /> {t("products.reorder.toTop")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => view.moveProduct(product.id, "up")} disabled={isFirst}>
                            <ArrowUp /> {t("products.reorder.up")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => view.moveProduct(product.id, "down")} disabled={isLast}>
                            <ArrowDown /> {t("products.reorder.down")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => view.moveProduct(product.id, "bottom")} disabled={isLastPage && isLast}>
                            <ArrowDownToLine /> {t("products.reorder.toBottom")}
                        </DropdownMenuItem>
                    </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => view.initiateDelete(product.id)}>
                    <Trash2 /> {t("common.delete")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
