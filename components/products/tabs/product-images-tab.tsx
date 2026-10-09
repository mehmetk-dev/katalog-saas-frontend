"use client"

import React, { memo } from "react"
import NextImage from "next/image"
import { Trash2, Upload, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
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

// ─── Component ───────────────────────────────────────────────────────
export const ProductImagesTab = memo(function ProductImagesTab({
    images, activeImageUrl, isUploading,
    onSetCover, onRemove, onFilesSelected, onUploadClick,
    maxImages = MAX_PRODUCT_IMAGES, t,
}: ProductImagesTabProps) {
    return (
        <div className="relative p-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((url, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "relative aspect-square rounded-xl border overflow-hidden group shadow-sm bg-card",
                            activeImageUrl === url && "ring-2 ring-primary ring-offset-2"
                        )}
                    >
                        <NextImage src={url} fill className="object-cover" alt={t("productForm.imageAlt", { index: idx + 1 })} unoptimized />

                        {/* İşlemler: dokunmatik ekranda her zaman, farede üzerine gelince görünür */}
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-foreground/60 to-transparent p-2 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
                            {activeImageUrl !== url && (
                                <Button type="button" size="sm" variant="secondary" className="h-8 text-xs" onClick={() => onSetCover(url)}>
                                    <Sparkles className="w-3.5 h-3.5 mr-1" /> {t("products.makeCover")}
                                </Button>
                            )}
                            <Button type="button" size="icon" variant="destructive" className="ml-auto h-8 w-8" onClick={() => onRemove(idx)} aria-label={t("productForm.removeImage")}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Cover badge */}
                        {activeImageUrl === url && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center shadow-sm">
                                <Sparkles className="w-3 h-3 mr-1" /> {t("products.cover")}
                            </div>
                        )}
                    </div>
                ))}

                {/* Upload slot */}
                {images.length < maxImages && (
                    <label
                        onClick={onUploadClick}
                        className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl cursor-pointer hover:bg-accent hover:border-border transition-all group bg-muted/50"
                    >
                        <div className="p-3 rounded-full bg-card shadow-sm mb-2 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{t("products.addPhoto")}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{t("products.remainingUploads", { count: maxImages - images.length })}</span>
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
                    </label>
                )}

                {/* Uploading overlay */}
                {isUploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl backdrop-blur-[1px] z-10">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                )}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">{t("products.maxPhotosDesc", { max: maxImages })}</p>
        </div>
    )
})
