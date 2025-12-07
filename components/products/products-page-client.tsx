"use client"

import type React from "react"

import { useState, useTransition, useRef } from "react"
import { ProductsTable } from "@/components/products/products-table"
import { ProductModal } from "@/components/products/product-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Upload, ChevronDown, Search, Plus, Download, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { type Product, deleteProducts, bulkImportProducts } from "@/lib/actions/products"
import { toast } from "sonner"

interface ProductsPageClientProps {
  initialProducts: Product[]
  userPlan: "free" | "pro"
  maxProducts: number
}

export function ProductsPageClient({ initialProducts, userPlan, maxProducts }: ProductsPageClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState("")
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isFreeUser = userPlan === "free"
  const isAtLimit = isFreeUser && products.length >= maxProducts

  const handleAddProduct = () => {
    if (isAtLimit) {
      setShowLimitModal(true)
    } else {
      setEditingProduct(null)
      setShowProductModal(true)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const handleProductSaved = (savedProduct: Product) => {
    if (editingProduct) {
      setProducts(products.map((p) => (p.id === savedProduct.id ? savedProduct : p)))
    } else {
      setProducts([savedProduct, ...products])
    }
    setShowProductModal(false)
    setEditingProduct(null)
  }

  const handleProductDeleted = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
    setSelectedIds(selectedIds.filter((i) => i !== id))
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return

    startTransition(async () => {
      try {
        await deleteProducts(selectedIds)
        setProducts(products.filter((p) => !selectedIds.includes(p.id)))
        setSelectedIds([])
        toast.success(`${selectedIds.length} ürün silindi`)
      } catch {
        toast.error("Ürünler silinemedi")
      }
    })
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length < 2) {
          toast.error("Dosya boş veya geçersiz format")
          return
        }

        const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase())
        const productsToImport: any[] = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(/[,;\t]/)
          const product: any = {
            name: "",
            sku: null,
            description: null,
            price: 0,
            stock: 0,
            category: null,
            image_url: null,
            custom_attributes: [],
          }

          headers.forEach((header, index) => {
            const value = values[index]?.trim() || ""

            switch (header) {
              case "ad":
              case "ürün adı":
              case "name":
              case "ürün":
                product.name = value
                break
              case "sku":
              case "stok kodu":
              case "kod":
                product.sku = value || null
                break
              case "açıklama":
              case "description":
                product.description = value || null
                break
              case "fiyat":
              case "price":
                product.price = Number.parseFloat(value.replace(",", ".")) || 0
                break
              case "stok":
              case "stock":
              case "adet":
                product.stock = Number.parseInt(value) || 0
                break
              case "kategori":
              case "category":
                product.category = value || null
                break
              case "görsel":
              case "image":
              case "resim":
                product.image_url = value || null
                break
              default:
                if (value) {
                  product.custom_attributes.push({
                    name: header,
                    value: value,
                    unit: "",
                  })
                }
            }
          })

          if (product.name) {
            productsToImport.push(product)
          }
        }

        if (productsToImport.length === 0) {
          toast.error("İçe aktarılacak geçerli ürün bulunamadı")
          return
        }

        startTransition(async () => {
          try {
            const imported = await bulkImportProducts(productsToImport)
            setProducts([...imported, ...products])
            toast.success(`${imported.length} ürün içe aktarıldı`)
          } catch {
            toast.error("Ürünler içe aktarılamadı")
          }
        })
      } catch {
        toast.error("Dosya işlenirken hata oluştu")
      }
    }

    reader.readAsText(file)
    e.target.value = "" // Reset input
  }

  const downloadTemplate = () => {
    const headers = ["Ad", "SKU", "Açıklama", "Fiyat", "Stok", "Kategori", "Görsel", "Ağırlık", "Renk", "Malzeme"]
    const sampleData = [
      [
        "Örnek Ürün 1",
        "URN-001",
        "Bu bir örnek üründür",
        "199.99",
        "50",
        "Mobilya",
        "",
        "2.5 kg",
        "Kahverengi",
        "Ahşap",
      ],
      ["Örnek Ürün 2", "URN-002", "Başka bir örnek", "89.50", "100", "Aksesuar", "", "0.5 kg", "Siyah", "Metal"],
    ]

    const csvContent = [headers.join(";"), ...sampleData.map((row) => row.join(";"))].join("\n")
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "urun-sablonu.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Şablon indirildi")
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ürünler</h1>
            <p className="text-muted-foreground">
              Ürün envanterinizi yönetin
              {isFreeUser && (
                <span className="ml-2">
                  <Badge variant="secondary" className="font-normal">
                    {products.length}/{maxProducts} ürün
                  </Badge>
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bulk Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  Toplu İşlemler
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4" />
                  Excel/CSV İçe Aktar
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={downloadTemplate}>
                  <Download className="w-4 h-4" />
                  Şablon İndir
                </DropdownMenuItem>
                {selectedIds.length > 0 && (
                  <DropdownMenuItem className="gap-2 text-destructive" onClick={handleBulkDelete} disabled={isPending}>
                    <Trash2 className="w-4 h-4" />
                    Seçilenleri Sil ({selectedIds.length})
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.xls,.xlsx"
              onChange={handleFileImport}
              className="hidden"
            />

            {/* Add Product Button with Tooltip for limit */}
            {isAtLimit ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleAddProduct} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Ürün Ekle
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Sınırsız ürün için Pro'ya yükseltin</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button onClick={handleAddProduct} className="gap-2">
                <Plus className="w-4 h-4" />
                Ürün Ekle
              </Button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ürün ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Products Table */}
        <ProductsTable
          products={products}
          search={search}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onEdit={handleEditProduct}
          onDeleted={handleProductDeleted}
        />

        {/* Product Modal */}
        <ProductModal
          open={showProductModal}
          onOpenChange={setShowProductModal}
          product={editingProduct}
          onSaved={handleProductSaved}
        />

        {/* Product Limit Modal */}
        <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ürün Limitine Ulaşıldı</DialogTitle>
              <DialogDescription>
                Ücretsiz planda maksimum {maxProducts} ürün ekleyebilirsiniz. Sınırsız ürün için Pro'ya yükseltin.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowLimitModal(false)}>
                İptal
              </Button>
              <Button asChild>
                <Link href="/pricing">Pro'ya Yükselt</Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
