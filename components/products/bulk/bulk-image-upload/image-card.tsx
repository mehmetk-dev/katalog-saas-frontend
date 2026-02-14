import { AlertCircle, Check, Loader2, X } from "lucide-react"
import NextImage from "next/image"

import { type Product } from "@/lib/actions/products"
import { cn } from "@/lib/utils"
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
    const matchedProduct = products.find((p) => p.id === image.matchedProductId)
    const isError = image.status === "error"
    const isSuccess = image.status === "success"

    const existingImages = matchedProduct?.images || (matchedProduct?.image_url ? [matchedProduct.image_url] : [])
    const pendingBefore = images
        .slice(0, index)
        .filter((item) => item.matchedProductId === image.matchedProductId && (item.status === "pending" || item.status === "uploading"))
        .length

    const isOverLimit = existingImages.length + pendingBefore >= 5

    return (
        <div
            className={cn(
                "bg-white rounded-xl border shadow-sm p-4 flex gap-4 relative group items-start min-h-[9rem] transition-all hover:shadow-md",
                isSuccess && "border-green-200 bg-green-50/50",
                isError && "border-red-200 bg-red-50/50",
                isOverLimit && !isError && "border-amber-200 bg-amber-50/30",
            )}
        >
            <div className="relative w-24 h-24 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <NextImage src={image.preview} fill className="object-cover" alt="Preview" unoptimized />
                {image.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div>
                    <p className="text-xs font-medium truncate text-slate-700" title={image.file.name}>
                        {image.file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{(image.file.size / 1024).toFixed(0)} KB</p>
                </div>

                <div className="w-full">
                    <div className="flex items-center gap-1 mb-1 justify-between">
                        {matchedProduct ? (
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                <Check className="w-3 h-3" /> Eşleşti
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                <AlertCircle className="w-3 h-3" /> Eşleşme Yok
                            </div>
                        )}

                        {isOverLimit && <div className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Limit Dolu</div>}
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
                            <div key={i} className="relative w-5 h-5 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                <NextImage src={url} fill className="object-cover opacity-70" alt={`Mevcut ${i}`} unoptimized />
                            </div>
                        ))}

                        {existingImages.length > 3 && (
                            <div className="w-5 h-5 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-[8px] text-slate-500 shrink-0">
                                +{existingImages.length - 3}
                            </div>
                        )}

                        <div
                            className={cn(
                                "text-[10px] font-medium ml-1 px-1.5 py-0.5 rounded-full border",
                                isOverLimit ? "text-red-600 bg-red-50 border-red-100" : "text-slate-500 bg-slate-50 border-slate-100",
                            )}
                        >
                            {existingImages.length + pendingBefore + 1}/5
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={() => onRemove(image.id)}
                disabled={isUploading}
                className="absolute -top-2 -right-2 w-6 h-6 bg-white border rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-500 z-10"
            >
                <X className="w-3 h-3" />
            </button>

            {isError && (
                <div className="absolute bottom-2 right-2 text-xs text-red-600 bg-white px-2 py-1 rounded shadow-sm border border-red-100">
                    {image.error || "Hata oluştu"}
                </div>
            )}
        </div>
    )
}
