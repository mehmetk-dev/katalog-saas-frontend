"use client"

import { ArrowDown, ArrowUp, ChevronsUpDown, ImageOff, Pencil, Package, ExternalLink } from "lucide-react"
import NextImage from "next/image"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { type Product, type ProductColumn, type ProductViewProps, type ProductsTableSort, type SortableColumn } from "../types"
import { formatProductPrice, isSafeUrl } from "../utils/product-helpers"
import { DeleteAlertDialog } from "../components/delete-alert-dialog"
import { PRODUCT_PREVIEW_DIALOG_CLASS, ProductPreviewDialog } from "../components/product-preview-dialog"
import { ProductActionsMenu } from "../components/product-actions-menu"
import { ReorderHandle } from "../components/reorder-handle"
import { StockBadge } from "../components/stock-badge"
import { EditableNumberCell } from "../components/editable-number-cell"

/** Açılıp kapatılabilen sütunların masaüstü genişlikleri (ızgara sırası PRODUCT_COLUMNS ile aynı) */
const COLUMN_WIDTHS: Record<ProductColumn, string> = {
    sku: "minmax(0,8rem)",
    price: "8rem",
    stock: "7rem",
    category: "minmax(0,10rem)",
    catalogs: "6.5rem",
    updated: "6.5rem",
}

/** Masaüstü satır ızgarası: [tutamaç] | seçim | ürün | ...görünür sütunlar | aksiyonlar */
function buildRowTemplate(columns: ProductColumn[], canReorder: boolean): string {
    return [
        ...(canReorder ? ["1.25rem"] : []),
        "1.25rem",
        "minmax(12rem,1fr)",
        ...columns.map((column) => COLUMN_WIDTHS[column]),
        "4.5rem",
    ].join(" ")
}

const formatShortDate = (value: string) =>
    new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))

function splitCategories(category: string | null): string[] {
    return (category || "").split(",").map((c) => c.trim()).filter(Boolean)
}

function CategoryCell({ category }: { category: string | null }) {
    const categories = splitCategories(category)
    if (categories.length === 0) return <span className="text-sm text-muted-foreground/50">—</span>
    return (
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground" title={categories.join(", ")}>
            <span className="truncate">{categories[0]}</span>
            {categories.length > 1 && (
                <span className="shrink-0 rounded bg-muted px-1 text-xs font-medium tabular-nums text-muted-foreground">
                    +{categories.length - 1}
                </span>
            )}
        </span>
    )
}

function CatalogsCell({ product, catalogsByProduct, t }: {
    product: Product
    catalogsByProduct: ProductViewProps["productCatalogs"]
    t: ProductViewProps["t"]
}) {
    if (!catalogsByProduct) return <span aria-hidden className="block h-4 w-8 animate-pulse rounded bg-muted" />
    const catalogs = catalogsByProduct.get(product.id) || []
    if (catalogs.length === 0) {
        return <span className="text-sm text-muted-foreground/50" title={t("products.columns.notInCatalogs")}>—</span>
    }
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-flex cursor-default items-center rounded-full border bg-background px-2 py-0.5 text-xs font-medium tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {t("products.columns.catalogCount", { count: catalogs.length })}
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-60">
                <ul className="space-y-0.5">
                    {catalogs.slice(0, 8).map((catalog) => <li key={catalog.id} className="truncate">{catalog.name}</li>)}
                    {catalogs.length > 8 && <li className="opacity-70">+{catalogs.length - 8}</li>}
                </ul>
            </TooltipContent>
        </Tooltip>
    )
}

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
                "group/sort relative inline-flex items-center rounded hover:text-foreground",
                align === "right" && "justify-self-end",
                align === "center" && "justify-self-center",
                active && "text-foreground"
            )}
        >
            {label}
            {/* İkon akışın dışında: başlık metni sütundaki değerlerle aynı hizada kalır */}
            <Icon
                className={cn(
                    "absolute top-1/2 size-3.5 -translate-y-1/2",
                    align === "right" ? "right-full mr-1" : "left-full ml-1",
                    !active && "opacity-0 group-hover/sort:opacity-60"
                )}
            />
        </button>
    )
}

