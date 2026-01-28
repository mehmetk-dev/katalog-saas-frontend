"use client"

import { useState, useTransition, useEffect } from "react"
import { GripVertical, MoreHorizontal, Pencil, Trash2, Copy, Package, Eye, ImageOff, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import NextImage from "next/image"
import { toast } from "sonner"

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
import { Card } from "@/components/ui/card"
import { type Product, deleteProduct, createProduct, updateProductOrder, checkProductInCatalogs } from "@/lib/actions/products"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useTranslation } from "@/lib/i18n-provider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProductsTableProps {
  products: Product[]
  allProducts?: Product[]
  search: string
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  onEdit: (product: Product) => void
  onDeleted: (id: string) => void
  viewMode?: "grid" | "list"
  onProductsReorder?: (products: Product[]) => void
}

export function ProductsTable({
  products,
  allProducts = products,
  search,
  selectedIds,
  onSelectedIdsChange,
  onEdit,
  onDeleted,
  viewMode = "list",
  onProductsReorder,
}: ProductsTableProps) {
  const { t } = useTranslation()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteCatalogs, setDeleteCatalogs] = useState<{ id: string; name: string }[]>([])
  const [, setIsCheckingCatalogs] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isMobile, setIsMobile] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Reset image index when preview product changes
  useEffect(() => {
    setActiveImageIndex(0)
  }, [previewProduct])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const filteredProducts = search
    ? products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase()) ||
      product.category?.toLowerCase().includes(search.toLowerCase())
    )
    : products

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      onSelectedIdsChange([])
    } else {
      onSelectedIdsChange(filteredProducts.map((p) => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectedIdsChange([...selectedIds, id])
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Stok Yok", variant: "destructive" as const }
    if (stock < 10) return { label: "Az Stok", variant: "secondary" as const }
    return { label: "Stokta", variant: "default" as const }
  }

  // Silmeden önce katalog kontrolü yap
  const initiateDelete = async (id: string) => {
    setIsCheckingCatalogs(true)
    try {
      const result = await checkProductInCatalogs(id)
      setDeleteCatalogs(result.catalogs)
      setDeleteId(id)
    } catch {
      setDeleteCatalogs([])
      setDeleteId(id)
    } finally {
      setIsCheckingCatalogs(false)
    }
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteProduct(id)
        onDeleted(id)
        setDeleteId(null)
        setDeleteCatalogs([])
        toast.success(t("common.success"))
      } catch {
        toast.error(t("common.error"))
      }
    })
  }

  const handleDuplicate = (product: Product) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("name", `${product.name} (Kopyası)`)
        if (product.sku) formData.append("sku", product.sku)
        if (product.description) formData.append("description", product.description)
        formData.append("price", product.price.toString())
        formData.append("stock", product.stock.toString())
        if (product.category) formData.append("category", product.category)
        if (product.image_url) formData.append("image_url", product.image_url)
        if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
          formData.append("custom_attributes", JSON.stringify(product.custom_attributes))
        }
        await createProduct(formData)
        window.location.reload()
        toast.success(t("common.success"))
      } catch {
        toast.error(t("common.error"))
      }
    })
  }

  const getCurrencySymbol = (product: Product) => {
    const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
    return `${symbol}${Number(product.price).toFixed(2)}`
  }

  const handleDragStart = (e: React.DragEvent, productId: string) => {
    e.stopPropagation()
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", productId)
    setDraggingId(productId)
  }

  const handleDragOver = (e: React.DragEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
    if (productId !== draggingId) {
      setDragOverId(productId)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const sourceId = e.dataTransfer.getData("text/plain")

    if (sourceId === targetId || !onProductsReorder) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    const newProducts = [...allProducts]
    const sourceIndex = newProducts.findIndex(p => p.id === sourceId)
    const targetIndex = newProducts.findIndex(p => p.id === targetId)

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const [movedItem] = newProducts.splice(sourceIndex, 1)
      newProducts.splice(targetIndex, 0, movedItem)
      onProductsReorder(newProducts)

      startTransition(async () => {
        try {
          const orderData = newProducts.map((p, index) => ({ id: p.id, order: index }))
          await updateProductOrder(orderData)
        } catch {
          console.error("Sıralama kaydedilemedi")
        }
      })
    }

    setDraggingId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
  }

  // Shared Delete Alert Dialog - her iki view için de kullanılır
  const DeleteAlertDialog = (
    <AlertDialog open={!!deleteId} onOpenChange={() => { setDeleteId(null); setDeleteCatalogs([]); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("products.deleteProduct")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>{t("products.deleteConfirm")}</p>
              {deleteCatalogs.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-amber-800 dark:text-amber-200 font-medium text-sm mb-2">
                    ⚠️ Bu ürün {deleteCatalogs.length} katalogda kullanılıyor:
                  </p>
                  <ul className="text-amber-700 dark:text-amber-300 text-sm space-y-1">
                    {deleteCatalogs.map(c => (
                      <li key={c.id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {c.name}
                      </li>
                    ))}
                  </ul>
                  <p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
                    Silme işlemi sonrası ürün bu kataloglardan otomatik kaldırılacaktır.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} disabled={isPending} className="bg-destructive text-destructive-foreground">
            {deleteCatalogs.length > 0 ? "Yine de Sil" : t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  if (filteredProducts.length === 0 && allProducts.length === 0) {
    return (
      <div className="border rounded-xl p-12 text-center bg-gradient-to-b from-muted/50 to-transparent">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Package className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{t("products.noProducts")}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t("products.noProductsDesc")}</p>
      </div>
    )
  }

  // Grid görünümü
  if (viewMode === "grid") {
    return (
      <TooltipProvider>
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock)
              const isSelected = selectedIds.includes(product.id)
              const isDragging = draggingId === product.id
              const isDragOver = dragOverId === product.id

              return (
                <Card
                  key={product.id}
                  draggable
                  onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, product.id)}
                  onDragOver={(e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, product.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, product.id)}
                  onDragEnd={handleDragEnd}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                    // Mobilde karta tıklayınca önizlemeyi aç
                    if (isMobile && !e.defaultPrevented && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                      setPreviewProduct(product)
                    }
                  }}
                  className={cn(
                    "group overflow-hidden cursor-move transition-all duration-200 hover:shadow-md border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 relative",
                    isSelected && "border-violet-400 bg-violet-50/50 dark:bg-violet-950/20",
                    isDragging && "opacity-50 scale-95",
                    isDragOver && "border-dashed border-violet-400"
                  )}
                >
                  {/* Resim alanı - Kare */}
                  <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800">
                    {/* Placeholder ikonu */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                    </div>

                    {/* Ürün resmi */}
                    {(product.image_url || (product.images && product.images.length > 0)) && (
                      <NextImage
                        src={(product.image_url || product.images?.[0]) as string}
                        alt={product.name}
                        fill
                        className="object-cover z-[1]"
                        unoptimized
                      />
                    )}

                    {/* Checkbox - Mobilde küçük ve her zaman görünür, Masaüstünde hover/seçiliyken */}
                    <div className={cn(
                      "absolute top-1.5 left-1.5 z-[5] transition-opacity",
                      isSelected ? "opacity-100" : (isMobile ? "opacity-70" : "opacity-0 group-hover:opacity-100")
                    )}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(product.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white/95 border-gray-300 h-4 w-4 shadow-sm"
                      />
                    </div>

                    {/* Butonlar - Mobilde görünmez (karta tıklanır), Masaüstünde hover */}
                    <div className={cn(
                      "absolute bottom-2 right-2 z-[5] flex gap-1 transition-opacity",
                      isMobile ? "hidden" : "opacity-0 group-hover:opacity-100"
                    )}>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 bg-white/95 hover:bg-white shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewProduct(product);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 bg-white/95 hover:bg-white shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(product);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* İçerik alanı */}
                  <div className="p-3">
                    {/* Ürün adı - Önce ve Kalın */}
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{product.name}</h3>
                    {/* Fiyat - Altında */}
                    <p className="text-base font-bold text-violet-600 mt-1">{getCurrencySymbol(product)}</p>
                    {/* Stok bilgisi */}
                    <div className="flex items-center justify-between mt-2">
                      <span className={cn(
                        "text-xs",
                        stockStatus.variant === "destructive" && "text-red-500",
                        stockStatus.variant === "secondary" && "text-amber-500",
                        stockStatus.variant === "default" && "text-emerald-500"
                      )}>
                        {product.stock} adet
                      </span>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 -mr-1">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2 text-xs" onClick={() => onEdit(product)}>
                            <Pencil className="w-3 h-3" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-xs" onClick={() => handleDuplicate(product)} disabled={isPending}>
                            <Copy className="w-3 h-3" />
                            Kopyala
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={() => initiateDelete(product.id)}>
                            <Trash2 className="w-3 h-3" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {filteredProducts.length === 0 && allProducts.length > 0 && (
            <div className="p-12 text-center text-muted-foreground border rounded-xl bg-muted/20">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Aramanızla eşleşen ürün bulunamadı</p>
            </div>
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewProduct} onOpenChange={() => setPreviewProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
            {previewProduct ? (() => {
              // Parse images (Use the new images array or fallback to legacy image_url)
              const allImages = (previewProduct.images && previewProduct.images.length > 0)
                ? previewProduct.images
                : [previewProduct.image_url].filter(Boolean) as string[]

              // Custom attributes (excluding system ones)
              const customAttrs = previewProduct.custom_attributes?.filter(
                a => a.name !== "currency" && a.name !== "additional_images"
              ) || []

              const stockStatus = getStockStatus(previewProduct.stock)

              return (
                <>
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-violet-600 to-purple-600">
                    <DialogHeader>
                      <DialogTitle className="text-white text-lg font-bold pr-8">{previewProduct.name || "Ürün Önizleme"}</DialogTitle>
                      {previewProduct.sku && <p className="text-white/70 text-sm font-mono">SKU: {previewProduct.sku}</p>}
                    </DialogHeader>
                  </div>

                  {/* Content */}
                  <div className="overflow-y-auto max-h-[calc(85vh-130px)] p-6 space-y-5">
                    {/* Images */}
                    {allImages.length > 0 ? (
                      <div className="space-y-2">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <NextImage src={(allImages[activeImageIndex] || allImages[0]) as string} alt={previewProduct.name} fill className="object-contain" unoptimized />
                          {allImages.length > 1 && (
                            <>
                              <button onClick={() => setActiveImageIndex(prev => prev > 0 ? prev - 1 : allImages.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70">
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button onClick={() => setActiveImageIndex(prev => prev < allImages.length - 1 ? prev + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">{activeImageIndex + 1}/{allImages.length}</div>
                            </>
                          )}
                        </div>
                        {allImages.length > 1 && (
                          <div className="flex gap-1.5 overflow-x-auto">
                            {allImages.map((img, idx) => (
                              <button key={idx} onClick={() => setActiveImageIndex(idx)} className={cn("relative w-12 h-12 rounded overflow-hidden shrink-0 border-2", activeImageIndex === idx ? "border-violet-500" : "border-transparent opacity-60 hover:opacity-100")}>
                                <NextImage src={img} alt="" fill className="object-cover" unoptimized />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <ImageOff className="w-10 h-10 text-gray-400" />
                      </div>
                    )}

                    {/* Price & Stock */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                        <p className="text-xs text-violet-600 dark:text-violet-400">Fiyat</p>
                        <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{getCurrencySymbol(previewProduct)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border">
                        <p className="text-xs text-muted-foreground">Stok</p>
                        <p className={cn("text-xl font-bold", stockStatus.variant === "destructive" && "text-red-500", stockStatus.variant === "secondary" && "text-amber-500", stockStatus.variant === "default" && "text-emerald-500")}>{previewProduct.stock} adet</p>
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Kategori</p>
                      {previewProduct.category ? (
                        <div className="flex flex-wrap gap-1">{previewProduct.category.split(',').map((cat, idx) => <Badge key={idx} variant="secondary" className="text-xs">{cat.trim()}</Badge>)}</div>
                      ) : <p className="text-sm text-muted-foreground">—</p>}
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Açıklama</p>
                      <p className="text-sm">{previewProduct.description || "—"}</p>
                    </div>

                    {/* Product URL */}
                    {previewProduct.product_url && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Ürün Linki</p>
                        <a href={previewProduct.product_url} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 hover:underline flex items-center gap-1">
                          {previewProduct.product_url.slice(0, 50)}{previewProduct.product_url.length > 50 && "..."} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Custom Attributes */}
                    {customAttrs.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Özellikler</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {customAttrs.map((attr, idx) => (
                            <div key={idx} className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-800 text-xs">
                              <span className="text-muted-foreground">{attr.name}</span>
                              <span className="font-medium">{attr.value}{attr.unit && ` ${attr.unit}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 border-t bg-gray-50 dark:bg-gray-900 flex gap-2">
                    <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={() => { setPreviewProduct(null); onEdit(previewProduct) }}>
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Düzenle
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPreviewProduct(null)}>Kapat</Button>
                  </div>
                </>
              )
            })() : (
              <DialogHeader>
                <DialogTitle>Ürün Önizleme</DialogTitle>
              </DialogHeader>
            )}
          </DialogContent>
        </Dialog>

        {DeleteAlertDialog}
      </TooltipProvider>
    )
  }

  // List görünümü - Modern tablo stili
  return (
    <TooltipProvider>
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Tablo Header */}
        <div className="hidden md:grid grid-cols-[80px_1fr_100px_100px_100px_100px] gap-4 px-4 py-2.5 bg-muted/50 border-b text-xs font-medium text-muted-foreground items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5" /> {/* Grip placeholder */}
              <Checkbox
                checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                onCheckedChange={toggleSelectAll}
                className="h-4 w-4 scale-75 origin-center"
              />
            </div>
            <div className="w-11" /> {/* Image placeholder */}
          </div>
          <div>Ürün</div>
          <div className="text-right pr-2">Fiyat</div>
          <div className="text-center">Stok</div>
          <div>Kategori</div>
          <div className="text-right">İşlemler</div>
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
                  "group grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_1fr_100px_100px_100px_100px] gap-4 px-4 py-3 items-center cursor-move transition-all duration-200",
                  "hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/30 dark:hover:from-violet-950/20 dark:hover:to-purple-950/10",
                  isSelected && "bg-violet-50 dark:bg-violet-950/30",
                  isDragging && "opacity-50 scale-[0.98]",
                  isDragOver && "bg-violet-100/50 dark:bg-violet-900/30"
                )}
                onClick={(e) => {
                  // Mobilde karta tıklayınca önizlemeyi aç, ancak checkbox veya butonlara tıklayınca açma
                  if (isMobile && !e.defaultPrevented && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                    setPreviewProduct(product)
                  }
                }}
              >
                {/* Checkbox + Resim */}
                <div className="flex items-center gap-3">
                  <div className={cn("flex items-center gap-1.5", isMobile && !isSelected && "opacity-60")}>
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(product.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 ring-1 ring-black/5">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    </div>
                    {product.image_url || (product.images && product.images.length > 0) ? (
                      <NextImage
                        src={(product.image_url || product.images?.[0]) as string}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>
                </div>

                {/* Ürün Bilgisi */}
                <div className="min-w-0 flex flex-col gap-0.5 pl-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    {product.product_url && (
                      <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:text-violet-600" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {product.sku && (
                    <p className="text-[11px] text-muted-foreground font-mono tracking-tight">{product.sku}</p>
                  )}
                  {/* Mobil: Fiyat ve Stok */}
                  <div className="flex items-center gap-2 mt-1 md:hidden">
                    <span className="font-bold text-sm text-violet-600 dark:text-violet-400">{getCurrencySymbol(product)}</span>
                    <Badge
                      variant={stockStatus.variant}
                      className={cn(
                        "text-[10px] h-5 px-1.5",
                        stockStatus.variant === "destructive" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                        stockStatus.variant === "secondary" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                        stockStatus.variant === "default" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      )}
                    >
                      {product.stock}
                    </Badge>
                  </div>
                </div>

                {/* Fiyat - Desktop */}
                <div className="hidden md:block text-right pr-2">
                  <span className="font-bold text-sm text-violet-600 dark:text-violet-400">{getCurrencySymbol(product)}</span>
                </div>

                {/* Stok - Desktop */}
                <div className="hidden md:flex justify-center">
                  <Badge
                    variant={stockStatus.variant}
                    className={cn(
                      "text-[10px] h-5 px-2 font-medium",
                      stockStatus.variant === "destructive" && "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
                      stockStatus.variant === "secondary" && "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
                      stockStatus.variant === "default" && "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                    )}
                  >
                    {product.stock} adet
                  </Badge>
                </div>

                {/* Kategori - Desktop */}
                <div className="hidden md:block">
                  {product.category ? (
                    <span className="text-xs text-muted-foreground truncate block max-w-[100px]" title={product.category}>
                      {product.category.split(',')[0].trim()}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </div>

                {/* Aksiyonlar */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 transition-opacity",
                      isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewProduct(product);
                    }}
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 transition-opacity",
                      isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(product);
                    }}
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => setPreviewProduct(product)}>
                        <Eye className="w-4 h-4" />
                        Önizle
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => onEdit(product)}>
                        <Pencil className="w-4 h-4" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => handleDuplicate(product)} disabled={isPending}>
                        <Copy className="w-4 h-4" />
                        Kopyala
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-destructive" onClick={() => initiateDelete(product.id)}>
                        <Trash2 className="w-4 h-4" />
                        {t("common.delete")}
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
            <ProductPreviewContent
              product={previewProduct}
              onEdit={onEdit}
              onClose={() => setPreviewProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {DeleteAlertDialog}
    </TooltipProvider>
  )
}

function ProductPreviewContent({
  product,
  onEdit,
  onClose
}: {
  product: Product,
  onEdit: (p: Product) => void,
  onClose: () => void
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Parse images
  const allImages = (product.images && product.images.length > 0)
    ? product.images
    : [product.image_url].filter(Boolean) as string[]

  // Custom attributes
  const customAttrs = product.custom_attributes?.filter(
    a => a.name !== "currency" && a.name !== "additional_images"
  ) || []

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Stok Yok", variant: "destructive" as const }
    if (stock < 10) return { label: "Az Stok", variant: "secondary" as const }
    return { label: "Stokta", variant: "default" as const }
  }

  const getCurrencySymbol = (p: Product) => {
    const currency = p.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
    return `${symbol}${Number(p.price).toFixed(2)}`
  }

  const stockStatus = getStockStatus(product.stock)

  return (
    <>
      <div className="px-6 py-4 border-b bg-gradient-to-r from-violet-600 to-purple-600 shrink-0">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold pr-8">{product.name}</DialogTitle>
          {product.sku && <p className="text-white/70 text-sm font-mono mt-1">SKU: {product.sku}</p>}
        </DialogHeader>
      </div>

      <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5 min-h-0">
        {allImages.length > 0 ? (
          <div className="space-y-2 shrink-0">
            <div className="relative h-64 sm:h-[320px] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border">
              <NextImage
                src={(allImages[activeImageIndex] || allImages[0]) as string}
                alt={product.name}
                fill
                className="object-contain bg-neutral-900/5 dark:bg-neutral-50/5"
                unoptimized
              />
              {allImages.length > 1 && (
                <>
                  <button onClick={() => setActiveImageIndex(prev => prev > 0 ? prev - 1 : allImages.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 z-10">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setActiveImageIndex(prev => prev < allImages.length - 1 ? prev + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 z-10">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded z-10">{activeImageIndex + 1}/{allImages.length}</div>
                </>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {allImages.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)} className={cn("relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all", activeImageIndex === idx ? "border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900" : "border-transparent opacity-60 hover:opacity-100")}>
                    <NextImage src={img} alt="" fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ImageOff className="w-10 h-10 text-gray-400" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
            <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">Fiyat</p>
            <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{getCurrencySymbol(product)}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border">
            <p className="text-xs text-muted-foreground font-medium">Stok</p>
            <p className={cn("text-xl font-bold", stockStatus.variant === "destructive" && "text-red-500", stockStatus.variant === "secondary" && "text-amber-500", stockStatus.variant === "default" && "text-emerald-500")}>{product.stock} adet</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Kategori</p>
          {product.category ? (
            <div className="flex flex-wrap gap-1">{product.category.split(',').map((cat, idx) => <Badge key={idx} variant="secondary" className="text-xs">{cat.trim()}</Badge>)}</div>
          ) : <p className="text-sm text-muted-foreground">—</p>}
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Açıklama</p>
          <div className="text-sm text-foreground/90 leading-relaxed">
            {product.description || "—"}
          </div>
        </div>

        {product.product_url && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Ürün Linki</p>
            <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 hover:underline flex items-center gap-1">
              {product.product_url.slice(0, 50)}{product.product_url.length > 50 && "..."} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {customAttrs.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Özellikler</p>
            <div className="grid grid-cols-2 gap-1.5">
              {customAttrs.map((attr, idx) => (
                <div key={idx} className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-800 text-xs text-foreground/90">
                  <span className="text-muted-foreground">{attr.name}</span>
                  <span className="font-medium">{attr.value}{attr.unit && ` ${attr.unit}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t bg-gray-50 dark:bg-gray-900 flex gap-2 shrink-0">
        <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => { onClose(); onEdit(product) }}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Düzenle
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>Kapat</Button>
      </div>
    </>
  )
}
