"use client"

import React, { useMemo, useCallback } from "react"
import { GripVertical, Trash2, CheckSquare, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import type { Product } from "@/lib/actions/products"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { MAX_CATALOG_PRODUCTS } from "@/lib/constants"
import { toast } from "sonner"

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
            role="button"
            tabIndex={0}
            onClick={() => onToggle(product.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(product.id) } }}
            aria-pressed={isSelected}
            aria-label={product.name}
            className={cn(
                "relative group cursor-pointer transition-all duration-200",
                isSelected ? "scale-[0.97]" : "hover:scale-[1.03]"
            )}
        >
            <div className={cn(
                "aspect-[1/1.15] rounded-xl overflow-hidden border transition-all duration-200 shadow-sm bg-white dark:bg-slate-900 relative",
                isSelected
                    ? "border-indigo-600 ring-2 ring-indigo-600/20"
                    : "border-slate-100 dark:border-slate-800 hover:shadow-md"
            )}>
                <div className="absolute inset-0">
                    <ProductImageGallery
                        product={product}
                        className="w-full h-full"
                        imageClassName={cn(
                            "object-cover transition-all duration-300",
                            isSelected ? "scale-105" : "group-hover:scale-110"
                        )}
                        showNavigation={false}
                        showImageCount={false}
                        interactive={false}
                    />
                    <div className={cn(
                        "absolute inset-0 transition-opacity duration-200",
                        isSelected ? "bg-indigo-600/10 opacity-100" : "bg-black/0 group-hover:bg-black/10 opacity-0"
                    )} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent h-1/2 opacity-70" />
                </div>

                {/* Top Indicator */}
                <div className="absolute top-1.5 right-1.5">
                    <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm",
                        isSelected
                            ? "bg-indigo-600 text-white scale-110"
                            : "bg-white/90 dark:bg-slate-800/90 text-transparent opacity-0 group-hover:opacity-100"
                    )}>
                        <CheckSquare className="w-3 h-3" />
                    </div>
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-col gap-0">
                    <p className="text-[8px] sm:text-[9px] font-black text-white truncate drop-shadow-sm uppercase tracking-tight leading-tight">
                        {product.name}
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-[7px] sm:text-[8px] font-bold text-white/90 drop-shadow-sm">
                            {product.price ? `₺${product.price}` : "-"}
                        </span>
                        {product.sku && (
                            <span className="text-[6px] font-medium text-white/60 bg-black/20 px-0.5 rounded truncate max-w-[40px]">
                                {product.sku}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
})

// PERF(F1): Custom areEqual — only re-render when THIS item's drag/drop state changes
export const SortableProductItem = React.memo(function SortableProductItem({
    product,
    index,
    draggingIndex,
    dropIndex,
    onDragStart,
    onDragOver,
    onDrop,
    onMove,
    onRemove,
}: {
    product: Product
    index: number
    draggingIndex: number | null
    dropIndex: number | null
    onDragStart: (e: React.DragEvent, index: number) => void
    onDragOver: (e: React.DragEvent, index: number) => void
    onDrop: (e: React.DragEvent, index: number) => void
    onMove: (index: number, direction: -1 | 1) => void
    onRemove: (id: string) => void
}) {
    const { t } = useTranslation()
    const isDragging = draggingIndex === index
    const isDropTarget = dropIndex === index && draggingIndex !== index

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            role="listitem"
            tabIndex={0}
            aria-label={`${product.name}. ${t('builder.keyboardReorder') as string}`}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    onMove(index, -1)
                } else if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    onMove(index, 1)
                }
            }}
            className={cn(
                "flex items-center gap-3 p-2 bg-card rounded-lg border border-border shadow-sm transition-all group",
                isDragging && "opacity-50 scale-95 border-dashed border-primary pre-drag",
                isDropTarget && "border-primary ring-2 ring-primary/10"
            )}
        >
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 group-hover:text-muted-foreground shrink-0">
                <GripVertical className="w-3.5 h-3.5" />
            </div>
            <div className="w-8 h-8 rounded shrink-0 border border-border overflow-hidden relative">
                <ProductImageGallery
                    product={product}
                    className="w-full h-full"
                    showNavigation={false}
                    showImageCount={false}
                    interactive={false}
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate text-foreground">{product.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onRemove(product.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
            </Button>
        </div>
    )
}, (prev, next) => {
    // Only rerender if THIS item's drag/drop state changes
    const prevIsDragging = prev.draggingIndex === prev.index
    const nextIsDragging = next.draggingIndex === next.index
    const prevIsDropTarget = prev.dropIndex === prev.index && prev.draggingIndex !== prev.index
    const nextIsDropTarget = next.dropIndex === next.index && next.draggingIndex !== next.index

    return (
        prev.product.id === next.product.id &&
        prev.index === next.index &&
        prevIsDragging === nextIsDragging &&
        prevIsDropTarget === nextIsDropTarget &&
        prev.onDragStart === next.onDragStart &&
        prev.onDragOver === next.onDragOver &&
        prev.onDrop === next.onDrop &&
        prev.onMove === next.onMove &&
        prev.onRemove === next.onRemove
    )
})

// PERFORMANCE: Memoized SelectAll button to avoid O(n) .every() on each render
export const SelectAllButton = React.memo(function SelectAllButton({
    allProductIds,
    selectedProductIdSet,
    selectedProductIds,
    onSelectedProductIdsChange,
    isLoadingAllProductIds = false,
    onPrefetchAllProductIds,
    t,
}: {
    allProductIds: string[]
    selectedProductIdSet: Set<string>
    selectedProductIds: string[]
    onSelectedProductIdsChange: (ids: string[]) => void
    isLoadingAllProductIds?: boolean
    /** PERF(O2): Fetches IDs lazily and returns the exact active-filter result. */
    onPrefetchAllProductIds?: () => Promise<string[]>
    t: (key: string) => string
}) {
    // Exact IDs are required: selected products outside the active filter make
    // count-based inference incorrect.
    const isAllSelected = useMemo(() => {
        return allProductIds.length > 0
            && allProductIds.every(id => selectedProductIdSet.has(id))
    }, [allProductIds, selectedProductIdSet])

    const handleClick = useCallback(async () => {
        if (isAllSelected) {
            const filteredIdSet = new Set(allProductIds)
            onSelectedProductIdsChange(
                selectedProductIds.filter((id) => !filteredIdSet.has(id))
            )
            return
        }

        let idsToSelect = allProductIds
        if (idsToSelect.length === 0) {
            try {
                idsToSelect = await onPrefetchAllProductIds?.() ?? []
            } catch {
                toast.error(t('builder.productIdsLoadFailed'))
                return
            }
        }

        const mergedIds = [...new Set([...selectedProductIds, ...idsToSelect])]
        if (mergedIds.length > MAX_CATALOG_PRODUCTS) {
            toast.error(t('builder.catalogProductLimit'))
            return
        }
        onSelectedProductIdsChange(mergedIds)
    }, [allProductIds, isAllSelected, selectedProductIds, onSelectedProductIdsChange, onPrefetchAllProductIds, t])

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
            disabled={isLoadingAllProductIds}
            aria-label={isAllSelected ? t('builder.clearSelection') : t('builder.selectAll')}
        >
            {isAllSelected ? t('builder.clearSelection') : t('builder.selectAll')}
        </Button>
    )
})

// Empty state component for the sorting area
export function EmptySortingState() {
    const { t } = useTranslation()
    return (
        <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
            <Package className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs font-medium">{t('builder.noProductsSelected')}</p>
        </div>
    )
}
