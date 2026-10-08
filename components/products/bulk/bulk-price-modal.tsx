"use client"

import { useMemo } from "react"
import { Loader2, Percent, TrendingDown, TrendingUp, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useAllProducts } from "@/lib/hooks/use-products"
import { formatCurrency } from "@/lib/utils/helpers"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/actions/products"

interface ProductsBulkPriceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedIds: string[]
    onSelectedIdsChange: (ids: string[]) => void
    paginatedProducts: Product[]
    priceChangeType: "increase" | "decrease"
    onPriceChangeTypeChange: (type: "increase" | "decrease") => void
    priceChangeMode: "percentage" | "fixed"
    onPriceChangeModeChange: (mode: "percentage" | "fixed") => void
    priceChangeAmount: number
    onPriceChangeAmountChange: (amount: number) => void
    onUpdate: () => void
    isPending: boolean
}

const UNCATEGORIZED = "Kategorisiz"

function previewPrice(base: number, type: "increase" | "decrease", mode: "percentage" | "fixed", amount: number) {
    const delta = mode === "percentage" ? (base * amount) / 100 : amount
    return Math.max(0, type === "increase" ? base + delta : base - delta)
}

export function ProductsBulkPriceModal({
    open,
    onOpenChange,
    selectedIds,
    onSelectedIdsChange,
    paginatedProducts,
    priceChangeType,
    onPriceChangeTypeChange,
    priceChangeMode,
    onPriceChangeModeChange,
    priceChangeAmount,
    onPriceChangeAmountChange,
    onUpdate,
    isPending,
}: ProductsBulkPriceModalProps) {
    const { t: baseT } = useTranslation()
    const t = (key: string, params?: Record<string, unknown>) => baseT(`products.bulkPrice.${key}`, params) as string

    // Sayfadaki 12 ürün değil, bütün envanter: "tümünü seç" ve kategori seçimi gerçekten tümünü kapsasın
    const allProductsQuery = useAllProducts({ enabled: open })
    const allProducts = allProductsQuery.data
    const isLoadingAll = allProductsQuery.isLoading

    const categoryGroups = useMemo(() => {
        const groups = new Map<string, string[]>()
        for (const product of allProducts ?? []) {
            const category = product.category || UNCATEGORIZED
            groups.set(category, [...(groups.get(category) ?? []), product.id])
        }
        return [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
    }, [allProducts])

    // Mevcut seçime eklenir (eski davranış)
    const selectIds = (ids: string[]) => onSelectedIdsChange([...new Set([...selectedIds, ...ids])])
    const isIncrease = priceChangeType === "increase"
    const actionLabel = isIncrease ? t("increase").toLowerCase() : t("decrease").toLowerCase()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{baseT("products.bulkPriceUpdate") as string}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Ürün seçimi */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <Label>{t("selection")}</Label>
                            {selectedIds.length > 0 && (
                                <Badge variant="secondary" className="tabular-nums">{t("selectedCount", { count: selectedIds.length })}</Badge>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => selectIds(paginatedProducts.map((p) => p.id))}>
                                {t("selectPage", { count: paginatedProducts.length })}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!allProducts}
                                onClick={() => allProducts && selectIds(allProducts.map((p) => p.id))}
                            >
                                {isLoadingAll && <Loader2 className="size-3.5 animate-spin" />}
                                {t("selectAll", { count: allProducts?.length ?? "…" })}
                            </Button>
                            {selectedIds.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => onSelectedIdsChange([])} className="text-muted-foreground">
                                    <X className="size-3.5" />
                                    {t("clear")}
                                </Button>
                            )}
                        </div>

                        <div className="space-y-1.5 border-t pt-3">
                            <p className="text-xs text-muted-foreground">{t("byCategory")}</p>
                            {isLoadingAll ? (
                                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="size-3.5 animate-spin" />
                                    {t("loadingProducts")}
                                </p>
                            ) : (
                                <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                                    {categoryGroups.map(([category, ids]) => (
                                        <Button key={category} variant="outline" size="sm" onClick={() => selectIds(ids)} className="h-7 gap-1.5 px-2 text-xs">
                                            {category}
                                            <span className="tabular-nums text-muted-foreground">{ids.length}</span>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedIds.length === 0 ? (
                        <p className="rounded-lg bg-muted/50 py-6 text-center text-sm text-muted-foreground">{t("selectFirst")}</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={isIncrease ? "default" : "outline"}
                                    onClick={() => onPriceChangeTypeChange("increase")}
                                >
                                    <TrendingUp className="size-4" />
                                    {t("increase")}
                                </Button>
                                <Button
                                    variant={!isIncrease ? "default" : "outline"}
                                    onClick={() => onPriceChangeTypeChange("decrease")}
                                >
                                    <TrendingDown className="size-4" />
                                    {t("decrease")}
                                </Button>
                            </div>

                            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bulk-price-amount">{t("amount")}</Label>
                                    <Input
                                        id="bulk-price-amount"
                                        type="number"
                                        min="0"
                                        step={priceChangeMode === "percentage" ? "1" : "0.01"}
                                        value={priceChangeAmount}
                                        onChange={(e) => onPriceChangeAmountChange(Number(e.target.value))}
                                    />
                                </div>
                                <div role="radiogroup" className="flex h-9 rounded-md bg-muted p-1">
                                    {(["percentage", "fixed"] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            role="radio"
                                            aria-checked={priceChangeMode === mode}
                                            onClick={() => onPriceChangeModeChange(mode)}
                                            className={cn(
                                                "rounded px-3 text-xs font-medium transition-colors",
                                                priceChangeMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {mode === "percentage" ? <Percent className="size-3.5" /> : "₺"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                                <span className="text-muted-foreground">{t("example")}: </span>
                                <span className="tabular-nums">{formatCurrency(100)}</span>
                                {" → "}
                                <span className="font-semibold tabular-nums">
                                    {formatCurrency(previewPrice(100, priceChangeType, priceChangeMode, priceChangeAmount))}
                                </span>
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{baseT("common.cancel") as string}</Button>
                    <Button
                        onClick={onUpdate}
                        disabled={isPending || selectedIds.length === 0 || priceChangeAmount <= 0}
                        variant={isIncrease ? "default" : "destructive"}
                    >
                        {isPending ? t("updating") : t("apply", { count: selectedIds.length, action: actionLabel })}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
