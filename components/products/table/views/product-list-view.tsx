"use client"

import { ArrowDown, ArrowUp, ChevronsUpDown, MoreHorizontal, Pencil, Trash2, Copy, Package, Eye, ExternalLink } from "lucide-react"
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
import { TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { type ProductViewProps, type ProductsTableSort, type SortableColumn } from "../types"
import { getStockStatus, formatProductPrice, isSafeUrl } from "../utils/product-helpers"
import { DeleteAlertDialog } from "../components/delete-alert-dialog"
import { ProductPreviewDialog } from "../components/product-preview-dialog"

/** Masaüstü satır ızgarası: seçim | ürün | fiyat | stok | kategori | aksiyonlar */
const ROW_GRID = "md:grid-cols-[1.25rem_minmax(0,1fr)_8rem_7rem_minmax(0,10rem)_4.5rem]"

function SortHeader({ column, label, sort, t, align = "left" }: {
    column: SortableColumn
    label: string
    sort?: ProductsTableSort
    t: ProductViewProps["t"]
    align?: "left" | "right" | "center"
}) {
    const active = sort?.field === column
    const Icon = !active ? ChevronsUpDown : sort.order === "asc" ? ArrowUp : ArrowDown
    if (!sort) return <span className={cn(align === "right" && "text-right", align === "center" && "text-center")}>{label}</span>
    return (
        <button
            type="button"
            onClick={() => sort.onSort(column)}
            aria-label={t("products.sortByColumn", { column: label })}
            aria-sort={active ? (sort.order === "asc" ? "ascending" : "descending") : undefined}
            className={cn(
                "group/sort inline-flex items-center gap-1 rounded hover:text-foreground",
                align === "right" && "justify-self-end",
                align === "center" && "justify-self-center",
                active && "text-foreground"
            )}
        >
            {label}
            <Icon className={cn("size-3.5", !active && "opacity-0 group-hover/sort:opacity-60")} />
        </button>
    )
}

function StockBadge({ stock, variant, className, t }: { stock: number; variant: "default" | "secondary" | "destructive"; className?: string; t: ProductViewProps["t"] }) {
    return (
        <Badge
            variant={variant === "destructive" ? "outline" : variant === "secondary" ? "warning" : "success"}
            className={cn(
                "tabular-nums",
                variant === "destructive" && "border-destructive/20 bg-destructive-soft text-destructive-soft-foreground",
                className
            )}
        >
            {t("products.unitCount", { count: stock })}
        </Badge>
    )
}

export function ProductListView({
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
    toggleSelectAll,
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
    sort,
}: ProductViewProps) {
    return (
        <TooltipProvider>
            <div className="overflow-hidden rounded-xl border bg-card">
                {/* Tablo başlığı */}
                <div className={cn("hidden gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground md:grid md:items-center", ROW_GRID)}>
                    {/* Tümünü seç toolbar'da (bütün sayfalar); burada ikinci bir seçici kafa karıştırıyordu */}
                    <span aria-hidden />
                    <SortHeader column="name" label={t("products.name")} sort={sort} t={t} />
                    <SortHeader column="price" label={t("products.price")} sort={sort} t={t} align="right" />
                    <SortHeader column="stock" label={t("products.stock")} sort={sort} t={t} align="center" />
                    <SortHeader column="category" label={t("products.category")} sort={sort} t={t} />
                    <span className="sr-only">{t("products.actions")}</span>
                </div>

                {/* Ürün Listesi */}
                <div className="divide-y">
                    {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product.stock)
                        const isSelected = selectedIds.includes(product.id)
                        const isDragging = draggingId === product.id
                        const isDragOver = dragOverId === product.id

                        return (
                            <div
                                key={product.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, product.id)}
                                onDragOver={(e) => handleDragOver(e, product.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, product.id)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                    "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 transition-colors sm:px-4 md:gap-4",
                                    ROW_GRID,
                                    "hover:bg-muted/40",
                                    isSelected && "bg-accent/60 hover:bg-accent/60",
                                    isDragging && "opacity-50",
                                    isDragOver && "shadow-[inset_0_2px_0_0_var(--primary)]"
                                )}
                                onClick={(e) => {
                                    if (isMobile && !e.defaultPrevented && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                                        setPreviewProduct(product)
                                    }
                                }}
                            >
                                {/* Seçim */}
                                <div className="flex items-center">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSelect(product.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={product.name}
                                    />
                                </div>

                                {/* Ürün: görsel + ad + SKU */}
                                <div className="flex min-w-0 cursor-grab items-center gap-3 active:cursor-grabbing">
                                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Package className="size-4 text-muted-foreground/60" />
                                        </div>
                                        {(() => {
                                            const imageUrl = (product.image_url || product.images?.[0]) as string | undefined
                                            const hasValidImage = imageUrl && !failedImages.has(imageUrl)

                                            return hasValidImage ? (
                                                <NextImage
                                                    src={imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                    loading="lazy"
                                                    unoptimized
                                                    onError={() => handleImageError(imageUrl)}
                                                />
                                            ) : null
                                        })()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="truncate text-sm font-medium text-foreground">{product.name}</h3>
                                            {product.product_url && isSafeUrl(product.product_url) && (
                                                <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                                                    <ExternalLink className="size-3" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {product.sku && <span className="truncate font-mono">{product.sku}</span>}
                                            {/* Mobil: fiyat + stok */}
                                            <span className="font-medium tabular-nums text-foreground md:hidden">{formatProductPrice(product)}</span>
                                            <StockBadge stock={product.stock} variant={stockStatus.variant} className="md:hidden" t={t} />
                                        </div>
                                    </div>
                                </div>

                                {/* Fiyat */}
                                <div className="hidden text-right text-sm font-medium tabular-nums text-foreground md:block">
                                    {formatProductPrice(product)}
                                </div>

                                {/* Stok */}
                                <div className="hidden justify-center md:flex">
                                    <StockBadge stock={product.stock} variant={stockStatus.variant} t={t} />
                                </div>

                                {/* Kategori */}
                                <div className="hidden min-w-0 md:block">
                                    {product.category ? (
                                        <span className="block truncate text-sm text-muted-foreground" title={product.category}>
                                            {product.category.split(',')[0].trim()}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-muted-foreground/50">—</span>
                                    )}
                                </div>

                                {/* Aksiyonlar */}
                                <div className="flex items-center justify-end gap-0.5">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="hidden text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 sm:inline-flex"
                                        onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                        aria-label={t("common.edit")}
                                        title={t("common.edit")}
                                    >
                                        <Pencil className="size-4" />
                                    </Button>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label={t("products.actions")}>
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="gap-2" onClick={() => setPreviewProduct(product)}>
                                                <Eye className="w-4 h-4" /> {t("products.preview")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2" onClick={() => onEdit(product)}>
                                                <Pencil className="w-4 h-4" /> {t("common.edit")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2" onClick={() => handleDuplicate(product)} disabled={isPending}>
                                                <Copy className="w-4 h-4" /> {t("products.duplicate")}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="gap-2" variant="destructive" onClick={() => initiateDelete(product.id)}>
                                                <Trash2 className="w-4 h-4" /> {t("common.delete")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {filteredProducts.length === 0 && allProducts.length > 0 && (
                    <div className="p-8 text-center text-muted-foreground">{t("products.noProducts")}</div>
                )}
            </div>

            {/* Preview Dialog */}
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