export function ProductListView(props: ProductViewProps) {
    const {
        products,
        selectedIds,
        canReorder,
        draggingId,
        dropTarget,
        failedImages,
        deleteId,
        deleteCatalogs,
        isPending,
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
        sort,
        pageSelection,
        visibleColumns,
        productCatalogs,
        onInlineUpdate,
    } = props
    const show = (column: ProductColumn) => visibleColumns.includes(column)
    // Sütun seti kullanıcıya göre değiştiği için ızgara şablonu CSS değişkeniyle verilir (md ve üstü)
    const rowStyle = { "--product-row-cols": buildRowTemplate(visibleColumns, canReorder) } as React.CSSProperties
    const rowGrid = "md:[grid-template-columns:var(--product-row-cols)]"

    return (
        <TooltipProvider>
            {/* overflow-clip (hidden değil): köşeleri keser ama yapışkan başlığı bozmaz */}
            <div className="overflow-clip rounded-xl border bg-card">
                {/* Tablo başlığı */}
                <div style={rowStyle} className={cn(
                    // Uzun listede kaydırırken başlık üstte kalır; zemin opak olmalı (altından satır görünmesin)
                    "sticky top-0 z-10 hidden gap-4 md:-top-6 border-b bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))] px-4 py-2 text-xs font-medium text-muted-foreground md:grid md:items-center",
                    rowGrid
                )}>
                    {canReorder && <span aria-hidden />}
                    <Checkbox
                        checked={pageSelection.checked}
                        onCheckedChange={(checked) => pageSelection.onToggle(checked === true)}
                        aria-label={t("products.selectPageProducts")}
                    />
                    <SortHeader column="name" label={t("products.name")} sort={sort} t={t} />
                    {show("sku") && <span>{t("products.columns.sku")}</span>}
                    {show("price") && <SortHeader column="price" label={t("products.price")} sort={sort} t={t} align="right" />}
                    {show("stock") && <SortHeader column="stock" label={t("products.stock")} sort={sort} t={t} align="center" />}
                    {show("category") && <SortHeader column="category" label={t("products.category")} sort={sort} t={t} />}
                    {show("catalogs") && <span>{t("products.columns.catalogs")}</span>}
                    {show("updated") && <span>{t("products.columns.updated")}</span>}
                    <span className="sr-only">{t("products.actions")}</span>
                </div>

                {/* Ürün Listesi */}
                <div
                    className="divide-y"
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
                            <div
                                key={product.id}
                                data-product-row
                                style={rowStyle}
                                onDragOver={canReorder ? (e) => handleDragOver(e, product.id, "y") : undefined}
                                className={cn(
                                    "group relative grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 bg-card px-3 py-2 transition-colors sm:px-4 md:gap-4",
                                    rowGrid,
                                    "hover:bg-muted/40",
                                    isSelected && "bg-primary/5 hover:bg-primary/5",
                                    isDragging && "opacity-40"
                                )}
                                onClick={(e) => {
                                    // Satırın boş yerine tıklamak önizlemeyi açar (ürün adı düzenlemeyi açar);
                                    // düğme, bağlantı, onay kutusu, satır içi düzenleme ve metin seçimi hariç
                                    if (e.defaultPrevented) return
                                    if ((e.target as HTMLElement).closest("button, a, input, label, [role=checkbox], [role=menuitem]")) return
                                    if (window.getSelection()?.toString()) return
                                    setPreviewProduct(product)
                                }}
                            >
                                {isSelected && <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-primary" />}
                                {dropPosition && (
                                    <span
                                        aria-hidden
                                        className={cn(
                                            "pointer-events-none absolute inset-x-2 z-10 h-0.5 rounded-full bg-primary",
                                            dropPosition === "before" ? "-top-px" : "-bottom-px"
                                        )}
                                    />
                                )}

                                {canReorder && (
                                    <ReorderHandle
                                        product={product}
                                        view={props}
                                        className="hidden h-8 w-5 opacity-0 focus-visible:opacity-100 group-hover:opacity-100 md:flex"
                                    />
                                )}

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
                                <div className="flex min-w-0 items-center gap-3">
                                    <div
                                        className={cn("relative size-10 shrink-0 overflow-hidden rounded-lg border bg-muted", !imageUrl && "border-dashed")}
                                        title={!imageUrl ? t("products.columns.noImage") : undefined}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {imageUrl ? <Package className="size-4 text-muted-foreground/60" /> : <ImageOff aria-label={t("products.columns.noImage")} className="size-4 text-muted-foreground/60" />}
                                        </div>
                                        {hasValidImage && (
                                            <NextImage
                                                src={imageUrl}
                                                alt={product.name}
                                                fill
                                                className={cn("object-cover", product.stock === 0 && "opacity-50 grayscale")}
                                                loading="lazy"
                                                unoptimized
                                                draggable={false}
                                                onError={() => handleImageError(imageUrl)}
                                            />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); onEdit(product) }}
                                                className="truncate text-left text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                                                title={product.name}
                                            >
                                                {product.name}
                                            </button>
                                            {product.product_url && isSafeUrl(product.product_url) && (
                                                <a
                                                    href={product.product_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0 text-muted-foreground hover:text-foreground"
                                                    onClick={(e) => e.stopPropagation()}
                                                    aria-label={t("products.openProductLink")}
                                                >
                                                    <ExternalLink className="size-3" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {/* SKU sütunu açıksa masaüstünde orada; mobilde her zaman burada */}
                                            {product.sku && <span className={cn("truncate font-mono", show("sku") && "md:hidden")}>{product.sku}</span>}
                                            {/* Mobil: fiyat + stok */}
                                            <span className="font-medium tabular-nums text-foreground md:hidden">{formatProductPrice(product)}</span>
                                            <StockBadge stock={product.stock} className="md:hidden" t={t} />
                                        </div>
                                    </div>
                                </div>

                                {show("sku") && (
                                    <div className="hidden min-w-0 md:block">
                                        {product.sku
                                            ? <span className="block truncate font-mono text-xs text-muted-foreground" title={product.sku}>{product.sku}</span>
                                            : <span className="text-sm text-muted-foreground/50">—</span>}
                                    </div>
                                )}

                                {show("price") && (
                                    <div className="hidden text-sm font-medium tabular-nums text-foreground md:block">
                                        {onInlineUpdate ? (
                                            <EditableNumberCell
                                                value={Number(product.price) || 0}
                                                label={t("products.inlineEdit.price", { name: product.name })}
                                                onSave={(price) => onInlineUpdate(product, { price })}
                                            >
                                                {formatProductPrice(product)}
                                            </EditableNumberCell>
                                        ) : (
                                            <div className="text-right">{formatProductPrice(product)}</div>
                                        )}
                                    </div>
                                )}

                                {show("stock") && (
                                    <div className="hidden justify-center md:flex">
                                        {onInlineUpdate ? (
                                            <EditableNumberCell
                                                value={product.stock}
                                                integer
                                                align="center"
                                                label={t("products.inlineEdit.stock", { name: product.name })}
                                                onSave={(stock) => onInlineUpdate(product, { stock })}
                                            >
                                                <StockBadge stock={product.stock} t={t} />
                                            </EditableNumberCell>
                                        ) : (
                                            <StockBadge stock={product.stock} t={t} />
                                        )}
                                    </div>
                                )}

                                {show("category") && (
                                    <div className="hidden min-w-0 md:block">
                                        <CategoryCell category={product.category} />
                                    </div>
                                )}

                                {show("catalogs") && (
                                    <div className="hidden md:block">
                                        <CatalogsCell product={product} catalogsByProduct={productCatalogs} t={t} />
                                    </div>
                                )}

                                {show("updated") && (
                                    <div className="hidden text-xs tabular-nums text-muted-foreground md:block">
                                        {product.updated_at ? formatShortDate(product.updated_at) : "—"}
                                    </div>
                                )}

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
                                    <ProductActionsMenu product={product} index={index} total={products.length} view={props} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Preview Dialog */}
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
