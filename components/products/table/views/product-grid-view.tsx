"use client"

import { MoreHorizontal, Pencil, Trash2, Copy, Package, Eye } from "lucide-react"
import NextImage from "next/image"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { type ProductViewProps } from "../types"
import { getStockStatus, formatProductPrice } from "../utils/product-helpers"
import { DeleteAlertDialog } from "../components/delete-alert-dialog"
import { ProductPreviewDialog } from "../components/product-preview-dialog"

export function ProductGridView({
    filteredProducts,
    selectedIds,
    isMobile,
    isPending,
    draggingId,
    dragOverId,
    failedImages,
    deleteId,
    deleteCatalogs,
    previewProduct,
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
            <div>
                <div className={cn(
                    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
                    "lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
                )}>
                    {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product.stock)
                        const isSelected = selectedIds.includes(product.id)
                        const isDragging = draggingId === product.id
                        const isDragOver = dragOverId === product.id

                        return (
                            <Card
                                key={product.id}
                                draggable
                                onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, product.id)}
                                onDragOver={(e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, product.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, product.id)}
                                onDragEnd={handleDragEnd}
                                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                    const target = e.target as HTMLElement
                                    if (isMobile && !e.defaultPrevented
                                        && target.tagName !== 'BUTTON'
                                        && target.tagName !== 'INPUT') {
                                        setPreviewProduct(product)
                                    }
                                }}
                                className={cn(
                                    // Card'ın varsayılan py-6/gap-6 boşluğu görselin üstünde boşluk bırakıyordu
                                    "group relative cursor-grab gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md active:cursor-grabbing",
                                    isSelected && "ring-2 ring-primary",
                                    isDragging && "opacity-50",
                                    isDragOver && "border-dashed border-primary"
                                )}
                            >
                                {/* Resim alanı */}
                                <div className="relative aspect-square overflow-hidden bg-muted/50">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Package className="w-8 h-8 text-muted-foreground/40" />
                                    </div>

                                    {(() => {
                                        const imageUrl = (product.image_url || product.images?.[0]) as string | undefined
                                        if (!imageUrl || failedImages.has(imageUrl)) return null
                                        return (
                                            <NextImage
                                                src={imageUrl}
                                                alt={product.name}
                                                fill
                                                className="object-cover z-[1]"
                                                loading="lazy"
                                                unoptimized
                                                onError={() => handleImageError(imageUrl)}
                                            />
                                        )
                                    })()}

                                    <div className={cn(
                                        "absolute top-1.5 left-1.5 z-[5] transition-opacity",
                                        isSelected
                                            ? "opacity-100"
                                            : isMobile
                                                ? "opacity-70"
                                                : "opacity-0 group-hover:opacity-100"
                                    )}>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelect(product.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-background/95 border-border h-4 w-4 shadow-sm"
                                        />
                                    </div>

                                    <div className={cn(
                                        "absolute bottom-2 right-2 z-[5] flex gap-1 transition-opacity",
                                        isMobile ? "hidden" : "opacity-0 group-hover:opacity-100"
                                    )}>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-7 w-7 bg-background/95 hover:bg-card shadow-sm"
                                            onClick={(e) => { e.stopPropagation(); setPreviewProduct(product); }}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-7 w-7 bg-background/95 hover:bg-card shadow-sm"
                                            onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* İçerik alanı */}
                                <div className="space-y-1 p-3">
                                    <h3 className="truncate text-sm font-medium text-foreground" title={product.name}>
                                        {product.name}
                                    </h3>
                                    <p className="text-sm font-semibold tabular-nums text-foreground">
                                        {formatProductPrice(product)}
                                    </p>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className={cn(
                                            "text-xs tabular-nums",
                                            stockStatus.variant === "destructive" && "text-destructive",
                                            stockStatus.variant === "secondary" && "text-warning-soft-foreground",
                                            stockStatus.variant === "default" && "text-muted-foreground"
                                        )}>
                                            {t("products.unitCount", { count: product.stock })}
                                        </span>
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon-sm" className="-mr-1.5 size-7 text-muted-foreground" aria-label={t("products.actions")}>
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="gap-2 text-xs" onClick={() => onEdit(product)}>
                                                    <Pencil className="w-3 h-3" /> {t("common.edit")}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 text-xs" onClick={() => handleDuplicate(product)} disabled={isPending}>
                                                    <Copy className="w-3 h-3" /> {t("products.duplicate")}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="gap-2 text-xs" variant="destructive" onClick={() => initiateDelete(product.id)}>
                                                    <Trash2 className="w-3 h-3" /> {t("common.delete")}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>

            </div>

            {/* Preview Dialog */}
            {/* Liste görünümüyle aynı önizleme (önceden ~200 satırlık kopyası buradaydı) */}
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
        </TooltipProvider >
    )
}
