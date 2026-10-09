"use client"

import React from "react"
import Link from "next/link"
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronLeft, ChevronRight, Package, Search, SearchX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Product, ProductSortField, ProductSortOrder } from "@/lib/actions/products"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { ProductCard, SortableProductItem, SelectAllButton, EmptySortingState } from "./editor-product-cards"

interface EditorContentTabProps {
    // Translation function
    t: (key: string, params?: Record<string, unknown>) => string

    // Catalog details
    description: string
    onDescriptionChange: (desc: string) => void
    availableProductCount: number
    totalProductCount?: number
    isProductListTruncated?: boolean

    // Search & Filter
    searchQuery: string
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    selectedCategory: string
    onCategoryChange: (category: string) => void
    categories: string[]
    sortBy: ProductSortField
    onSortByChange: (value: ProductSortField) => void
    sortOrder: ProductSortOrder
    onSortOrderChange: (value: ProductSortOrder) => void

    // Products
    filteredProducts: Product[]
    allProductIds: string[]
    visibleProducts: Product[]
    selectedProductIds: string[]
    selectedProductIdSet: Set<string>
    validProductIds: string[]
    onSelectedProductIdsChange: (ids: string[]) => void
    toggleProduct: (id: string) => void
    /** PERF(O2): Click-only lazy fetch for the active filter. */
    onPrefetchAllProductIds?: () => Promise<string[]>

    // Pagination
    currentPage: number
    totalPages: number
    startIndex: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    isLoadingProducts?: boolean
    isLoadingAllProductIds?: boolean

    // Sorting / Drag-and-drop
    productMap: Map<string, Product>
    draggingIndex: number | null
    dropIndex: number | null
    onSortDragStart: (e: React.DragEvent, index: number) => void
    onSortDragOver: (e: React.DragEvent, index: number) => void
    onSortDrop: (e: React.DragEvent, index: number) => void
    onSortMove: (index: number, direction: -1 | 1) => void
    onRemoveProduct: (id: string) => void
}

