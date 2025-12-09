"use client"

import type React from "react"
import { useState, useTransition, useRef, useMemo, useCallback } from "react"
import { ProductsTable } from "@/components/products/products-table"
import { ProductModal } from "@/components/products/product-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, ChevronDown, Search, Plus, Download, Trash2, FileDown, LayoutGrid, List, SortAsc, SortDesc, Filter, X, ArrowUpDown, Package, Sparkles, TrendingUp, AlertTriangle, Percent, DollarSign, Tag, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n-provider"
import Link from "next/link"
import { type Product, deleteProducts, bulkImportProducts, bulkUpdatePrices, addDummyProducts } from "@/lib/actions/products"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface ProductsPageClientProps {
  initialProducts: Product[]
  userPlan: "free" | "pro"
  maxProducts: number
}

type SortField = "name" | "price" | "stock" | "created_at" | "category"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"
type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"

const ITEMS_PER_PAGE = 12

export function ProductsPageClient({ initialProducts, userPlan, maxProducts }: ProductsPageClientProps) {
  const { t } = useTranslation()
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState("")
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Yeni state'ler
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [priceChangeType, setPriceChangeType] = useState<"increase" | "decrease">("increase")
  const [priceChangeMode, setPriceChangeMode] = useState<"percentage" | "fixed">("percentage")
  const [priceChangeAmount, setPriceChangeAmount] = useState<number>(10)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const isFreeUser = userPlan === "free"
  const isAtLimit = isFreeUser && products.length >= maxProducts

  // Kategorileri çıkar
  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category).filter(Boolean))] as string[]
  }, [products])

  // Fiyat aralığını hesapla
  const priceStats = useMemo(() => {
    const prices = products.map(p => Number(p.price) || 0)
    return {
      min: Math.min(...prices, 0),
      max: Math.max(...prices, 100000)
    }
  }, [products])

  // Filtreleme ve sıralama
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // Arama filtresi
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      )
    }

    // Kategori filtresi
    if (selectedCategory !== "all") {
      if (selectedCategory === "Kategorisiz") {
        result = result.filter(p => !p.category || p.category === "Kategorisiz")
      } else {
        result = result.filter(p => p.category === selectedCategory)
      }
    }

    // Stok filtresi
    if (stockFilter !== "all") {
      result = result.filter(p => {
        if (stockFilter === "out_of_stock") return p.stock === 0
        if (stockFilter === "low_stock") return p.stock > 0 && p.stock < 10
        if (stockFilter === "in_stock") return p.stock >= 10
        return true
      })
    }

    // Fiyat aralığı filtresi
    result = result.filter(p => {
      const price = Number(p.price) || 0
      return price >= priceRange[0] && price <= priceRange[1]
    })

    // Sıralama
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "price":
          comparison = (Number(a.price) || 0) - (Number(b.price) || 0)
          break
        case "stock":
          comparison = a.stock - b.stock
          break
        case "category":
          comparison = (a.category || "").localeCompare(b.category || "")
          break
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [products, search, selectedCategory, stockFilter, priceRange, sortField, sortOrder])

  // Sayfalama
  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAndSortedProducts, currentPage])

  // İstatistikler
  const stats = useMemo(() => ({
    total: products.length,
    inStock: products.filter(p => p.stock >= 10).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (Number(p.price) || 0) * p.stock, 0)
  }), [products])

  // Kategori bazlı istatistikler
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; totalValue: number }> = {}
    products.forEach(p => {
      const cat = p.category || "Kategorisiz"
      if (!stats[cat]) stats[cat] = { count: 0, totalValue: 0 }
      stats[cat].count++
      stats[cat].totalValue += (Number(p.price) || 0) * p.stock
    })
    return Object.entries(stats).sort((a, b) => b[1].count - a[1].count)
  }, [products])

  // Sayfa değiştiğinde scroll YAPMA - kullanıcı yerinde kalsın
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

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
    setShowDeleteAlert(true)
  }

  const executeBulkDelete = () => {
    startTransition(async () => {
      try {
        await deleteProducts(selectedIds)
        setProducts(products.filter((p) => !selectedIds.includes(p.id)))
        setSelectedIds([])
        toast.success(`${selectedIds.length} ürün silindi`)
        setShowDeleteAlert(false)
      } catch {
        toast.error("Ürünler silinemedi")
      }
    })
  }

  // Sadece mevcut sayfadaki ürünleri seç
  const selectCurrentPage = () => {
    setSelectedIds(paginatedProducts.map(p => p.id))
    toast.success(`Bu sayfadaki ${paginatedProducts.length} ürün seçildi`)
  }

  // Tüm ürünleri seç (sayfalamadan bağımsız)
  const selectAllProducts = () => {
    setSelectedIds(products.map(p => p.id))
    toast.success(`Tüm ${products.length} ürün seçildi`)
  }

  // Kategori bazlı seçim
  const selectByCategory = (category: string) => {
    const categoryProducts = products.filter(p => (p.category || "Kategorisiz") === category)
    setSelectedIds(categoryProducts.map(p => p.id))
    toast.success(`${category} kategorisinden ${categoryProducts.length} ürün seçildi`)
  }

  // Toplu fiyat güncelleme
  const handleBulkPriceUpdate = () => {
    if (selectedIds.length === 0) {
      toast.error("Önce ürün seçmelisiniz")
      return
    }

    startTransition(async () => {
      try {
        const updatedProducts = await bulkUpdatePrices(
          selectedIds,
          priceChangeType,
          priceChangeMode,
          priceChangeAmount
        )

        // Ürünleri güncelle
        const updatedMap = new Map(updatedProducts.map(p => [p.id, p]))
        setProducts(products.map(p => updatedMap.get(p.id) || p))

        setShowPriceModal(false)
        setSelectedIds([])

        const changeText = priceChangeType === "increase" ? "zam" : "indirim"
        const modeText = priceChangeMode === "percentage" ? `%${priceChangeAmount}` : `₺${priceChangeAmount}`
        toast.success(`${updatedProducts.length} ürüne ${modeText} ${changeText} uygulandı`)
      } catch {
        toast.error("Fiyatlar güncellenemedi")
      }
    })
  }

  const handleTestImport = () => {
    startTransition(async () => {
      try {
        const addedProducts = await addDummyProducts()
        setProducts([...addedProducts, ...products])
        toast.success("5 adet test ürünü eklendi")
      } catch {
        toast.error("Test ürünleri eklenemedi")
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
    toast.success(t("products.success") || "Şablon indirildi")
  }

  const downloadAllProducts = () => {
    const headers = ["Ad", "SKU", "Açıklama", "Fiyat", "Stok", "Kategori", "Görsel", "Oluşturulma Tarihi"]
    const csvContent = [
      headers.join(";"),
      ...products.map((p) => [
        p.name,
        p.sku || "",
        p.description?.replace(/(\r\n|\n|\r)/gm, " ") || "", // Yeni satırları temizle
        p.price.toString(),
        p.stock.toString(),
        p.category || "",
        p.image_url || "",
        new Date(p.created_at).toLocaleDateString()
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(";")) // CSV escape
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `tum-urunler-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`${products.length} ürün dışa aktarıldı`)
  }

  const clearAllFilters = () => {
    setSearch("")
    setSelectedCategory("all")
    setStockFilter("all")
    setPriceRange([priceStats.min, priceStats.max])
    setCurrentPage(1)
  }

  const hasActiveFilters = search || selectedCategory !== "all" || stockFilter !== "all" || priceRange[0] > priceStats.min || priceRange[1] < priceStats.max

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{t("products.title")}</h1>
              {/* Mini istatistikler */}
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Package className="w-3 h-3" />
                  {stats.total}
                </Badge>
                <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300">
                  <TrendingUp className="w-3 h-3" />
                  {stats.inStock}
                </Badge>
                {stats.lowStock > 0 && (
                  <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                    <AlertTriangle className="w-3 h-3" />
                    {stats.lowStock}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              {t("products.subtitle")}
              {isFreeUser && (
                <span className="ml-2">
                  <Badge variant="secondary" className="font-normal text-xs">
                    {products.length}/{maxProducts}
                  </Badge>
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bulk Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  {t("products.bulkActions")}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* Fiyat Güncelleme - En üstte ve belirgin */}
                <DropdownMenuItem
                  className="gap-2 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 hover:from-violet-500/20 hover:to-indigo-500/20 font-medium"
                  onClick={() => setShowPriceModal(true)}
                >
                  <div className="p-1 rounded bg-violet-100 dark:bg-violet-900">
                    <Percent className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex flex-col">
                    <span>Toplu Fiyat Güncelle</span>
                    <span className="text-xs text-muted-foreground font-normal">Zam veya indirim uygula</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2" onClick={handleTestImport}>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Test Verisi Ekle (5 Ürün)
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Seçim</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2" onClick={selectCurrentPage}>
                  <LayoutGrid className="w-4 h-4" />
                  Sayfayı Seç ({paginatedProducts.length})
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={selectAllProducts}>
                  <Package className="w-4 h-4" />
                  Tümünü Seç ({products.length})
                </DropdownMenuItem>
                {categories.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <DropdownMenuItem className="gap-2">
                        <Tag className="w-4 h-4" />
                        Kategori Bazlı Seç
                        <ChevronDown className="w-3 h-3 ml-auto" />
                      </DropdownMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="left">
                      {categoryStats.map(([cat, stat]) => (
                        <DropdownMenuItem key={cat} onClick={() => selectByCategory(cat)}>
                          {cat} ({stat.count})
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>İçe/Dışa Aktar</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4" />
                  {t("products.importExcel")}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={downloadTemplate}>
                  <Download className="w-4 h-4" />
                  {t("products.downloadTemplate")}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={downloadAllProducts}>
                  <FileDown className="w-4 h-4" />
                  Tümünü Dışa Aktar
                </DropdownMenuItem>

                {selectedIds.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-violet-600">
                      ✓ {selectedIds.length} ürün seçili
                    </DropdownMenuLabel>
                    <DropdownMenuItem className="gap-2 text-destructive" onClick={handleBulkDelete} disabled={isPending}>
                      <Trash2 className="w-4 h-4" />
                      {t("products.deleteSelected")}
                    </DropdownMenuItem>
                  </>
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
                  <Button onClick={handleAddProduct} className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20">
                    <Plus className="w-4 h-4" />
                    {t("products.addProduct")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>{t("products.limits.upgrade")}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button onClick={handleAddProduct} className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20">
                <Plus className="w-4 h-4" />
                {t("products.addProduct")}
              </Button>
            )}
          </div>
        </div>

        {/* Arama, Filtreler ve Görünüm */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Arama */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("products.searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sıralama */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 shrink-0">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Sırala</span>
                  {sortOrder === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Sıralama Ölçütü</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { value: "created_at", label: "Oluşturma Tarihi" },
                  { value: "name", label: "İsim" },
                  { value: "price", label: "Fiyat" },
                  { value: "stock", label: "Stok" },
                  { value: "category", label: "Kategori" },
                ].map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => {
                      if (sortField === option.value) {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      } else {
                        setSortField(option.value as SortField)
                        setSortOrder("desc")
                      }
                    }}
                    className={cn(sortField === option.value && "bg-accent")}
                  >
                    {option.label}
                    {sortField === option.value && (
                      <span className="ml-auto">
                        {sortOrder === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filtre Butonu */}
            <Button
              variant={showFilters ? "secondary" : "outline"}
              className="gap-2 shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtreler</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  !
                </Badge>
              )}
            </Button>

            {/* Görünüm Seçici */}
            <div className="flex items-center border rounded-lg p-1 shrink-0">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filtre Paneli */}
          {showFilters && (
            <Card className="animate-in slide-in-from-top-2 duration-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Kategori */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Kategori</Label>
                    <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentPage(1) }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tüm Kategoriler" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Kategoriler</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Stok Durumu */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Stok Durumu</Label>
                    <Select value={stockFilter} onValueChange={(v) => { setStockFilter(v as StockFilter); setCurrentPage(1) }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tümü</SelectItem>
                        <SelectItem value="in_stock">Stokta (10+)</SelectItem>
                        <SelectItem value="low_stock">Az Stok (1-9)</SelectItem>
                        <SelectItem value="out_of_stock">Stok Yok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fiyat Aralığı */}
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Fiyat Aralığı</Label>
                      <span className="text-xs text-muted-foreground">
                        ₺{priceRange[0].toLocaleString()} - ₺{priceRange[1].toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      value={priceRange}
                      min={priceStats.min}
                      max={priceStats.max}
                      step={10}
                      onValueChange={(value) => { setPriceRange(value as [number, number]); setCurrentPage(1) }}
                      className="py-2"
                    />
                  </div>
                </div>

                {/* Filtreleri Temizle */}
                {hasActiveFilters && (
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-2 text-muted-foreground">
                      <X className="w-4 h-4" />
                      Filtreleri Temizle
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Aktif Filtre Badges */}
          {hasActiveFilters && !showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Aktif filtreler:</span>
              {search && (
                <Badge variant="secondary" className="gap-1">
                  Arama: "{search}"
                  <button onClick={() => setSearch("")}><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory("all")}><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {stockFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {stockFilter === "in_stock" ? "Stokta" : stockFilter === "low_stock" ? "Az Stok" : "Stok Yok"}
                  <button onClick={() => setStockFilter("all")}><X className="w-3 h-3" /></button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2 text-xs">
                Tümünü Temizle
              </Button>
            </div>
          )}
        </div>

        {/* Sonuç Sayısı ve Kategori Sekmeleri */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredAndSortedProducts.length} ürün bulundu
              {hasActiveFilters && ` (toplam ${products.length})`}
            </span>
            {totalPages > 1 && (
              <span>
                Sayfa {currentPage} / {totalPages}
              </span>
            )}
          </div>

          {/* Kategori Sekmeleri + Seçim Kontrolleri */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tümünü Seç Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <div
                    className={cn(
                      "flex items-center justify-center h-4 w-4 rounded-[4px] border border-primary shadow-sm transition-shadow outline-none",
                      selectedIds.length > 0 && selectedIds.length === filteredAndSortedProducts.length
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input dark:bg-input/30"
                    )}
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredAndSortedProducts.length && (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                  Seç ({selectedIds.length}/{filteredAndSortedProducts.length})
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Seçim Seçenekleri</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedIds(paginatedProducts.map(p => p.id))}>
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Bu Sayfayı Seç ({paginatedProducts.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={selectAllProducts}>
                  <Package className="w-4 h-4 mr-2" />
                  Tüm Ürünleri Seç ({products.length})
                </DropdownMenuItem>
                {selectedCategory !== "all" && (
                  <DropdownMenuItem onClick={() => selectByCategory(selectedCategory)}>
                    <Tag className="w-4 h-4 mr-2" />
                    {selectedCategory} Kategorisini Seç
                  </DropdownMenuItem>
                )}
                {selectedIds.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedIds([])}>
                      <X className="w-4 h-4 mr-2" />
                      Seçimi Temizle
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Kategori Sekmeleri */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto flex-1">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => { setSelectedCategory("all"); setCurrentPage(1) }}
                >
                  Tümü ({products.length})
                </Button>
                {categoryStats.map(([cat, stat]) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={() => { setSelectedCategory(cat); setCurrentPage(1) }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      selectByCategory(cat)
                    }}
                    title="Sağ tık ile tüm kategoriyi seç"
                  >
                    {cat}
                    <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                      {stat.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products Table/Grid */}
        {/* Delete Alert Dialog */}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
              <AlertDialogDescription>
                Seçili {selectedIds.length} ürünü silmek üzeresiniz. Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction onClick={executeBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ProductsTable
          products={paginatedProducts}
          allProducts={products}
          search=""
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onEdit={handleEditProduct}
          onDeleted={handleProductDeleted}
          viewMode={viewMode}
          onProductsReorder={(newProducts) => setProducts(newProducts)}
        />

        {/* Sayfalama */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Önceki
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-9"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sonraki
            </Button>
          </div>
        )}

        {/* Product Modal */}
        <ProductModal
          open={showProductModal}
          onOpenChange={setShowProductModal}
          product={editingProduct}
          onSaved={handleProductSaved}
          allCategories={categories}
        />

        {/* Product Limit Modal */}
        <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("products.limits.title")}</DialogTitle>
              <DialogDescription>
                {t("products.limits.description", { max: maxProducts.toString() })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowLimitModal(false)}>
                {t("common.cancel")}
              </Button>
              <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                <Link href="/pricing">{t("products.limits.upgrade")}</Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Toplu Fiyat Güncelleme Modal */}
        <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Toplu Fiyat Güncelleme
              </DialogTitle>
              <DialogDescription>
                Ürün seçin ve fiyatları toplu olarak güncelleyin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Ürün Seçimi */}
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Ürün Seçimi</span>
                  {selectedIds.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Package className="w-3 h-3" />
                      {selectedIds.length} ürün seçili
                    </Badge>
                  )}
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={selectCurrentPage} className="gap-1">
                    <LayoutGrid className="w-3 h-3" />
                    Sayfayı Seç ({paginatedProducts.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectAllProducts} className="gap-1">
                    <Package className="w-3 h-3" />
                    Tümünü Seç ({products.length})
                  </Button>
                  {selectedIds.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="gap-1 text-muted-foreground">
                      <X className="w-3 h-3" />
                      Temizle
                    </Button>
                  )}
                </div>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t mt-2">
                    <span className="text-xs text-muted-foreground w-full mb-1">Kategori bazlı seç:</span>
                    {categoryStats.map(([cat, stat]) => (
                      <Button key={cat} variant="outline" size="sm" onClick={() => selectByCategory(cat)} className="h-7 text-xs gap-1 px-2">
                        {cat} <Badge variant="secondary" className="h-4 px-1 text-[10px]">{stat.count}</Badge>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {selectedIds.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground bg-muted/50 rounded-lg">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Önce ürün seçin</p>
                </div>
              ) : (
                <>
                  {/* İşlem Tipi */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={priceChangeType === "increase" ? "default" : "outline"}
                      className={cn("gap-2", priceChangeType === "increase" && "bg-emerald-600 hover:bg-emerald-700")}
                      onClick={() => setPriceChangeType("increase")}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Zam Yap
                    </Button>
                    <Button
                      variant={priceChangeType === "decrease" ? "default" : "outline"}
                      className={cn("gap-2", priceChangeType === "decrease" && "bg-red-600 hover:bg-red-700")}
                      onClick={() => setPriceChangeType("decrease")}
                    >
                      <TrendingUp className="w-4 h-4 rotate-180" />
                      İndirim Yap
                    </Button>
                  </div>

                  {/* Değişiklik Modu */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={priceChangeMode === "percentage" ? "secondary" : "outline"}
                      className="gap-2"
                      onClick={() => setPriceChangeMode("percentage")}
                    >
                      <Percent className="w-4 h-4" />
                      Yüzde (%)
                    </Button>
                    <Button
                      variant={priceChangeMode === "fixed" ? "secondary" : "outline"}
                      className="gap-2"
                      onClick={() => setPriceChangeMode("fixed")}
                    >
                      <DollarSign className="w-4 h-4" />
                      Sabit (₺)
                    </Button>
                  </div>

                  {/* Miktar */}
                  <div className="space-y-2">
                    <Label>{priceChangeMode === "percentage" ? "Yüzde (%)" : "Tutar (₺)"}</Label>
                    <Input
                      type="number"
                      min="0"
                      step={priceChangeMode === "percentage" ? "1" : "0.01"}
                      value={priceChangeAmount}
                      onChange={(e) => setPriceChangeAmount(Number(e.target.value))}
                    />
                  </div>

                  {/* Önizleme */}
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <span className="text-muted-foreground">Örnek: </span>
                    ₺100 → <span className="font-bold">
                      ₺{priceChangeMode === "percentage"
                        ? (priceChangeType === "increase"
                          ? (100 + (100 * priceChangeAmount / 100)).toFixed(2)
                          : Math.max(0, 100 - (100 * priceChangeAmount / 100)).toFixed(2))
                        : (priceChangeType === "increase"
                          ? (100 + priceChangeAmount).toFixed(2)
                          : Math.max(0, 100 - priceChangeAmount).toFixed(2))
                      }
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPriceModal(false)}>İptal</Button>
              <Button
                onClick={handleBulkPriceUpdate}
                disabled={isPending || selectedIds.length === 0 || priceChangeAmount <= 0}
                className={cn(
                  priceChangeType === "increase" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                )}
              >
                {isPending ? "Güncelleniyor..." : `${selectedIds.length} Ürüne ${priceChangeType === "increase" ? "Zam" : "İndirim"} Uygula`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div >
    </TooltipProvider >
  )
}
