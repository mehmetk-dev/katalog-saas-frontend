"use client"

import { useState, useCallback } from "react"
import { ChevronLeft, ChevronRight, ExternalLink, ImageOff, Pencil } from "lucide-react"
import NextImage from "next/image"

import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
import { type Product } from "../types"
import { formatProductPrice, isSafeUrl } from "../utils/product-helpers"
import { StockBadge } from "./stock-badge"

/** Önizlemeyi saran DialogContent sınıfları; kapatma düğmesi görselin üstünde de okunur kalsın diye zeminli */
export const PRODUCT_PREVIEW_DIALOG_CLASS = cn(
    "flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl",
    "[&>[data-slot=dialog-close]]:right-3 [&>[data-slot=dialog-close]]:top-3 [&>[data-slot=dialog-close]]:z-10 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-background/90 [&>[data-slot=dialog-close]]:p-1.5 [&>[data-slot=dialog-close]]:opacity-100 [&>[data-slot=dialog-close]]:shadow-sm"
)

interface ProductPreviewDialogProps {
    product: Product
    onEdit: (p: Product) => void
    onClose: () => void
}

export function ProductPreviewDialog({ product, onEdit, onClose }: ProductPreviewDialogProps) {
    const { t } = useTranslation()
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

    const categories = (product.category || "").split(",").map((c) => c.trim()).filter(Boolean)
    const activeImage = allImages[activeImageIndex] || allImages[0]
    const showImage = (delta: number) =>
        setActiveImageIndex((prev) => (prev + delta + allImages.length) % allImages.length)

    return (
        <>
            {/* Masaüstünde solda görsel, sağda bilgiler; mobilde alt alta */}
            <div className="grid min-h-0 flex-1 overflow-y-auto sm:grid-cols-2">
                <div className="space-y-2 border-b bg-muted/40 p-4 sm:border-b-0 sm:border-r sm:p-5">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-background sm:aspect-square">
                        {activeImage ? (
                            <NextImage
                                src={activeImage}
                                alt={product.name}
                                fill
                                className="object-contain"
                                loading="lazy"
                                unoptimized
                                onError={() => handleImageError(activeImage)}
                            />
                        ) : (
                            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                                <ImageOff className="size-8" />
                                <span className="text-xs">{t("products.columns.noImage")}</span>
                            </div>
                        )}
                        {allImages.length > 1 && (
                            <>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => showImage(-1)}
                                    aria-label={t("common.previousImage")}
                                    className="absolute left-2 top-1/2 size-8 -translate-y-1/2 rounded-full bg-background/90 shadow-sm hover:bg-background"
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => showImage(1)}
                                    aria-label={t("common.nextImage")}
                                    className="absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-full bg-background/90 shadow-sm hover:bg-background"
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-2 py-0.5 text-xs tabular-nums text-foreground shadow-sm">
                                    {activeImageIndex + 1}/{allImages.length}
                                </span>
                            </>
                        )}
                    </div>
                    {allImages.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                            {allImages.map((img, idx) => (
                                <button
                                    key={img}
                                    type="button"
                                    onClick={() => setActiveImageIndex(idx)}
                                    aria-label={t("common.imageOf", { index: idx + 1 })}
                                    aria-current={activeImageIndex === idx}
                                    className={cn(
                                        "relative size-12 shrink-0 overflow-hidden rounded-md border-2 bg-background transition-all",
                                        activeImageIndex === idx
                                            ? "border-primary"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                >
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

                <div className="space-y-5 p-5 sm:p-6">
                    <DialogHeader className="gap-1 text-left">
                        <p className="text-xs text-muted-foreground">
                            {categories.length > 0 ? categories.join(" · ") : t("products.uncategorized")}
                        </p>
                        <DialogTitle className="pr-8 text-xl font-semibold leading-tight">{product.name}</DialogTitle>
                        {product.sku && <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>}
                    </DialogHeader>

                    <div className="flex flex-wrap items-start justify-between gap-2 border-y py-4">
                        <div>
                            <p className="text-xs text-muted-foreground">{t("productPreview.price")}</p>
                            <p className="text-2xl font-semibold tabular-nums text-foreground">{formatProductPrice(product)}</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="mb-1.5 text-xs text-muted-foreground">{t("productPreview.stock")}</p>
                            <StockBadge stock={product.stock} t={t} />
                        </div>
                    </div>

                    <section>
                        <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">{t("productPreview.description")}</h4>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                            {product.description || "—"}
                        </p>
                    </section>

                    {customAttrs.length > 0 && (
                        <section>
                            <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">{t("productPreview.attributes")}</h4>
                            <dl className="divide-y rounded-lg border text-sm">
                                {customAttrs.map((attr, idx) => (
                                    <div key={idx} className="flex justify-between gap-4 px-3 py-2">
                                        <dt className="text-muted-foreground">{attr.name}</dt>
                                        <dd className="text-right font-medium text-foreground">{attr.value}{attr.unit && ` ${attr.unit}`}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}

                    {product.product_url && isSafeUrl(product.product_url) && (
                        <section>
                            <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">{t("productPreview.link")}</h4>
                            <a
                                href={product.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-w-0 items-center gap-1 text-sm text-foreground underline-offset-4 hover:underline"
                            >
                                <span className="truncate">{product.product_url}</span>
                                <ExternalLink className="size-3 shrink-0" />
                            </a>
                        </section>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t px-5 py-3">
                <Button size="sm" variant="outline" onClick={onClose}>{t("common.close")}</Button>
                <Button size="sm" onClick={() => { onClose(); onEdit(product) }}>
                    <Pencil className="size-3.5" /> {t("common.edit")}
                </Button>
            </div>
        </>
    )
}
