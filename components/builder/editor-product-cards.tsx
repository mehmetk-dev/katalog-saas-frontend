"use client"

import React, { useMemo, useCallback } from "react"
import { GripVertical, Trash2, CheckSquare, Package } from "lucide-react"
import NextImage from "next/image"

import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/actions/products"
import { cn } from "@/lib/utils"

// PERFORMANCE: Memoized product card to avoid re-rendering all cards when one is toggled
export const ProductCard = React.memo(function ProductCard({
    product,
    isSelected,
    onToggle,
}: {
    product: Product
    isSelected: boolean
    onToggle: (id: string) => void
}) {
    return (
        <div
            onClick={() => onToggle(product.id)}
            className={cn(
                "relative group cursor-pointer transition-all duration-300",
                isSelected ? "scale-[0.98]" : "hover:scale-[1.02]"
            )}
        >
            <div className={cn(
                "aspect-[4/5] rounded-[1.25rem] overflow-hidden border transition-all duration-300 shadow-sm bg-white dark:bg-slate-900 relative",
                isSelected
                    ? "border-indigo-600 ring-2 ring-indigo-600/20"
                    : "border-slate-100 dark:border-slate-800 hover:shadow-md"
            )}>
                <div className="absolute inset-0">
                    <NextImage
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className={cn(
                            "object-cover transition-all duration-500",
                            isSelected ? "scale-105" : "group-hover:scale-110"
                        )}
                        unoptimized
                    />
                    <div className={cn(
                        "absolute inset-0 transition-opacity duration-300",
                        isSelected ? "bg-indigo-600/10 opacity-100" : "bg-black/0 group-hover:bg-black/10 opacity-0"
                    )} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent h-1/2 opacity-70" />
                </div>

                {/* Top Indicator */}
                <div className="absolute top-2 right-2">
                    <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md",
                        isSelected
                            ? "bg-indigo-600 text-white scale-110"
                            : "bg-white/90 dark:bg-slate-800/90 text-transparent opacity-0 group-hover:opacity-100"
                    )}>
                        <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5">
                    <p className="text-[10px] sm:text-xs font-black text-white truncate drop-shadow-sm uppercase tracking-tight">
                        {product.name}
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] sm:text-[10px] font-bold text-white/90 drop-shadow-sm">
                            {product.price ? `₺${product.price}` : "-"}
                        </span>
                        {product.sku && (
                            <span className="text-[8px] font-medium text-white/60 bg-black/20 px-1 rounded truncate max-w-[50px]">
                                {product.sku}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
})

// PERFORMANCE: Memoized sortable product item for drag-and-drop section
export const SortableProductItem = React.memo(function SortableProductItem({
    product,
    index,
    draggingIndex,
    dropIndex,
    onDragStart,
    onDragOver,
    onDrop,
    onRemove,
}: {
    product: Product
    index: number
    draggingIndex: number | null
    dropIndex: number | null
    onDragStart: (e: React.DragEvent, index: number) => void
    onDragOver: (e: React.DragEvent, index: number) => void
    onDrop: (e: React.DragEvent, index: number) => void
    onRemove: (id: string) => void
}) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            className={cn(
                "flex items-center gap-3 p-2 bg-card rounded-lg border border-border shadow-sm transition-all group",
                draggingIndex === index && "opacity-50 scale-95 border-dashed border-primary pre-drag",
                dropIndex === index && draggingIndex !== index && "border-primary ring-2 ring-primary/10"
            )}
        >
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 group-hover:text-muted-foreground shrink-0">
                <GripVertical className="w-3.5 h-3.5" />
            </div>
            <div className="w-8 h-8 rounded shrink-0 border border-border overflow-hidden relative">
                <NextImage src={product.image_url || "/placeholder.svg"} alt={product.name} fill className="object-cover" unoptimized />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate text-foreground">{product.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onRemove(product.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
            </Button>
        </div>
    )
})

// PERFORMANCE: Memoized SelectAll button to avoid O(n) .every() on each render
export const SelectAllButton = React.memo(function SelectAllButton({
    filteredProducts,
    selectedProductIdSet,
    selectedProductIds,
    onSelectedProductIdsChange,
    t,
}: {
    filteredProducts: Product[]
    selectedProductIdSet: Set<string>
    selectedProductIds: string[]
    onSelectedProductIdsChange: (ids: string[]) => void
    t: (key: string) => string
}) {
    const isAllSelected = useMemo(
        () => filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIdSet.has(p.id)),
        [filteredProducts, selectedProductIdSet]
    )

    const handleClick = useCallback(() => {
        const filteredIdSet = new Set(filteredProducts.map(p => p.id))
        if (isAllSelected) {
            onSelectedProductIdsChange(selectedProductIds.filter(id => !filteredIdSet.has(id)))
        } else {
            onSelectedProductIdsChange([...new Set([...selectedProductIds, ...filteredProducts.map(p => p.id)])])
        }
    }, [filteredProducts, isAllSelected, selectedProductIds, onSelectedProductIdsChange])

    return (
        <Button
            variant="ghost"
            size="sm"
            className={cn(
                "h-11 rounded-2xl border border-slate-200/60 bg-white font-black text-[10px] uppercase px-4 transition-all",
                isAllSelected
                    ? "text-destructive hover:bg-destructive/5"
                    : "text-indigo-600 hover:bg-indigo-50"
            )}
            onClick={handleClick}
        >
            {isAllSelected ? t('builder.clearSelection') : t('builder.selectAll')}
        </Button>
    )
})

// Empty state component for the sorting area
export function EmptySortingState() {
    return (
        <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
            <Package className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs font-medium">Henüz ürün seçilmedi</p>
        </div>
    )
}
