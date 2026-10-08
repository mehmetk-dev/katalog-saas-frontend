"use client"

import React, { memo } from "react"
import NextImage from "next/image"
import { Trash2, Upload, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
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
    maxImages = 5, t,
}: ProductImagesTabProps) {
    return (
        <div className="p-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((url, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "relative aspect-square rounded-xl border overflow-hidden group shadow-sm bg-card",
                            activeImageUrl === url && "ring-2 ring-primary ring-offset-2"
                        )}
                    >
                        <NextImage src={url} fill className="object-cover" alt={`Ürün görseli ${idx + 1}`} unoptimized />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            {activeImageUrl !== url && (
                                <Button type="button" size="sm" variant="secondary" className="h-8 text-xs bg-background/90 hover:bg-card" onClick={() => onSetCover(url)}>
                                    <Sparkles className="w-3.5 h-3.5 mr-1" /> {t("products.makeCover")}
                                </Button>
                            )}
                            <Button type="button" size="icon" variant="destructive" className="h-8 w-8" onClick={() => onRemove(idx)} aria-label="Fotoğrafı sil">
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
            <p className="text-[10px] text-muted-foreground mt-4 text-center">{t("products.maxPhotosDesc")}</p>
        </div>
    )
})
