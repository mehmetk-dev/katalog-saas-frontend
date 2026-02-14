"use client"

import { useState, useCallback } from "react"
import { ChevronLeft, ChevronRight, ExternalLink, ImageOff, Pencil } from "lucide-react"
import NextImage from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { type Product } from "../types"
import { getStockStatus, getCurrencySymbol } from "../utils/product-helpers"

interface ProductPreviewDialogProps {
    product: Product
    onEdit: (p: Product) => void
    onClose: () => void
}

export function ProductPreviewDialog({ product, onEdit, onClose }: ProductPreviewDialogProps) {
    const [activeImageIndex, setActiveImageIndex] = useState(0)
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

    const handleImageError = useCallback((imageUrl: string) => {
        setFailedImages((prev: Set<string>) => {
            const newSet = new Set(prev)
            newSet.add(imageUrl)
            return newSet
        })
    }, [])

    const allImages = ((product.images && product.images.length > 0)
        ? product.images
        : [product.image_url].filter(Boolean) as string[])
        .filter((img: string) => !failedImages.has(img))

    const customAttrs = product.custom_attributes?.filter(
        a => a.name !== "currency" && a.name !== "additional_images"
    ) || []

    const stockStatus = getStockStatus(product.stock)

    return (
        <>
            <div className="px-6 py-4 border-b bg-gradient-to-r from-violet-600 to-purple-600 shrink-0">
                <DialogHeader>
                    <DialogTitle className="text-white text-lg font-bold pr-8">{product.name}</DialogTitle>
                    {product.sku && <p className="text-white/70 text-sm font-mono mt-1">SKU: {product.sku}</p>}
                </DialogHeader>
            </div>

            <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5 min-h-0">
                {allImages.length > 0 ? (
                    <div className="space-y-2 shrink-0">
                        <div className="relative h-64 sm:h-[320px] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border">
                            <NextImage
                                src={(allImages[activeImageIndex] || allImages[0]) as string}
                                alt={product.name}
                                fill
                                className="object-contain bg-neutral-900/5 dark:bg-neutral-50/5"
                                loading="lazy"
                                unoptimized
                                onError={() => handleImageError((allImages[activeImageIndex] || allImages[0]) as string)}
                            />
                            {allImages.length > 1 && (
                                <>
                                    <button onClick={() => setActiveImageIndex(prev => prev > 0 ? prev - 1 : allImages.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 z-10">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setActiveImageIndex(prev => prev < allImages.length - 1 ? prev + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 z-10">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded z-10">{activeImageIndex + 1}/{allImages.length}</div>
                                </>
                            )}
                        </div>
                        {allImages.length > 1 && (
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                                {allImages.map((img, idx) => (
                                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={cn("relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all", activeImageIndex === idx ? "border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900" : "border-transparent opacity-60 hover:opacity-100")}>
                                        <NextImage
                                            src={img}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            loading="lazy"
                                            unoptimized
                                            onError={() => handleImageError(img)}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="aspect-video rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <ImageOff className="w-10 h-10 text-gray-400" />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">Fiyat</p>
                        <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{getCurrencySymbol(product)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border">
                        <p className="text-xs text-muted-foreground font-medium">Stok</p>
                        <p className={cn("text-xl font-bold", stockStatus.variant === "destructive" && "text-red-500", stockStatus.variant === "secondary" && "text-amber-500", stockStatus.variant === "default" && "text-emerald-500")}>{product.stock} adet</p>
                    </div>
                </div>

                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Kategori</p>
                    {product.category ? (
                        <div className="flex flex-wrap gap-1">{product.category.split(',').map((cat, idx) => <Badge key={idx} variant="secondary" className="text-xs">{cat.trim()}</Badge>)}</div>
                    ) : <p className="text-sm text-muted-foreground">—</p>}
                </div>

                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Açıklama</p>
                    <div className="text-sm text-foreground/90 leading-relaxed">
                        {product.description || "—"}
                    </div>
                </div>

                {product.product_url && (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Ürün Linki</p>
                        <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 hover:underline flex items-center gap-1">
                            {product.product_url.slice(0, 50)}{product.product_url.length > 50 && "..."} <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}

                {customAttrs.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Özellikler</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {customAttrs.map((attr, idx) => (
                                <div key={idx} className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-800 text-xs text-foreground/90">
                                    <span className="text-muted-foreground">{attr.name}</span>
                                    <span className="font-medium">{attr.value}{attr.unit && ` ${attr.unit}`}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="px-6 py-3 border-t bg-gray-50 dark:bg-gray-900 flex gap-2 shrink-0">
                <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => { onClose(); onEdit(product) }}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Düzenle
                </Button>
                <Button size="sm" variant="outline" onClick={onClose}>Kapat</Button>
            </div>
        </>
    )
}
