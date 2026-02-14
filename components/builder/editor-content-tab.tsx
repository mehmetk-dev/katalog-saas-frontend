"use client"

import React from "react"
import { Sparkles, Search } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/actions/products"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import { ProductCard, SortableProductItem, SelectAllButton, EmptySortingState } from "./editor-product-cards"

interface EditorContentTabProps {
    // Translation function
    t: (key: string, params?: Record<string, unknown>) => string

    // Catalog details
    description: string
    onDescriptionChange: (desc: string) => void

    // Search & Filter
    searchQuery: string
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    selectedCategory: string
    onCategoryChange: (category: string) => void
    categories: string[]

    // Products
    filteredProducts: Product[]
    visibleProducts: Product[]
    selectedProductIds: string[]
    selectedProductIdSet: Set<string>
    validProductIds: string[]
    onSelectedProductIdsChange: (ids: string[]) => void
    toggleProduct: (id: string) => void

    // Pagination
    currentPage: number
    totalPages: number
    startIndex: number
    itemsPerPage: number
    onPageChange: (page: number) => void

    // Sorting / Drag-and-drop
    productMap: Map<string, Product>
    draggingIndex: number | null
    dropIndex: number | null
    onSortDragStart: (e: React.DragEvent, index: number) => void
    onSortDragOver: (e: React.DragEvent, index: number) => void
    onSortDrop: (e: React.DragEvent, index: number) => void
    onRemoveProduct: (id: string) => void
}

export function EditorContentTab({
    t,
    description,
    onDescriptionChange,
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    categories,
    filteredProducts,
    visibleProducts,
    selectedProductIds,
    selectedProductIdSet,
    validProductIds,
    onSelectedProductIdsChange,
    toggleProduct,
    currentPage,
    totalPages,
    startIndex,
    itemsPerPage,
    onPageChange,
    productMap,
    draggingIndex,
    dropIndex,
    onSortDragStart,
    onSortDragOver,
    onSortDrop,
    onRemoveProduct,
}: EditorContentTabProps) {
    const INITIAL_SORT_RENDER_COUNT = 120
    const SORT_RENDER_STEP = 120

    const [sortVisibleCount, setSortVisibleCount] = React.useState(INITIAL_SORT_RENDER_COUNT)

    React.useEffect(() => {
        if (validProductIds.length <= INITIAL_SORT_RENDER_COUNT) {
            setSortVisibleCount(INITIAL_SORT_RENDER_COUNT)
            return
        }

        // Seçim azaldığında görünür sınırın listeden daha büyük kalmamasını sağla
        setSortVisibleCount((prev) => Math.min(Math.max(INITIAL_SORT_RENDER_COUNT, prev), validProductIds.length))
    }, [validProductIds.length])

    const visibleSortedIds = React.useMemo(
        () => validProductIds.slice(0, sortVisibleCount),
        [validProductIds, sortVisibleCount]
    )

    const hasMoreSortedItems = validProductIds.length > visibleSortedIds.length

    return (
        <div className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* CATALOG DETAILS - COMPACT VERSION */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <Card className="relative bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm border-slate-200/50 shadow-sm rounded-[1.5rem] overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                {t('builder.catalogDetails')}
                            </span>
                        </div>
                        {validProductIds.length > 0 && (
                            <div className="bg-indigo-600 text-[10px] font-black text-white px-2 py-0.5 rounded-full shadow-sm shadow-indigo-200">
                                {validProductIds.length} {t('builder.productsSelected')}
                            </div>
                        )}
                    </div>
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            <textarea
                                className="w-full min-h-[90px] p-3 text-sm bg-transparent border-none rounded-xl focus:ring-0 transition-all outline-none resize-none placeholder:text-muted-foreground font-medium text-slate-700 dark:text-slate-300"
                                placeholder={t('builder.descriptionPlaceholder')}
                                value={description}
                                onChange={(e) => onDescriptionChange(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SEARCH & FILTERS SECTION */}
            <div className="space-y-4">
                <div className="flex flex-col gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            placeholder={t('builder.searchProducts')}
                            value={searchQuery}
                            onChange={onSearchChange}
                            className="pl-12 h-12 bg-white dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Select value={selectedCategory} onValueChange={onCategoryChange}>
                                <SelectTrigger className="h-11 bg-white dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm text-xs font-bold px-4">
                                    <SelectValue placeholder={t('common.category')} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border shadow-xl">
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <SelectAllButton
                            filteredProducts={filteredProducts}
                            selectedProductIdSet={selectedProductIdSet}
                            selectedProductIds={selectedProductIds}
                            onSelectedProductIdsChange={onSelectedProductIdsChange}
                            t={t}
                        />
                    </div>
                </div>

                {/* PRODUCTS GRID - PREMIUM CARDS (Memoized) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {visibleProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isSelected={selectedProductIdSet.has(product.id)}
                            onToggle={toggleProduct}
                        />
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-4">
                        {/* Önceki Sayfa */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="rounded-xl h-9 px-3 text-xs font-bold border-slate-200/60 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                        >
                            {t('common.back')}
                        </Button>

                        {/* Sayfa Numaraları */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    if (page === 1 || page === totalPages) return true
                                    if (Math.abs(page - currentPage) <= 1) return true
                                    return false
                                })
                                .map((page, index, arr) => (
                                    <React.Fragment key={page}>
                                        {index > 0 && arr[index - 1] !== page - 1 && (
                                            <span className="px-1 text-slate-400">...</span>
                                        )}
                                        <Button
                                            variant={currentPage === page ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => onPageChange(page)}
                                            className={cn(
                                                "rounded-xl h-9 w-9 p-0 text-xs font-bold transition-all",
                                                currentPage === page
                                                    ? "bg-indigo-600 text-white shadow-md"
                                                    : "text-slate-600 hover:bg-slate-100"
                                            )}
                                        >
                                            {page}
                                        </Button>
                                    </React.Fragment>
                                ))}
                        </div>

                        {/* Sonraki Sayfa */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="rounded-xl h-9 px-3 text-xs font-bold border-slate-200/60 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                        >
                            {t('common.next')}
                        </Button>

                        {/* Sayfa Bilgisi */}
                        <span className="ml-3 text-xs text-slate-500 font-medium">
                            {filteredProducts.length} üründen {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                        </span>
                    </div>
                )}
            </div>

            <Separator className="opacity-50" />

            {/* SORTING AREA */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{t('builder.selectedProducts', { count: validProductIds.length })}</h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase">{t('builder.dragToReorder')}</p>
                    </div>
                    {validProductIds.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => onSelectedProductIdsChange([])} className="h-8 text-xs font-bold text-destructive hover:bg-destructive/5 px-3 rounded-lg">
                            {t('builder.clearSelection')}
                        </Button>
                    )}
                </div>

                <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3">
                    {validProductIds.length > INITIAL_SORT_RENDER_COUNT && (
                        <div className="mb-2 flex items-center justify-between gap-2 px-1">
                            <p className="text-[10px] text-muted-foreground font-medium">
                                {validProductIds.length} seçili üründen {visibleSortedIds.length} tanesi listeleniyor
                            </p>
                            {hasMoreSortedItems && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] px-2"
                                    onClick={() => setSortVisibleCount((prev) => prev + SORT_RENDER_STEP)}
                                >
                                    Daha Fazla Göster
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {visibleSortedIds.map((id, index) => {
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
                                        onRemove={onRemoveProduct}
                                    />
                                )
                            })}
                            {validProductIds.length === 0 && <EmptySortingState />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