export const EditorContentTab = React.memo(function EditorContentTab({
    t,
    description,
    onDescriptionChange,
    availableProductCount,
    totalProductCount,
    isProductListTruncated = false,
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    categories,
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderChange,
    filteredProducts,
    allProductIds,
    visibleProducts,
    selectedProductIds,
    selectedProductIdSet,
    validProductIds,
    onSelectedProductIdsChange,
    toggleProduct,
    onPrefetchAllProductIds,
    currentPage,
    totalPages,
    startIndex,
    itemsPerPage,
    onPageChange,
    isLoadingProducts = false,
    isLoadingAllProductIds = false,
    productMap,
    draggingIndex,
    dropIndex,
    onSortDragStart,
    onSortDragOver,
    onSortDrop,
    onSortMove,
    onRemoveProduct,
}: EditorContentTabProps) {
    const SORT_VIRTUALIZATION_THRESHOLD = 120
    const SORT_ROW_HEIGHT = 48 // Satır yüksekliği (h-12)
    const SORT_OVERSCAN_ROWS = 4

    const sortListRef = React.useRef<HTMLDivElement>(null)
    const [sortScrollTop, setSortScrollTop] = React.useState(0)
    const [sortViewportHeight, setSortViewportHeight] = React.useState(320)
    const sortColumns = 1

    const hasVirtualizedSorting = validProductIds.length > SORT_VIRTUALIZATION_THRESHOLD

    const sortableEntries = React.useMemo(
        () => validProductIds.map((id, index) => ({ id, index })),
        [validProductIds]
    )

    const sortableRows = React.useMemo(() => {
        const rows: Array<Array<{ id: string; index: number }>> = []
        for (let i = 0; i < sortableEntries.length; i += sortColumns) {
            rows.push(sortableEntries.slice(i, i + sortColumns))
        }
        return rows
    }, [sortableEntries, sortColumns])

    const visibleRowCount = Math.max(1, Math.ceil(sortViewportHeight / SORT_ROW_HEIGHT))
    const virtualStartRow = hasVirtualizedSorting
        ? Math.max(0, Math.floor(sortScrollTop / SORT_ROW_HEIGHT) - SORT_OVERSCAN_ROWS)
        : 0
    const virtualEndRow = hasVirtualizedSorting
        ? Math.min(sortableRows.length, virtualStartRow + visibleRowCount + SORT_OVERSCAN_ROWS * 2)
        : sortableRows.length
    const virtualRows = sortableRows.slice(virtualStartRow, virtualEndRow)
    const virtualOffsetY = virtualStartRow * SORT_ROW_HEIGHT
    const virtualTotalHeight = sortableRows.length * SORT_ROW_HEIGHT
    const approxRenderedItems = Math.min(
        validProductIds.length,
        (visibleRowCount + SORT_OVERSCAN_ROWS * 2) * sortColumns
    )

    const updateSortViewportMetrics = React.useCallback(() => {
        if (sortListRef.current) {
            setSortViewportHeight(sortListRef.current.clientHeight || 320)
        }
    }, [])

    React.useEffect(() => {
        updateSortViewportMetrics()
        window.addEventListener('resize', updateSortViewportMetrics)
        return () => window.removeEventListener('resize', updateSortViewportMetrics)
    }, [updateSortViewportMetrics])

    React.useEffect(() => {
        if (sortListRef.current && hasVirtualizedSorting) {
            setSortViewportHeight(sortListRef.current.clientHeight || 320)
        }
    }, [hasVirtualizedSorting])

    // PERF(Y2): rAF throttle — scroll event her frame setState tetiklemesin,
    // 120+ seçili üründe virtualizasyon açıkken ana thread'de jank'ı engeller.
    const scrollRafRef = React.useRef<number>(0)
    const handleSortListScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        if (!hasVirtualizedSorting) return
        const st = e.currentTarget.scrollTop
        cancelAnimationFrame(scrollRafRef.current)
        scrollRafRef.current = requestAnimationFrame(() => setSortScrollTop(st))
    }, [hasVirtualizedSorting])

    React.useEffect(() => {
        return () => cancelAnimationFrame(scrollRafRef.current)
    }, [])

    const renderSortable = (id: string, index: number) => {
        const product = productMap.get(id)
        if (!product) return null
        return (
            <SortableProductItem
                key={id}
                product={product}
                index={index}
                draggingIndex={draggingIndex}
                dropIndex={dropIndex}
                onDragStart={onSortDragStart}
                onDragOver={onSortDragOver}
                onDrop={onSortDrop}
                onMove={onSortMove}
                onRemove={onRemoveProduct}
            />
        )
    }

    const total = totalProductCount ?? filteredProducts.length

    return (
        <div className="space-y-8">
            {/* Açıklama */}
            <section className="space-y-2">
                <Label htmlFor="catalog-description">{t('builder.descriptionLabel')}</Label>
                <Textarea
                    id="catalog-description"
                    rows={3}
                    className="resize-none"
                    placeholder={t('builder.descriptionPlaceholder')}
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t('builder.descriptionHint')}</p>
            </section>

            {/* Katalogdaki ürünler — sıralama */}
            <section className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            {t('builder.catalogProductsTitle')}
                            <Badge variant="secondary" className="tabular-nums">{validProductIds.length}</Badge>
                        </h3>
                        {validProductIds.length > 1 && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{t('builder.dragToReorder')}</p>
                        )}
                    </div>
                    {validProductIds.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectedProductIdsChange([])}
                            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                            {t('builder.clearSelection')}
                        </Button>
                    )}
                </div>

                <div className="overflow-hidden rounded-lg border">
                    {hasVirtualizedSorting && (
                        <p className="border-b bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                            {t('builder.virtualListMode')}: {t('builder.virtualListRendering', { total: validProductIds.length, rendered: approxRenderedItems })}
                        </p>
                    )}
                    <div
                        ref={sortListRef}
                        onScroll={handleSortListScroll}
                        role="list"
                        className="custom-scrollbar max-h-80 overflow-y-auto"
                    >
                        {validProductIds.length === 0 ? (
                            <EmptySortingState />
                        ) : hasVirtualizedSorting ? (
                            <div style={{ height: `${virtualTotalHeight}px`, position: 'relative' }}>
                                <div
                                    className="absolute inset-x-0 top-0 divide-y"
                                    style={{ transform: `translateY(${virtualOffsetY}px)` }}
                                >
                                    {virtualRows.flat().map(({ id, index }) => renderSortable(id, index))}
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {validProductIds.map((id, index) => renderSortable(id, index))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Ürün ekle */}
            <section className="@container space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground">{t('builder.addProductsTitle')}</h3>
                    <span className="text-xs text-muted-foreground tabular-nums">{t('builder.productCount', { count: total })}</span>
                </div>

                {isProductListTruncated && (
                    <div className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning-soft-foreground">
                        {t('builder.bigCatalogMode')}: {t('builder.bigCatalogLoaded', { count: availableProductCount })}
                        {totalProductCount ? ` / ${t('builder.bigCatalogTotal', { total: totalProductCount })}` : ""}. {t('builder.bigCatalogPerf')}
                    </div>
                )}

                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t('builder.searchProducts')}
                        value={searchQuery}
                        onChange={onSearchChange}
                        className="pl-9"
                        aria-label={t('builder.searchProducts')}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select value={selectedCategory} onValueChange={onCategoryChange}>
                        <SelectTrigger size="sm" className="min-w-0 flex-1 basis-32" aria-label={t('common.category')}>
                            <SelectValue placeholder={t('common.category')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(value) => onSortByChange(value as ProductSortField)}>
                        <SelectTrigger size="sm" className="min-w-0 flex-1 basis-32" aria-label={t('common.sort')}>
                            <SelectValue placeholder={t('common.sort')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="display_order">{t('builder.sortDisplayOrder')}</SelectItem>
                            <SelectItem value="created_at">{t('builder.sortCreatedAt')}</SelectItem>
                            <SelectItem value="name">{t('builder.sortName')}</SelectItem>
                            <SelectItem value="price">{t('builder.sortPrice')}</SelectItem>
                            <SelectItem value="stock">{t('builder.sortStock')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        className="size-8 shrink-0"
                        onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
                        title={`${t('builder.sortDirection')}: ${sortOrder === "asc" ? t('builder.sortAscending') : t('builder.sortDescending')}`}
                        aria-label={`${t('builder.sortDirection')}: ${sortOrder === "asc" ? t('builder.sortAscending') : t('builder.sortDescending')}`}
                    >
                        {sortOrder === "asc" ? <ArrowUpNarrowWide className="size-4" /> : <ArrowDownWideNarrow className="size-4" />}
                    </Button>
                    <SelectAllButton
                        allProductIds={allProductIds}
                        selectedProductIdSet={selectedProductIdSet}
                        selectedProductIds={selectedProductIds}
                        onSelectedProductIdsChange={onSelectedProductIdsChange}
                        isLoadingAllProductIds={isLoadingAllProductIds}
                        onPrefetchAllProductIds={onPrefetchAllProductIds}
                        t={t}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3 @sm:grid-cols-3 @xl:grid-cols-4 @3xl:grid-cols-5">
                    {isLoadingProducts && visibleProducts.length === 0 && (
                        <div className="col-span-full rounded-lg border bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
                            {t('common.loading')}
                        </div>
                    )}
                    {!isLoadingProducts && visibleProducts.length === 0 && (
                        searchQuery.trim() || selectedCategory !== "all" ? (
                            <EmptyState
                                className="col-span-full py-8"
                                icon={SearchX}
                                title={t('builder.noMatchingProducts')}
                                description={t('builder.noMatchingProductsHint')}
                            />
                        ) : (
                            <EmptyState
                                className="col-span-full py-8"
                                icon={Package}
                                title={t('builder.noAccountProducts')}
                                description={t('builder.noAccountProductsHint')}
                                action={
                                    <Button asChild size="sm">
                                        <Link href="/dashboard/products">{t('builder.goToProducts')}</Link>
                                    </Button>
                                }
                            />
                        )
                    )}
                    {visibleProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isSelected={selectedProductIdSet.has(product.id)}
                            onToggle={toggleProduct}
                        />
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-xs text-muted-foreground">
                            {t('builder.productsFromTo', {
                                total,
                                from: filteredProducts.length ? startIndex + 1 : 0,
                                to: Math.min(startIndex + itemsPerPage, total),
                            })}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                aria-label={t('common.back')}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                aria-label={t('common.next')}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
})
