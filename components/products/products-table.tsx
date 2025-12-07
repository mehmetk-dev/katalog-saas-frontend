"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GripVertical, MoreHorizontal, Pencil, Trash2, Copy, Package } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { type Product, deleteProduct, createProduct } from "@/lib/actions/products"
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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface ProductsTableProps {
  products: Product[]
  search: string
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  onEdit: (product: Product) => void
  onDeleted: (id: string) => void
}

export function ProductsTable({
  products,
  search,
  selectedIds,
  onSelectedIdsChange,
  onEdit,
  onDeleted,
}: ProductsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.sku?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (product.category?.toLowerCase().includes(search.toLowerCase()) ?? false),
  )

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      onSelectedIdsChange([])
    } else {
      onSelectedIdsChange(filteredProducts.map((p) => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    onSelectedIdsChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id])
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
        toast.success("Ürün silindi")
      } catch {
        toast.error("Ürün silinemedi")
      }
      setDeleteId(null)
    })
  }

  const handleDuplicate = (product: Product) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("name", `${product.name} (Kopya)`)
        formData.append("sku", product.sku ? `${product.sku}-KOPYA` : "")
        formData.append("description", product.description || "")
        formData.append("price", product.price.toString())
        formData.append("stock", product.stock.toString())
        formData.append("category", product.category || "")
        formData.append("image_url", product.image_url || "")
        formData.append("custom_attributes", JSON.stringify(product.custom_attributes || []))

        await createProduct(formData)
        toast.success("Ürün kopyalandı")
        window.location.reload()
      } catch {
        toast.error("Ürün kopyalanamadı")
      }
    })
  }

  if (filteredProducts.length === 0 && products.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold mb-2">Henüz ürün yok</h3>
        <p className="text-muted-foreground mb-4">Başlamak için ilk ürününüzü ekleyin.</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-16">Görsel</TableHead>
              <TableHead className="w-28">SKU</TableHead>
              <TableHead>Ürün Adı</TableHead>
              <TableHead className="text-right w-28">Fiyat</TableHead>
              <TableHead className="w-32">Stok</TableHead>
              <TableHead className="w-28">Kategori</TableHead>
              <TableHead className="w-20">Özellikler</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock)
              const hasCustomAttributes = product.custom_attributes && product.custom_attributes.length > 0

              return (
                <TableRow key={product.id} className={cn("group", selectedIds.includes(product.id) && "bg-primary/5")}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={() => toggleSelect(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                  </TableCell>
                  <TableCell>
                    <img
                      src={product.image_url || "/placeholder.svg?height=40&width=40&query=product"}
                      alt={product.name}
                      className="w-10 h-10 rounded-md object-cover bg-muted"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{product.sku || "-"}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right font-medium">₺{Number(product.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{product.stock}</span>
                      <Badge variant={stockStatus.variant} className="text-xs">
                        {stockStatus.label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category || "Kategorisiz"}</Badge>
                  </TableCell>
                  <TableCell>
                    {hasCustomAttributes ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="cursor-help">
                            {product.custom_attributes.length} özellik
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <div className="space-y-1">
                            {product.custom_attributes.map((attr, i) => (
                              <div key={i} className="text-sm">
                                <span className="font-medium">{attr.name}:</span> {attr.value}
                                {attr.unit ? ` ${attr.unit}` : ""}
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={() => onEdit(product)}>
                          <Pencil className="w-4 h-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => handleDuplicate(product)}
                          disabled={isPending}
                        >
                          <Copy className="w-4 h-4" />
                          Kopyala
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-destructive" onClick={() => setDeleteId(product.id)}>
                          <Trash2 className="w-4 h-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filteredProducts.length === 0 && products.length > 0 && (
          <div className="p-8 text-center text-muted-foreground">Aramanızla eşleşen ürün bulunamadı.</div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
