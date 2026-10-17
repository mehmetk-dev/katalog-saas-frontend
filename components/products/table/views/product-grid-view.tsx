"use client"

import { Eye, Package, Pencil } from "lucide-react"
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
import { ProductPreviewDialog } from "../components/product-preview-dialog"
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
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6"
                onDragOver={(e) => { if (draggingId) e.preventDefault() }}
                onDrop={handleDrop}
            >
                {products.map((product, index) => {
                    const isSelected = selectedIds.includes(product.id)
                    const isDragging = draggingId === product.id
                    const dropPosition = dropTarget?.id === product.id ? dropTarget.position : null
                    const imageUrl = (product.image_url || product.images?.[0]) as string | undefined
                    const hasValidImage = !!imageUrl && !failedImages.has(imageUrl)

                    return (
                        <Card
                            key={product.id}
                            data-product-row
                            onDragOver={canReorder ? (e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, product.id, "x") : undefined}
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
                                "group relative gap-0 overflow-visible py-0 transition-shadow hover:shadow-md",
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
                            <div className="relative aspect-square overflow-hidden rounded-t-xl bg-muted/50">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Package className="size-8 text-muted-foreground/40" />
                                </div>

                                {hasValidImage && (
                                    <NextImage
                                        src={imageUrl}
                                        alt={product.name}
                                        fill
                                        className="z-[1] object-cover"
                                        loading="lazy"
                                        unoptimized
                                        draggable={false}
                                        onError={() => handleImageError(imageUrl)}
                                    />
                                )}

                                <div className={cn(
                                    "absolute left-1.5 top-1.5 z-[5] transition-opacity",
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

                                {canReorder && !isMobile && (
                                    <ReorderHandle
                                        product={product}
                                        view={props}
                                        className="absolute right-1.5 top-1.5 z-[5] size-7 bg-background/95 opacity-0 shadow-sm focus-visible:opacity-100 group-hover:opacity-100"
                                    />
                                )}

                                <div className={cn(
                                    "absolute bottom-2 right-2 z-[5] flex gap-1 transition-opacity",
                                    isMobile ? "hidden" : "opacity-0 focus-within:opacity-100 group-hover:opacity-100"
                                )}>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="size-7 bg-background/95 shadow-sm hover:bg-card"
                                        onClick={(e) => { e.stopPropagation(); setPreviewProduct(product); }}
                                        aria-label={t("products.preview")}
                                        title={t("products.preview")}
                                    >
                                        <Eye className="size-3.5" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="size-7 bg-background/95 shadow-sm hover:bg-card"
                                        onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                        aria-label={t("common.edit")}
                                        title={t("common.edit")}
                                    >
                                        <Pencil className="size-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* İçerik alanı */}
                            <div className="space-y-1 p-3">
                                {/* İki satıra kadar ad; sabit yükseklik kart hizasını korur */}
                                <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-foreground" title={product.name}>
                                    {product.name}
                                </h3>
                                <p className="truncate text-xs text-muted-foreground" title={product.category || undefined}>
                                    {product.category ? product.category.split(",").map((c) => c.trim()).filter(Boolean).join(" · ") : "—"}
                                </p>
                                <p className="text-sm font-semibold tabular-nums text-foreground">
                                    {formatProductPrice(product)}
                                </p>
                                <div className="flex items-center justify-between pt-1">
                                    <StockBadge stock={product.stock} t={t} />
                                    <ProductActionsMenu
                                        product={product}
                                        index={index}
                                        total={products.length}
                                        view={props}
                                        triggerClassName="-mr-1.5 size-7"
                                    />
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Liste görünümüyle aynı önizleme */}
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
        </TooltipProvider>
    )
}
