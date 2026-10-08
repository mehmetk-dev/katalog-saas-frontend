"use client"

import React, { useMemo, useCallback } from "react"
import { Check, GripVertical, PackagePlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import type { Product } from "@/lib/actions/products"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { MAX_CATALOG_PRODUCTS } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils/helpers"
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
        <button
            type="button"
            onClick={() => onToggle(product.id)}
            aria-pressed={isSelected}
            aria-label={product.name}
            className="group flex min-w-0 flex-col gap-1.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className={cn(
                "relative aspect-square w-full overflow-hidden rounded-lg border bg-muted transition-shadow",
                isSelected ? "border-transparent ring-2 ring-primary ring-offset-2 ring-offset-background" : "group-hover:border-ring"
            )}>
                <ProductImageGallery
                    product={product}
                    className="h-full w-full"
                    imageClassName="object-cover"
                    showNavigation={false}
                    showImageCount={false}
                    interactive={false}
                />
                <span className={cn(
                    "absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full border shadow-sm transition-all",
                    isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background/90 text-transparent opacity-0 group-hover:opacity-100"
                )}>
                    <Check className="size-3" strokeWidth={3} />
                </span>
            </div>
            <div className="min-w-0 px-0.5">
                <p className="truncate text-xs font-medium text-foreground">{product.name}</p>
                <p className="truncate text-xs text-muted-foreground tabular-nums">
                    {product.price ? formatCurrency(product.price) : "—"}
                </p>
            </div>
        </button>
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
                "group flex h-12 items-center gap-2 bg-card px-2 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted",
                isDragging && "opacity-40",
                isDropTarget && "shadow-[inset_0_2px_0_0_var(--primary)]"
            )}
        >
            <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/50 group-hover:text-muted-foreground active:cursor-grabbing" />
            <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{index + 1}</span>
            <div className="relative size-8 shrink-0 overflow-hidden rounded border bg-muted">
                <ProductImageGallery
                    product={product}
                    className="h-full w-full"
                    showNavigation={false}
                    showImageCount={false}
                    interactive={false}
                />
            </div>
            <p className="min-w-0 flex-1 truncate text-sm text-foreground">{product.name}</p>
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemove(product.id)}
                className="shrink-0 text-muted-foreground opacity-60 hover:text-destructive group-hover:opacity-100"
                aria-label={t('builder.removeProduct') as string}
                title={t('builder.removeProduct') as string}
            >
                <X className="size-4" />
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
            variant="outline"
            size="sm"
            className="h-8 shrink-0"
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
        <div className="flex flex-col items-center justify-center gap-1 px-6 py-8 text-center">
            <PackagePlus className="mb-1 size-6 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">{t('builder.noProductsSelected')}</p>
            <p className="text-xs text-muted-foreground">{t('builder.noProductsSelectedHint')}</p>
        </div>
    )
}
