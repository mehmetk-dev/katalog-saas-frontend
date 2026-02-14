"use client"

import { useState, useCallback, useEffect } from "react"
import { MoreHorizontal, Pencil, Trash2, Copy, Package, Eye, ImageOff, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
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
import { Card } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { type ProductViewProps } from "../types"
import { getStockStatus, getCurrencySymbol } from "../utils/product-helpers"
import { DeleteAlertDialog } from "../components/delete-alert-dialog"

export function ProductGridView({
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
    const [activeImageIndex, setActiveImageIndex] = useState(0)

    useEffect(() => {
        setActiveImageIndex(0)
    }, [previewProduct])

    const handlePreviewImageError = useCallback((imageUrl: string) => {
        handleImageError(imageUrl)
    }, [handleImageError])

    return (
        <TooltipProvider>
            <div className="space-y-4 p-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
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
                                    if (isMobile && !e.defaultPrevented && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                                        setPreviewProduct(product)
                                    }
                                }}
                                className={cn(
                                    "group overflow-hidden cursor-move transition-all duration-200 hover:shadow-md border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 relative",
                                    isSelected && "border-violet-400 bg-violet-50/50 dark:bg-violet-950/20",
                                    isDragging && "opacity-50 scale-95",
                                    isDragOver && "border-dashed border-violet-400"
                                )}
                            >
                                {/* Resim alanı */}
                                <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Package className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                                    </div>

                                    {(() => {
                                        const imageUrl = (product.image_url || product.images?.[0]) as string | undefined
                                        const hasValidImage = imageUrl && !failedImages.has(imageUrl)

                                        return hasValidImage ? (
                                            <NextImage
                                                src={imageUrl}
                                                alt={product.name}
                                                fill
                                                className="object-cover z-[1]"
                                                loading="lazy"
                                                unoptimized
                                                onError={() => handleImageError(imageUrl)}
                                            />
                                        ) : null
                                    })()}

                                    <div className={cn(
                                        "absolute top-1.5 left-1.5 z-[5] transition-opacity",
                                        isSelected ? "opacity-100" : (isMobile ? "opacity-70" : "opacity-0 group-hover:opacity-100")
                                    )}>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelect(product.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-white/95 border-gray-300 h-4 w-4 shadow-sm"
                                        />
                                    </div>

                                    <div className={cn(
                                        "absolute bottom-2 right-2 z-[5] flex gap-1 transition-opacity",
                                        isMobile ? "hidden" : "opacity-0 group-hover:opacity-100"
                                    )}>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-7 w-7 bg-white/95 hover:bg-white shadow-sm"
                                            onClick={(e) => { e.stopPropagation(); setPreviewProduct(product); }}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-7 w-7 bg-white/95 hover:bg-white shadow-sm"
                                            onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* İçerik alanı */}
                                <div className="p-3">
                                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{product.name}</h3>
                                    <p className="text-base font-bold text-violet-600 mt-1">{getCurrencySymbol(product)}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={cn(
                                            "text-xs",
                                            stockStatus.variant === "destructive" && "text-red-500",
                                            stockStatus.variant === "secondary" && "text-amber-500",
                                            stockStatus.variant === "default" && "text-emerald-500"
                                        )}>
                                            {product.stock} adet
                                        </span>
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 -mr-1">
                                                    <MoreHorizontal className="w-3 h-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="gap-2 text-xs" onClick={() => onEdit(product)}>
                                                    <Pencil className="w-3 h-3" /> Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 text-xs" onClick={() => handleDuplicate(product)} disabled={isPending}>
                                                    <Copy className="w-3 h-3" /> Kopyala
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={() => initiateDelete(product.id)}>
                                                    <Trash2 className="w-3 h-3" /> Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>

                {filteredProducts.length === 0 && allProducts.length > 0 && (
                    <div className="p-12 text-center text-muted-foreground border rounded-xl bg-muted/20">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Aramanızla eşleşen ürün bulunamadı</p>
                    </div>
                )}
            </div>

            {/* Preview Dialog */}
            <Dialog open={!!previewProduct} onOpenChange={() => setPreviewProduct(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
                    {previewProduct ? (() => {
                        const allImagesArr = (previewProduct.images && previewProduct.images.length > 0)
                            ? previewProduct.images
                            : [previewProduct.image_url].filter(Boolean) as string[]
                        const customAttrs = previewProduct.custom_attributes?.filter(
                            a => a.name !== "currency" && a.name !== "additional_images"
                        ) || []
                        const stockStatus = getStockStatus(previewProduct.stock)
                        const validImages = allImagesArr.filter((img: string) => !failedImages.has(img))

                        return (
                            <>
                                <div className="px-6 py-4 border-b bg-gradient-to-r from-violet-600 to-purple-600">
                                    <DialogHeader>
                                        <DialogTitle className="text-white text-lg font-bold pr-8">{previewProduct.name || "Ürün Önizleme"}</DialogTitle>
                                        {previewProduct.sku && <p className="text-white/70 text-sm font-mono">SKU: {previewProduct.sku}</p>}
                                    </DialogHeader>
                                </div>

                                <div className="overflow-y-auto max-h-[calc(85vh-130px)] p-6 space-y-5">
                                    {validImages.length === 0 ? (
                                        <div className="aspect-video rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            <ImageOff className="w-10 h-10 text-gray-400" />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                <NextImage
                                                    src={validImages[activeImageIndex] || validImages[0]}
                                                    alt={previewProduct.name}
                                                    fill
                                                    className="object-contain"
                                                    loading="lazy"
                                                    unoptimized
                                                    onError={() => handlePreviewImageError(validImages[activeImageIndex] || validImages[0])}
                                                />
                                                {validImages.length > 1 && (
                                                    <>
                                                        <button onClick={() => setActiveImageIndex(prev => prev > 0 ? prev - 1 : validImages.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"><ChevronLeft className="w-4 h-4" /></button>
                                                        <button onClick={() => setActiveImageIndex(prev => prev < validImages.length - 1 ? prev + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"><ChevronRight className="w-4 h-4" /></button>
                                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">{activeImageIndex + 1}/{validImages.length}</div>
                                                    </>
                                                )}
                                            </div>
                                            {validImages.length > 1 && (
                                                <div className="flex gap-1.5 overflow-x-auto">
                                                    {validImages.map((img, idx) => (
                                                        <button key={idx} onClick={() => setActiveImageIndex(idx)} className={cn("relative w-12 h-12 rounded overflow-hidden shrink-0 border-2", activeImageIndex === idx ? "border-violet-500" : "border-transparent opacity-60 hover:opacity-100")}>
                                                            <NextImage src={img} alt="" fill className="object-cover" loading="lazy" unoptimized onError={() => handlePreviewImageError(img)} />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                                            <p className="text-xs text-violet-600 dark:text-violet-400">Fiyat</p>
                                            <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{getCurrencySymbol(previewProduct)}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border">
                                            <p className="text-xs text-muted-foreground">Stok</p>
                                            <p className={cn("text-xl font-bold", stockStatus.variant === "destructive" && "text-red-500", stockStatus.variant === "secondary" && "text-amber-500", stockStatus.variant === "default" && "text-emerald-500")}>{previewProduct.stock} adet</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Kategori</p>
                                        {previewProduct.category ? (
                                            <div className="flex flex-wrap gap-1">{previewProduct.category.split(',').map((cat, idx) => <Badge key={idx} variant="secondary" className="text-xs">{cat.trim()}</Badge>)}</div>
                                        ) : <p className="text-sm text-muted-foreground">—</p>}
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Açıklama</p>
                                        <p className="text-sm">{previewProduct.description || "—"}</p>
                                    </div>

                                    {previewProduct.product_url && (
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1.5">Ürün Linki</p>
                                            <a href={previewProduct.product_url} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 hover:underline flex items-center gap-1">
                                                {previewProduct.product_url.slice(0, 50)}{previewProduct.product_url.length > 50 && "..."} <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    )}

                                    {customAttrs.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1.5">Özellikler</p>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {customAttrs.map((attr, idx) => (
                                                    <div key={idx} className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-800 text-xs">
                                                        <span className="text-muted-foreground">{attr.name}</span>
                                                        <span className="font-medium">{attr.value}{attr.unit && ` ${attr.unit}`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-6 py-3 border-t bg-gray-50 dark:bg-gray-900 flex gap-2">
                                    <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={() => { setPreviewProduct(null); onEdit(previewProduct) }}>
                                        <Pencil className="w-3.5 h-3.5 mr-1.5" /> Düzenle
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setPreviewProduct(null)}>Kapat</Button>
                                </div>
                            </>
                        )
                    })() : (
                        <DialogHeader>
                            <DialogTitle>Ürün Önizleme</DialogTitle>
                        </DialogHeader>
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
