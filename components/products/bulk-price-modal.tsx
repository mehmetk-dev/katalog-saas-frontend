"use client"

import { Percent, Package, LayoutGrid, X, TrendingUp, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ProductsBulkPriceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedIds: string[]
    onSelectedIdsChange: (ids: string[]) => void
    paginatedProducts: any[]
    allProducts: any[]
    categories: string[]
    categoryStats: [string, { count: number; totalValue: number }][]
    priceChangeType: "increase" | "decrease"
    onPriceChangeTypeChange: (type: "increase" | "decrease") => void
    priceChangeMode: "percentage" | "fixed"
    onPriceChangeModeChange: (mode: "percentage" | "fixed") => void
    priceChangeAmount: number
    onPriceChangeAmountChange: (amount: number) => void
    onUpdate: () => void
    isPending: boolean
    onSelectCurrentPage: () => void
    onSelectAllProducts: () => void
    onSelectByCategory: (category: string) => void
}

export function ProductsBulkPriceModal({
    open,
    onOpenChange,
    selectedIds,
    onSelectedIdsChange,
    paginatedProducts,
    allProducts,
    categories,
    categoryStats,
    priceChangeType,
    onPriceChangeTypeChange,
    priceChangeMode,
    onPriceChangeModeChange,
    priceChangeAmount,
    onPriceChangeAmountChange,
    onUpdate,
    isPending,
    onSelectCurrentPage,
    onSelectAllProducts,
    onSelectByCategory
}: ProductsBulkPriceModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Percent className="w-5 h-5" />
                        Toplu Fiyat Güncelleme
                    </DialogTitle>
                    <DialogDescription>
                        Ürün seçin ve fiyatları toplu olarak güncelleyin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Ürün Seçimi */}
                    <div className="space-y-2">
                        <Label className="flex items-center justify-between">
                            <span>Ürün Seçimi</span>
                            {selectedIds.length > 0 && (
                                <Badge variant="secondary" className="gap-1">
                                    <Package className="w-3 h-3" />
                                    {selectedIds.length} ürün seçili
                                </Badge>
                            )}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={onSelectCurrentPage} className="gap-1">
                                <LayoutGrid className="w-3 h-3" />
                                Sayfayı Seç ({paginatedProducts.length})
                            </Button>
                            <Button variant="outline" size="sm" onClick={onSelectAllProducts} className="gap-1">
                                <Package className="w-3 h-3" />
                                Tümünü Seç ({allProducts.length})
                            </Button>
                            {selectedIds.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => onSelectedIdsChange([])} className="gap-1 text-muted-foreground">
                                    <X className="w-3 h-3" />
                                    Temizle
                                </Button>
                            )}
                        </div>
                        {categories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t mt-2">
                                <span className="text-xs text-muted-foreground w-full mb-1">Kategori bazlı seç:</span>
                                {categoryStats.map(([cat, stat]) => (
                                    <Button key={cat} variant="outline" size="sm" onClick={() => onSelectByCategory(cat)} className="h-7 text-xs gap-1 px-2">
                                        {cat} <Badge variant="secondary" className="h-4 px-1 text-[10px]">{stat.count}</Badge>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedIds.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground bg-muted/50 rounded-lg">
                            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Önce ürün seçin</p>
                        </div>
                    ) : (
                        <>
                            {/* İşlem Tipi */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={priceChangeType === "increase" ? "default" : "outline"}
                                    className={cn("gap-2", priceChangeType === "increase" && "bg-emerald-600 hover:bg-emerald-700")}
                                    onClick={() => onPriceChangeTypeChange("increase")}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Zam Yap
                                </Button>
                                <Button
                                    variant={priceChangeType === "decrease" ? "default" : "outline"}
                                    className={cn("gap-2", priceChangeType === "decrease" && "bg-red-600 hover:bg-red-700")}
                                    onClick={() => onPriceChangeTypeChange("decrease")}
                                >
                                    <TrendingUp className="w-4 h-4 rotate-180" />
                                    İndirim Yap
                                </Button>
                            </div>

                            {/* Değişiklik Modu */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={priceChangeMode === "percentage" ? "secondary" : "outline"}
                                    className="gap-2"
                                    onClick={() => onPriceChangeModeChange("percentage")}
                                >
                                    <Percent className="w-4 h-4" />
                                    Yüzde (%)
                                </Button>
                                <Button
                                    variant={priceChangeMode === "fixed" ? "secondary" : "outline"}
                                    className="gap-2"
                                    onClick={() => onPriceChangeModeChange("fixed")}
                                >
                                    <DollarSign className="w-4 h-4" />
                                    Sabit (₺)
                                </Button>
                            </div>

                            {/* Miktar */}
                            <div className="space-y-2">
                                <Label>{priceChangeMode === "percentage" ? "Yüzde (%)" : "Tutar (₺)"}</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step={priceChangeMode === "percentage" ? "1" : "0.01"}
                                    value={priceChangeAmount}
                                    onChange={(e) => onPriceChangeAmountChange(Number(e.target.value))}
                                />
                            </div>

                            {/* Önizleme */}
                            <div className="bg-muted/50 rounded-lg p-3 text-sm">
                                <span className="text-muted-foreground">Örnek: </span>
                                ₺100 → <span className="font-bold">
                                    ₺{priceChangeMode === "percentage"
                                        ? (priceChangeType === "increase"
                                            ? (100 + (100 * priceChangeAmount / 100)).toFixed(2)
                                            : Math.max(0, 100 - (100 * priceChangeAmount / 100)).toFixed(2))
                                        : (priceChangeType === "increase"
                                            ? (100 + priceChangeAmount).toFixed(2)
                                            : Math.max(0, 100 - priceChangeAmount).toFixed(2))
                                    }
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button
                        onClick={onUpdate}
                        disabled={isPending || selectedIds.length === 0 || priceChangeAmount <= 0}
                        className={cn(
                            priceChangeType === "increase" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                        )}
                    >
                        {isPending ? "Güncelleniyor..." : `${selectedIds.length} Ürüne ${priceChangeType === "increase" ? "Zam" : "İndirim"} Uygula`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
