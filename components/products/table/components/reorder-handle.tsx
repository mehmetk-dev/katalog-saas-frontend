"use client"

import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Product, ProductViewProps } from "../types"

interface ReorderHandleProps {
    product: Product
    view: Pick<ProductViewProps, "t" | "handleDragStart" | "handleDragEnd" | "handleHandleKeyDown">
    className?: string
}

/**
 * Sürükle-bırak tutamacı. Yalnızca bu öğe sürüklenebilir (satırın tamamı değil),
 * böylece metin seçimi ve tıklamalar bozulmaz. Odaklanınca ok tuşları / Home / End ile taşır.
 */
export function ReorderHandle({ product, view, className }: ReorderHandleProps) {
    const label = view.t("products.reorder.handleLabel", { name: product.name })
    return (
        <button
            type="button"
            draggable
            data-reorder-handle={product.id}
            onDragStart={(e) => view.handleDragStart(e, product.id)}
            onDragEnd={view.handleDragEnd}
            onKeyDown={(e) => view.handleHandleKeyDown(e, product.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={label}
            title={view.t("products.reorder.handleHint")}
            className={cn(
                "flex cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 outline-none transition-colors",
                "hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
                className
            )}
        >
            <GripVertical className="size-4" />
        </button>
    )
}
