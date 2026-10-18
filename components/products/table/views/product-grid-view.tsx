"use client"

import { Package, Pencil } from "lucide-react"
import NextImage from "next/image"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { type ProductViewProps } from "../types"
import { formatProductPrice } from "../utils/product-helpers"
import { DeleteAlertDialog } from "../components/delete-alert-dialog"
import { PRODUCT_PREVIEW_DIALOG_CLASS, ProductPreviewDialog } from "../components/product-preview-dialog"
import { ProductActionsMenu } from "../components/product-actions-menu"
import { ReorderHandle } from "../components/reorder-handle"
import { StockBadge } from "../components/stock-badge"

export function ProductGridView(props: ProductViewProps) {
    const {
        products,
        selectedIds,
        isMobile,
        isPending,
        canReorder,
        draggingId,
        dropTarget,
        failedImages,
        deleteId,
        deleteCatalogs,
        previewProduct,
        toggleSelect,
        onEdit,
        handleDelete,
        handleDragOver,
        handleDrop,
        handleImageError,
        setPreviewProduct,
        setDeleteId,
        setDeleteCatalogs,
        t,
    } = props

    return (
        <TooltipProvider>
            <div
                // Sabit sütun sayısı yerine en az 12rem genişlik: fiyat + stok her kartta tek satıra sığar
                className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] md:gap-4"
                onDragOver={(e) => { if (draggingId) e.preventDefault() }}
                onDrop={handleDrop}
            >
                {products.map((product, index) => {
                    const isSelected = selectedIds.includes(product.id)
                    const isDragging = draggingId === product.id
                    const dropPosition = dropTarget?.id === product.id ? dropTarget.position : null
                    const imageUrl = (product.image_url || product.images?.[0]) as string | undefined
                    const hasValidImage = !!imageUrl && !failedImages.has(imageUrl)
                    const categories = (product.category || "").split(",").map((c) => c.trim()).filter(Boolean)

                    return (
                        <Card
                            key={product.id}
                            data-product-row
                            onDragOver={canReorder ? (e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, product.id, "x") : undefined}
                            className={cn(
                                // Card'ın varsayılan py-6/gap-6 boşluğu görselin üstünde boşluk bırakıyordu
                                "group relative gap-0 overflow-visible py-0 transition-[box-shadow,border-color] hover:border-foreground/20 hover:shadow-md",
                                isSelected && "ring-2 ring-primary",
                                isDragging && "opacity-40"
                            )}
                        >
                            {dropPosition && (
                                <span
                                    aria-hidden
                                    className={cn(
                                        "pointer-events-none absolute inset-y-2 z-10 w-0.5 rounded-full bg-primary",
                                        dropPosition === "before" ? "-left-[7px] md:-left-[9px]" : "-right-[7px] md:-right-[9px]"
                                    )}
                                />
                            )}

                            {/* Resim alanı */}
                            <div className="relative aspect-square overflow-hidden rounded-t-xl border-b bg-muted/50">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Package className="size-8 text-muted-foreground/40" />
                                </div>

                                {hasValidImage && (
                                    <NextImage
                                        src={imageUrl}
                                        alt=""
                                        fill
                                        className={cn(
                                            "z-[1] object-cover transition-transform duration-300 group-hover:scale-[1.03]",
                                            // Tükenen ürün görselden de ayırt edilsin
                                            product.stock === 0 && "opacity-50 grayscale"
                                        )}
                                        loading="lazy"
                                        unoptimized
                                        draggable={false}
                                        onError={() => handleImageError(imageUrl)}
                                    />
                                )}

                                <div className={cn(
                                    "absolute left-2 top-2 z-[5] transition-opacity",
                                    isSelected
                                        ? "opacity-100"
                                        : isMobile
                                            ? "opacity-70"
                                            // Fare yoksa (dokunmatik tablet) hover hiç olmaz; kutu hep görünür
                                            : "opacity-0 focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                                )}>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSelect(product.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={product.name}
                                        className="size-4 border-border bg-background/95 shadow-sm"
                                    />
                                </div>

                                {/* Sağ üst: sıralama tutamacı + menü (dokunmatikte menü hep görünür) */}
                                <div className="absolute right-2 top-2 z-[5] flex gap-1">
                                    {canReorder && !isMobile && (
                                        <ReorderHandle
                                            product={product}
                                            view={props}
                                            className="size-7 bg-background/95 opacity-0 shadow-sm focus-visible:opacity-100 group-hover:opacity-100"
                                        />
                                    )}
                                    <ProductActionsMenu
                                        product={product}
                                        index={index}
                                        total={products.length}
                                        view={props}
                                        triggerClassName={cn(
                                            // Mobildeki genel 44px dokunma kuralı görselin üstünde kocaman kare yapıyordu
                                            "size-8 min-h-0 min-w-0 bg-background/90 text-foreground shadow-sm hover:bg-background data-[state=open]:opacity-100 md:size-7",
                                            !isMobile && "opacity-0 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                                        )}
                                    />
                                </div>

                                {!isMobile && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="absolute bottom-2 right-2 z-[5] h-7 gap-1.5 bg-background/95 px-2.5 text-xs opacity-0 shadow-sm transition-opacity hover:bg-background focus-visible:opacity-100 group-hover:opacity-100"
                                        onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                    >
                                        <Pencil className="size-3.5" />
                                        {t("common.edit")}
                                    </Button>
                                )}
                            </div>

                            {/* İçerik alanı: kategori → ad → fiyat/stok. Alt satır her kartta aynı hizada kalır */}
                            <div className="flex flex-1 flex-col p-3">
                                <p className="truncate text-xs text-muted-foreground" title={categories.join(", ") || undefined}>
                                    {categories[0] ?? t("products.uncategorized")}
                                    {categories.length > 1 && <span className="tabular-nums"> · +{categories.length - 1}</span>}
                                </p>
                                <h3 className="mt-0.5 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-foreground">
                                    {/* Kartın tamamı önizlemeyi açar (after: ile tıklama alanı kartı kaplar) */}
                                    <button
                                        type="button"
                                        onClick={() => setPreviewProduct(product)}
                                        title={product.name}
                                        className="text-left outline-none after:absolute after:inset-0 after:z-[2] after:rounded-xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring"
                                    >
                                        {product.name}
                                    </button>
                                </h3>
                                <div className="mt-auto flex flex-col items-start gap-1 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-2">
                                    <span className="text-sm font-semibold tabular-nums text-foreground">
                                        {formatProductPrice(product)}
                                    </span>
                                    <StockBadge stock={product.stock} t={t} />
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Liste görünümüyle aynı önizleme */}
            <Dialog open={!!previewProduct} onOpenChange={() => setPreviewProduct(null)}>
                <DialogContent className={PRODUCT_PREVIEW_DIALOG_CLASS}>
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
