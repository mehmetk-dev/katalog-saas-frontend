"use client"

import { GripVertical, MoreHorizontal, Pencil, Trash2, Copy, Package, Eye, ExternalLink } from "lucide-react"
import NextImage from "next/image"

import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { type ProductViewProps } from "../types"
import { getStockStatus, getCurrencySymbol, isSafeUrl } from "../utils/product-helpers"
import { DeleteAlertDialog } from "../components/delete-alert-dialog"
import { ProductPreviewDialog } from "../components/product-preview-dialog"

export function ProductListView({
    filteredProducts,
    allProducts,
    selectedIds,
    isMobile,
    isPending,
    draggingId,
    dragOverId,
    failedImages,
    deleteId,
    deleteCatalogs,
    previewProduct,
    toggleSelectAll,
    toggleSelect,
    onEdit,
    handleDuplicate,
    initiateDelete,
    handleDelete,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleImageError,
    setPreviewProduct,
    setDeleteId,
    setDeleteCatalogs,
    t,
}: ProductViewProps) {
    return (
        <TooltipProvider>
            <div className="rounded-xl border bg-card overflow-hidden">
                {/* Tablo Header */}
                <div className="hidden md:grid grid-cols-[80px_1fr_100px_100px_100px_100px] gap-4 px-4 py-2.5 bg-muted/50 border-b text-xs font-medium text-muted-foreground items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3.5" />
                            <Checkbox
                                checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                                onCheckedChange={toggleSelectAll}
                                className="h-4 w-4 scale-75 origin-center"
                            />
                        </div>
                        <div className="w-11" />
                    </div>
                    <div>Ürün</div>
                    <div className="text-right pr-2">Fiyat</div>
                    <div className="text-center">Stok</div>
                    <div>Kategori</div>
                    <div className="text-right">İşlemler</div>
                </div>

                {/* Ürün Listesi */}
                <div className="divide-y">
                    {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product.stock)
                        const isSelected = selectedIds.includes(product.id)
                        const isDragging = draggingId === product.id
                        const isDragOver = dragOverId === product.id

                        return (
                            <div
                                key={product.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, product.id)}
                                onDragOver={(e) => handleDragOver(e, product.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, product.id)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                    "group grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_1fr_100px_100px_100px_100px] gap-4 px-4 py-3 items-center cursor-move transition-all duration-200",
                                    "hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/30 dark:hover:from-violet-950/20 dark:hover:to-purple-950/10",
                                    isSelected && "bg-violet-50 dark:bg-violet-950/30",
                                    isDragging && "opacity-50 scale-[0.98]",
                                    isDragOver && "bg-violet-100/50 dark:bg-violet-900/30"
                                )}
                                onClick={(e) => {
                                    if (isMobile && !e.defaultPrevented && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                                        setPreviewProduct(product)
                                    }
                                }}
                            >
                                {/* Checkbox + Resim */}
                                <div className="flex items-center gap-3">
                                    <div className={cn("flex items-center gap-1.5", isMobile && !isSelected && "opacity-60")}>
                                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelect(product.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-4 w-4"
                                        />
                                    </div>
                                    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 ring-1 ring-black/5">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Package className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        {(() => {
                                            const imageUrl = (product.image_url || product.images?.[0]) as string | undefined
                                            const hasValidImage = imageUrl && !failedImages.has(imageUrl)

                                            return hasValidImage ? (
                                                <NextImage
                                                    src={imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                    loading="lazy"
                                                    unoptimized
                                                    onError={() => handleImageError(imageUrl)}
                                                />
                                            ) : null
                                        })()}
                                    </div>
                                </div>

                                {/* Ürün Bilgisi */}
                                <div className="min-w-0 flex flex-col gap-0.5 pl-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-sm truncate">{product.name}</h3>
                                        {product.product_url && isSafeUrl(product.product_url) && (
                                            <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:text-violet-600" onClick={(e) => e.stopPropagation()}>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                    {product.sku && (
                                        <p className="text-[11px] text-muted-foreground font-mono tracking-tight">{product.sku}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1 md:hidden">
                                        <span className="font-bold text-sm text-violet-600 dark:text-violet-400">{getCurrencySymbol(product)}</span>
                                        <Badge
                                            variant={stockStatus.variant}
                                            className={cn(
                                                "text-[10px] h-5 px-1.5",
                                                stockStatus.variant === "destructive" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                                                stockStatus.variant === "secondary" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                                                stockStatus.variant === "default" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                            )}
                                        >
                                            {product.stock}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Fiyat - Desktop */}
                                <div className="hidden md:block text-right pr-2">
                                    <span className="font-bold text-sm text-violet-600 dark:text-violet-400">{getCurrencySymbol(product)}</span>
                                </div>

                                {/* Stok - Desktop */}
                                <div className="hidden md:flex justify-center">
                                    <Badge
                                        variant={stockStatus.variant}
                                        className={cn(
                                            "text-[10px] h-5 px-2 font-medium",
                                            stockStatus.variant === "destructive" && "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
                                            stockStatus.variant === "secondary" && "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
                                            stockStatus.variant === "default" && "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                                        )}
                                    >
                                        {product.stock} adet
                                    </Badge>
                                </div>

                                {/* Kategori - Desktop */}
                                <div className="hidden md:block">
                                    {product.category ? (
                                        <span className="text-xs text-muted-foreground truncate block max-w-[100px]" title={product.category}>
                                            {product.category.split(',')[0].trim()}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground/50">—</span>
                                    )}
                                </div>

                                {/* Aksiyonlar */}
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8 transition-opacity", isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
                                        onClick={(e) => { e.stopPropagation(); setPreviewProduct(product); }}
                                    >
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8 transition-opacity", isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
                                        onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                    >
                                        <Pencil className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="gap-2" onClick={() => setPreviewProduct(product)}>
                                                <Eye className="w-4 h-4" /> Önizle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2" onClick={() => onEdit(product)}>
                                                <Pencil className="w-4 h-4" /> {t("common.edit")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2" onClick={() => handleDuplicate(product)} disabled={isPending}>
                                                <Copy className="w-4 h-4" /> Kopyala
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => initiateDelete(product.id)}>
                                                <Trash2 className="w-4 h-4" /> {t("common.delete")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {filteredProducts.length === 0 && allProducts.length > 0 && (
                    <div className="p-8 text-center text-muted-foreground">{t("products.noProducts")}</div>
                )}
            </div>

            {/* Preview Dialog */}
            <Dialog open={!!previewProduct} onOpenChange={() => setPreviewProduct(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    {previewProduct && (
                        <ProductPreviewDialog
                            product={previewProduct}
                            onEdit={onEdit}
                            onClose={() => setPreviewProduct(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <DeleteAlertDialog
                deleteId={deleteId}
                deleteCatalogs={deleteCatalogs}
                isPending={isPending}
                onClose={() => { setDeleteId(null); setDeleteCatalogs([]); }}
                onConfirm={handleDelete}
                t={t}
            />
        </TooltipProvider>
    )
}
