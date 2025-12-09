"use client"

import { useState, useTransition, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GripVertical, MoreHorizontal, Pencil, Trash2, Copy, Package, Eye, ImageOff } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { type Product, deleteProduct, createProduct, updateProductOrder } from "@/lib/actions/products"
import { toast } from "sonner"
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
import { Card, CardContent } from "@/components/ui/card"
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
  const [isPending, startTransition] = useTransition()
  const [isMobile, setIsMobile] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

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

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteProduct(id)
        onDeleted(id)
        setDeleteId(null)
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
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", productId)
    setDraggingId(productId)
  }

  const handleDragOver = (e: React.DragEvent, productId: string) => {
    e.preventDefault()
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
  if (viewMode === "grid" && !isMobile) {
    return (
      <TooltipProvider>
        <div className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock)
              const isSelected = selectedIds.includes(product.id)
              const isDragging = draggingId === product.id
              const isDragOver = dragOverId === product.id

              return (
                <Card
                  key={product.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, product.id)}
                  onDragOver={(e) => handleDragOver(e, product.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, product.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "group overflow-hidden cursor-move transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
                    isSelected && "ring-2 ring-violet-500",
                    isDragging && "opacity-50 scale-95",
                    isDragOver && "ring-2 ring-violet-500 ring-dashed"
                  )}
                >
                  {/* Resim alanı */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {/* Placeholder ikonu */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>

                    {/* Ürün resmi */}
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover z-[1]"
                      />
                    )}

                    {/* Checkbox */}
                    <div className="absolute top-1.5 left-1.5 z-[5]">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(product.id)}
                        className="bg-white border-gray-300 h-4 w-4"
                      />
                    </div>

                    {/* Stok badge */}
                    <div className="absolute bottom-1.5 left-1.5 z-[5]">
                      <Badge
                        variant={stockStatus.variant}
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4",
                          stockStatus.variant === "destructive" && "bg-red-500",
                          stockStatus.variant === "secondary" && "bg-amber-500 text-white"
                        )}
                      >
                        {product.stock}
                      </Badge>
                    </div>

                    {/* Butonlar */}
                    <div className="absolute bottom-1.5 right-1.5 z-[5] flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6 bg-white hover:bg-gray-100"
                        onClick={() => setPreviewProduct(product)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6 bg-white hover:bg-gray-100"
                        onClick={() => onEdit(product)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* İçerik alanı */}
                  <div className="p-2 bg-card">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-medium text-xs truncate flex-1 min-w-0">{product.name}</h3>
                      <DropdownMenu>
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
                          <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={() => setDeleteId(product.id)}>
                            <Trash2 className="w-3 h-3" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-sm">{getCurrencySymbol(product)}</span>
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
          <DialogContent className="max-w-2xl">
            {previewProduct && (
              <>
                <DialogHeader>
                  <DialogTitle>{previewProduct.name}</DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    {previewProduct.image_url ? (
                      <img src={previewProduct.image_url} alt={previewProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <p className="text-3xl font-bold">{getCurrencySymbol(previewProduct)}</p>
                    {previewProduct.description && (
                      <p className="text-sm text-muted-foreground">{previewProduct.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant={getStockStatus(previewProduct.stock).variant}>{previewProduct.stock} Stok</Badge>
                      {previewProduct.category && <Badge variant="outline">{previewProduct.category}</Badge>}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1" onClick={() => { setPreviewProduct(null); onEdit(previewProduct) }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Düzenle
                      </Button>
                      <Button variant="outline" onClick={() => setPreviewProduct(null)}>Kapat</Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("products.deleteProduct")}</AlertDialogTitle>
              <AlertDialogDescription>{t("products.deleteConfirm")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} disabled={isPending} className="bg-destructive text-destructive-foreground">
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    )
  }

  // List görünümü
  return (
    <TooltipProvider>
      <div className="space-y-3">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product.stock)
          const isSelected = selectedIds.includes(product.id)
          const isDragging = draggingId === product.id
          const isDragOver = dragOverId === product.id

          return (
            <Card
              key={product.id}
              draggable
              onDragStart={(e) => handleDragStart(e, product.id)}
              onDragOver={(e) => handleDragOver(e, product.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, product.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "overflow-hidden cursor-move transition-all duration-200 hover:shadow-md",
                isSelected && "ring-2 ring-violet-500",
                isDragging && "opacity-50",
                isDragOver && "ring-2 ring-violet-500 ring-dashed"
              )}
            >
              <CardContent className="p-3">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(product.id)} />
                    </div>
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      </div>
                      {product.image_url && (
                        <img src={product.image_url} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{product.name}</h3>
                        {product.sku && <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => setDeleteId(product.id)}>
                            <Trash2 className="w-4 h-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="font-bold text-base">{getCurrencySymbol(product)}</span>
                      <Badge variant={stockStatus.variant} className="text-xs">{stockStatus.label} ({product.stock})</Badge>
                      {product.category && product.category.split(',').map((cat, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{cat.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredProducts.length === 0 && allProducts.length > 0 && (
          <div className="p-8 text-center text-muted-foreground">{t("products.noProducts")}</div>
        )}
      </div>

      <Dialog open={!!previewProduct} onOpenChange={() => setPreviewProduct(null)}>
        <DialogContent className="max-w-2xl">
          {previewProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{previewProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  {previewProduct.image_url ? (
                    <img src={previewProduct.image_url} alt={previewProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <p className="text-3xl font-bold">{getCurrencySymbol(previewProduct)}</p>
                  {previewProduct.description && <p className="text-sm text-muted-foreground">{previewProduct.description}</p>}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getStockStatus(previewProduct.stock).variant}>{previewProduct.stock} Stok</Badge>
                    {previewProduct.category && previewProduct.category.split(',').map((cat, idx) => (
                      <Badge key={idx} variant="outline">{cat.trim()}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1" onClick={() => { setPreviewProduct(null); onEdit(previewProduct) }}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                    <Button variant="outline" onClick={() => setPreviewProduct(null)}>Kapat</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("products.deleteProduct")}</AlertDialogTitle>
            <AlertDialogDescription>{t("products.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} disabled={isPending} className="bg-destructive text-destructive-foreground">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
