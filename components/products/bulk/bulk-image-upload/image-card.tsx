import { AlertCircle, Check, Loader2, X } from "lucide-react"
import NextImage from "next/image"

import { type Product } from "@/lib/actions/products"
import { MAX_PRODUCT_IMAGES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { ProductSelector } from "./product-selector"
import { type ImageFile } from "./types"

interface ImageCardProps {
    image: ImageFile
    index: number
    images: ImageFile[]
    products: Product[]
    sortedProducts: Product[]
    isUploading: boolean
    onRemove: (id: string) => void
    onMatchChange: (imageId: string, productId: string) => void
}

export function ImageCard({
    image,
    index,
    images,
    products,
    sortedProducts,
    isUploading,
    onRemove,
    onMatchChange,
}: ImageCardProps) {
    const { t } = useTranslation()
    const matchedProduct = products.find((p) => p.id === image.matchedProductId)
    const isError = image.status === "error"
    const isSuccess = image.status === "success"

    const existingImages = matchedProduct?.images || (matchedProduct?.image_url ? [matchedProduct.image_url] : [])
    const pendingBefore = images
        .slice(0, index)
        .filter((item) => item.matchedProductId === image.matchedProductId && (item.status === "pending" || item.status === "uploading"))
        .length

    // Sınır ürün penceresi ve backend ile aynı (önceden 5)
    const isOverLimit = existingImages.length + pendingBefore >= MAX_PRODUCT_IMAGES

    return (
        <div
            className={cn(
                "bg-card rounded-xl border shadow-sm p-4 flex gap-4 relative group items-start min-h-[9rem] transition-all hover:shadow-md",
                isSuccess && "border-success/20 bg-success-soft/50",
                isError && "border-destructive/20 bg-destructive-soft/50",
                isOverLimit && !isError && "border-warning/30 bg-warning-soft/30",
            )}
        >
            <div className="relative w-24 h-24 shrink-0 bg-muted rounded-lg overflow-hidden border border-border">
                <NextImage src={image.preview} fill className="object-cover" alt="" unoptimized />
                {image.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div>
                    <p className="text-xs font-medium truncate text-foreground" title={image.file.name}>
                        {image.file.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{(image.file.size / 1024).toFixed(0)} KB</p>
                </div>

                <div className="w-full">
                    <div className="flex items-center gap-1 mb-1 justify-between">
                        {matchedProduct ? (
                            <div className="flex items-center gap-1 text-xs font-medium text-success-soft-foreground bg-success-soft px-1.5 py-0.5 rounded">
                                <Check className="w-3 h-3" /> {t("bulkImages.matched")}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-xs font-medium text-warning-soft-foreground bg-warning-soft px-1.5 py-0.5 rounded">
                                <AlertCircle className="w-3 h-3" /> {t("bulkImages.notMatched")}
                            </div>
                        )}

                        {isOverLimit && <div className="text-xs font-medium text-destructive-soft-foreground bg-destructive-soft px-1.5 py-0.5 rounded">{t("bulkImages.limitReached")}</div>}
                    </div>

                    <ProductSelector
                        allProducts={sortedProducts}
                        selectedProductId={image.matchedProductId || "none"}
                        onSelect={(productId) => onMatchChange(image.id, productId)}
                        disabled={isSuccess || isUploading}
                        matchedProduct={matchedProduct}
                    />
                </div>

                {matchedProduct && (
                    <div className="flex gap-1 mt-1 items-center">
                        {existingImages.slice(0, 3).map((url, i) => (
                            <div key={i} className="relative w-5 h-5 rounded-full overflow-hidden border border-border bg-muted shrink-0">
                                <NextImage src={url} fill className="object-cover opacity-70" alt={`Mevcut ${i}`} unoptimized />
                            </div>
                        ))}

                        {existingImages.length > 3 && (
                            <div className="w-5 h-5 rounded-full border border-border bg-muted flex items-center justify-center text-[8px] text-muted-foreground shrink-0">
                                +{existingImages.length - 3}
                            </div>
                        )}

                        <div
                            className={cn(
                                "text-[10px] font-medium ml-1 px-1.5 py-0.5 rounded-full border",
                                isOverLimit ? "text-destructive bg-destructive-soft border-destructive/20" : "text-muted-foreground bg-muted/50 border-border",
                            )}
                        >
                            {existingImages.length + pendingBefore + 1}/{MAX_PRODUCT_IMAGES}
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={() => onRemove(image.id)}
                disabled={isUploading}
                className="absolute -top-2 -right-2 w-6 h-6 bg-card border rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/15 text-destructive z-10"
            >
                <X className="w-3 h-3" />
            </button>

            {isError && (
                <div className="absolute bottom-2 right-2 text-xs text-destructive bg-card px-2 py-1 rounded shadow-sm border border-destructive/20">
                    {image.error || t("bulkImages.cardError")}
                </div>
            )}
        </div>
    )
}
