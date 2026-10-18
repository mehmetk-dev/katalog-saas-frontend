"use client"

import React, { memo } from "react"
import NextImage from "next/image"
import { ImagePlus, Loader2, Plus, X } from "lucide-react"

import { MAX_PRODUCT_IMAGES } from "@/lib/constants"
import { cn } from "@/lib/utils"

// ─── Props ───────────────────────────────────────────────────────────
interface ProductImagesTabProps {
    images: string[]
    activeImageUrl: string
    isUploading: boolean
    onSetCover: (url: string) => void
    onRemove: (index: number) => void
    onFilesSelected: (files: FileList) => void
    onUploadClick: () => void
    maxImages?: number
    t: (key: string, params?: Record<string, unknown>) => string
}

/** Dosya seçici; hem boş durumdaki büyük alan hem küçük "+" kutusu bunu sarar */
function UploadInput({ isUploading, onUploadClick, onFilesSelected }: Pick<ProductImagesTabProps, "isUploading" | "onUploadClick" | "onFilesSelected">) {
    return (
        <input
            type="file"
            data-testid="file-upload"
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            multiple
            onChange={(e) => {
                if (e.target.files?.length) {
                    onUploadClick()
                    onFilesSelected(e.target.files)
                }
                e.target.value = ""
            }}
            disabled={isUploading}
        />
    )
}

// ─── Component ───────────────────────────────────────────────────────
/**
 * Ürün görselleri: üstte büyük kapak, altında küçük resimler. Küçük resme tıklamak onu kapak yapar,
 * köşedeki × kaldırır. Form ile aynı ekranda durur (eskiden ayrı sekmedeydi, düzenlerken görsel görünmüyordu).
 */
export const ProductImagesTab = memo(function ProductImagesTab({
    images, activeImageUrl, isUploading,
    onSetCover, onRemove, onFilesSelected, onUploadClick,
    maxImages = MAX_PRODUCT_IMAGES, t,
}: ProductImagesTabProps) {
    const cover = images.includes(activeImageUrl) ? activeImageUrl : images[0]
    const canAdd = images.length < maxImages

    return (
        <div className="relative space-y-2">
            {cover ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted/40 md:aspect-square">
                    <NextImage src={cover} fill className="object-contain" alt={t("productForm.imageAlt", { index: images.indexOf(cover) + 1 })} unoptimized />
                    <span className="absolute left-2 top-2 rounded-full bg-background/95 px-2 py-0.5 text-xs font-medium text-foreground shadow-sm">
                        {t("products.cover")}
                    </span>
                </div>
            ) : (
                <label
                    onClick={onUploadClick}
                    className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/40 p-4 text-center transition-colors hover:border-foreground/30 hover:bg-muted md:aspect-square"
                >
                    <ImagePlus className="size-7 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{t("products.addPhoto")}</span>
                    <span className="text-xs text-muted-foreground">{t("products.maxPhotosDesc", { max: maxImages })}</span>
                    <UploadInput isUploading={isUploading} onUploadClick={onUploadClick} onFilesSelected={onFilesSelected} />
                </label>
            )}

            {images.length > 0 && (
                <div className="grid grid-cols-5 gap-1.5">
                    {images.map((url, idx) => (
                        <div key={url} className="group relative aspect-square">
                            <button
                                type="button"
                                onClick={() => onSetCover(url)}
                                aria-label={url === cover ? t("products.cover") : t("products.makeCover")}
                                aria-pressed={url === cover}
                                title={url === cover ? t("products.cover") : t("products.makeCover")}
                                className={cn(
                                    "relative block size-full min-h-0 min-w-0 overflow-hidden rounded-md border-2 bg-muted transition-colors",
                                    url === cover ? "border-primary" : "border-transparent hover:border-foreground/30"
                                )}
                            >
                                <NextImage src={url} fill className="object-cover" alt="" unoptimized />
                            </button>
                            <button
                                type="button"
                                onClick={() => onRemove(idx)}
                                aria-label={t("productForm.removeImage")}
                                className="absolute -right-1.5 -top-1.5 flex size-5 min-h-0 min-w-0 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-opacity hover:text-destructive [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    ))}
                    {canAdd && (
                        <label
                            onClick={onUploadClick}
                            title={t("products.remainingUploads", { count: maxImages - images.length })}
                            className="flex aspect-square cursor-pointer items-center justify-center rounded-md border-2 border-dashed text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                        >
                            <Plus className="size-4" />
                            <span className="sr-only">{t("products.addPhoto")}</span>
                            <UploadInput isUploading={isUploading} onUploadClick={onUploadClick} onFilesSelected={onFilesSelected} />
                        </label>
                    )}
                </div>
            )}

            {isUploading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    )
})
