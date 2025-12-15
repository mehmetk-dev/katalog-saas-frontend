"use client"

import type React from "react"
import { useState, useTransition, useRef, useMemo, useCallback } from "react"
import { ProductsTable } from "@/components/products/products-table"
import { ProductModal } from "@/components/products/product-modal"
import { ImportExportModal } from "@/components/products/import-export-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, ChevronDown, Search, Plus, Download, Trash2, FileDown, LayoutGrid, List, SortAsc, SortDesc, Filter, X, ArrowUpDown, Package, Sparkles, TrendingUp, AlertTriangle, Percent, DollarSign, Tag, Check, MoreHorizontal, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n-provider"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { BulkImageUploadModal } from "@/components/products/bulk-image-upload-modal"

interface ProductsPageClientProps {
  initialProducts: Product[]
  userPlan: "free" | "plus" | "pro"
  maxProducts: number
}

type SortField = "name" | "price" | "stock" | "created_at" | "category"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"
type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"

const DEFAULT_ITEMS_PER_PAGE = 12
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 100]

export function ProductsPageClient({ initialProducts, userPlan, maxProducts }: ProductsPageClientProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState("")
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Bulk Image Upload State
  const [showBulkImageModal, setShowBulkImageModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

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
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)

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
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedProducts.slice(start, start + itemsPerPage)
  }, [filteredAndSortedProducts, currentPage, itemsPerPage])

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
    if (isAtLimit) {
      setShowLimitModal(true)
      return
    }

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
    // Tüm ürünlerdeki benzersiz custom attribute isimlerini topla
    const allCustomAttrNames = new Set<string>()
    products.forEach(p => {
      if (p.custom_attributes && Array.isArray(p.custom_attributes)) {
        p.custom_attributes.forEach((attr: any) => {
          if (attr.name) allCustomAttrNames.add(attr.name)
        })
      }
    })
    const customAttrArray = Array.from(allCustomAttrNames)

    // Header'ları oluştur - sabit alanlar + dinamik custom attribute'lar
    const headers = [
      "Ad",
      "SKU",
      "Açıklama",
      "Fiyat",
      "Stok",
      "Kategori",
      "Görsel URL",
      ...customAttrArray // Dinamik özel özellik kolonları
    ]

    const csvContent = [
      headers.join(";"),
      ...products.map((p) => {
        // Custom attribute değerlerini al
        const customAttrValues = customAttrArray.map(attrName => {
          const found = p.custom_attributes?.find((a: any) => a.name === attrName)
          return found?.value || ""
        })

        return [
          p.name,
          p.sku || "",
          p.description?.replace(/(\r\n|\n|\r)/gm, " ") || "", // Yeni satırları temizle
          p.price.toString(),
          p.stock.toString(),
          p.category || "",
          p.image_url || "",
          ...customAttrValues // Dinamik özel özellik değerleri
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(";") // CSV escape
      })
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `tum-urunler-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)

    const customAttrInfo = customAttrArray.length > 0
      ? ` (${customAttrArray.length} özel özellik dahil)`
      : ""
    toast.success(`${products.length} ürün dışa aktarıldı${customAttrInfo}`)
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
      <div className="flex flex-col min-h-[calc(100vh-200px)] -m-4 sm:-m-6 p-4 sm:p-6 bg-gray-50 dark:bg-gray-950">
        <div className="flex-1 space-y-3">

          {/* KPI Kartları - Modern Tasarım */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {/* Toplam Ürün */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400">{stats.total}</p>
                  <p className="text-xs text-muted-foreground truncate">Toplam Ürün</p>
                </div>
              </div>
            </div>

            {/* Aktif Stok */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.inStock}</p>
                    <span className="hidden sm:inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                      <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                      Stokta
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">Aktif Stok</p>
                </div>
              </div>
            </div>

            {/* Kritik Stok */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.lowStock + stats.outOfStock}</p>
                    {(stats.lowStock + stats.outOfStock) > 0 && (
                      <span className="hidden sm:inline-flex items-center text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                        Dikkat
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">Kritik Stok</p>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar - Yüzer Tasarım */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl p-2 shadow-sm">
            {/* Tümünü Seç Checkbox */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center h-9 w-9 shrink-0">
                  <Checkbox
                    checked={selectedIds.length > 0 && selectedIds.length === filteredAndSortedProducts.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIds(filteredAndSortedProducts.map(p => p.id))
                      } else {
                        setSelectedIds([])
                      }
                    }}
                    className="h-4 w-4"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {selectedIds.length > 0 ? `${selectedIds.length} seçili - Temizle` : "Tümünü Seç"}
              </TooltipContent>
            </Tooltip>

            {/* Arama */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("products.searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 pr-9 h-9 border-0 bg-gray-50 dark:bg-gray-800"
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

            {/* Filtre Butonu */}
            <Button
              variant={showFilters ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5 shrink-0 h-9"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden md:inline">Filtreler</span>
              {hasActiveFilters && (
                <Badge variant="destructive" className="ml-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  !
                </Badge>
              )}
            </Button>

            {/* Görünüm Seçici - mobilde gizle */}
            <div className="hidden sm:flex items-center border rounded-lg p-0.5 shrink-0">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("list")}
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Sayfa Boyutu */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-9 w-[70px] px-2 text-xs justify-between bg-white dark:bg-gray-900 border-0 shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-gray-800">
                  <span className="truncate">{itemsPerPage}</span>
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} / sayfa
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mobil: Menü */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem className="gap-2" onClick={() => setShowImportModal(true)}>
                    <Upload className="w-4 h-4 text-violet-600" />
                    İçe Aktar (CSV/Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={downloadAllProducts}>
                    <FileDown className="w-4 h-4" />
                    Dışa Aktar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" onClick={() => setShowBulkImageModal(true)}>
                    <ImageIcon className="w-4 h-4" />
                    Toplu Fotoğraf Yükle
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Masaüstü: Menü */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="gap-2" onClick={() => setShowImportModal(true)}>
                    <Upload className="w-4 h-4" />
                    İçe Aktar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={downloadAllProducts}>
                    <FileDown className="w-4 h-4" />
                    Dışa Aktar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" onClick={() => setShowBulkImageModal(true)}>
                    <ImageIcon className="w-4 h-4" />
                    Toplu Fotoğraf
                  </DropdownMenuItem>
                  {process.env.NODE_ENV === 'development' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2" onClick={handleTestImport}>
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Test Verisi
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Import/Export Modal - State ile kontrol */}
            <ImportExportModal
              open={showImportModal}
              onOpenChange={setShowImportModal}
              hideTrigger
              onImport={async (productsToImport) => {
                const imported = await bulkImportProducts(productsToImport)
                setProducts([...imported, ...products])
              }}
              onExport={downloadAllProducts}
              productCount={products.length}
              isLoading={isPending}
              userPlan={userPlan === 'pro' ? 'pro' : userPlan === 'free' ? 'free' : 'plus'}
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.xls,.xlsx"
              onChange={handleFileImport}
              className="hidden"
            />

            {/* + Ürün Ekle Butonu - En sağda belirgin */}
            <Button
              onClick={handleAddProduct}
              size="sm"
              className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("products.addProduct")}</span>
            </Button>
          </div>

          {/* Filtre & Sıralama Drawer - Sağdan Açılır */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetContent side="right" className="w-[320px] sm:w-[380px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtre & Sıralama
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Sıralama */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Sıralama</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "created_at", label: "Yeni" },
                      { value: "name", label: "İsim" },
                      { value: "price", label: "Fiyat" },
                      { value: "stock", label: "Stok" },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        variant={sortField === opt.value ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "justify-between",
                          sortField === opt.value && "bg-violet-600 hover:bg-violet-700"
                        )}
                        onClick={() => {
                          if (sortField === opt.value) {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                          } else {
                            setSortField(opt.value as SortField)
                            setSortOrder("desc")
                          }
                        }}
                      >
                        {opt.label}
                        {sortField === opt.value && (
                          sortOrder === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4" />

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
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "all", label: "Tümü" },
                      { value: "in_stock", label: "Stokta" },
                      { value: "low_stock", label: "Az Stok" },
                      { value: "out_of_stock", label: "Yok" },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        variant={stockFilter === opt.value ? "default" : "outline"}
                        size="sm"
                        className={stockFilter === opt.value ? "bg-violet-600 hover:bg-violet-700" : ""}
                        onClick={() => { setStockFilter(opt.value as StockFilter); setCurrentPage(1) }}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Fiyat Aralığı - Modern Input */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Fiyat Aralığı</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange[0] || ""}
                        onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                        className="pl-7 h-9"
                      />
                    </div>
                    <span className="text-muted-foreground">-</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange[1] || ""}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || priceStats.max])}
                        className="pl-7 h-9"
                      />
                    </div>
                  </div>
                  {/* Hızlı Fiyat Seçenekleri */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Tümü", min: 0, max: priceStats.max },
                      { label: "₺0-100", min: 0, max: 100 },
                      { label: "₺100-500", min: 100, max: 500 },
                      { label: "₺500-1000", min: 500, max: 1000 },
                      { label: "₺1000+", min: 1000, max: priceStats.max },
                    ].map((opt) => (
                      <Button
                        key={opt.label}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setPriceRange([opt.min, opt.max])}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Alt Butonlar */}
                <div className="pt-4 border-t space-y-2">
                  {hasActiveFilters && (
                    <Button variant="outline" className="w-full gap-2" onClick={clearAllFilters}>
                      <X className="w-4 h-4" />
                      Tümünü Temizle
                    </Button>
                  )}
                  <Button
                    className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
                    onClick={() => setShowFilters(false)}
                  >
                    <Check className="w-4 h-4" />
                    Uygula ({filteredAndSortedProducts.length} ürün)
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Products Table/Grid */}
        <div className="mt-2">
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
        </div>

        {/* Sayfalama - Modern ve Premium - Her zaman altta */}
        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t bg-gradient-to-r from-muted/30 via-transparent to-muted/30 rounded-xl px-4 mt-6">
            {/* Sol: Sayfa bilgisi ve sayfa boyutu */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{filteredAndSortedProducts.length}</span> ürün içinden{' '}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)}
                </span> gösteriliyor
              </span>

              {/* Sayfa boyutu seçici */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sayfa başına:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sağ: Pagination kontrolleri */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* İlk Sayfa */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>İlk sayfa</TooltipContent>
                </Tooltip>

                {/* Önceki Sayfa */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Önceki sayfa</TooltipContent>
                </Tooltip>

                {/* Sayfa numaraları */}
                <div className="flex items-center gap-1 mx-1">
                  {/* İlk sayfa (uzaksa) */}
                  {currentPage > 3 && totalPages > 5 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-xs"
                        onClick={() => handlePageChange(1)}
                      >
                        1
                      </Button>
                      {currentPage > 4 && (
                        <span className="text-muted-foreground text-xs px-1">...</span>
                      )}
                    </>
                  )}

                  {/* Orta sayfa numaraları */}
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

                    // İlk ve son sayfayı atlayalım (ayrı gösteriliyorlarsa)
                    if (
                      (pageNum === 1 && currentPage > 3 && totalPages > 5) ||
                      (pageNum === totalPages && currentPage < totalPages - 2 && totalPages > 5)
                    ) {
                      return null
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-8 w-8 text-xs font-medium transition-all",
                          currentPage === pageNum && "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25"
                        )}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  }).filter(Boolean)}

                  {/* Son sayfa (uzaksa) */}
                  {currentPage < totalPages - 2 && totalPages > 5 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="text-muted-foreground text-xs px-1">...</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-xs"
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                {/* Sonraki Sayfa */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sonraki sayfa</TooltipContent>
                </Tooltip>

                {/* Son Sayfa */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Son sayfa</TooltipContent>
                </Tooltip>

                {/* Sayfa numarasına git - masaüstü için */}
                <div className="hidden md:flex items-center gap-2 ml-3 pl-3 border-l">
                  <span className="text-xs text-muted-foreground">Git:</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    placeholder={currentPage.toString()}
                    className="h-8 w-14 text-xs text-center"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement
                        const page = parseInt(target.value)
                        if (page >= 1 && page <= totalPages) {
                          handlePageChange(page)
                          target.value = ''
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Modal */}
        <ProductModal
          open={showProductModal}
          onOpenChange={setShowProductModal}
          product={editingProduct}
          onSaved={handleProductSaved}
          allCategories={categories}
          userPlan={userPlan === 'pro' ? 'pro' : userPlan === 'plus' ? 'plus' : 'free'}
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
        <BulkImageUploadModal
          open={showBulkImageModal}
          onOpenChange={setShowBulkImageModal}
          products={products}
          onSuccess={() => {
            router.refresh()
            setShowBulkImageModal(false)
            toast.success("Fotoğraflar güncellendi")
          }}
        />

        {/* FLOATING BULK ACTIONS BAR */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 dark:bg-gray-800 rounded-full shadow-2xl border border-gray-700">
              <span className="text-white font-medium text-sm">
                {selectedIds.length} seçili
              </span>
              <div className="w-px h-5 bg-gray-600" />
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 text-white hover:bg-gray-700 hover:text-white"
                      onClick={() => setShowPriceModal(true)}
                    >
                      <Percent className="w-4 h-4" />
                      <span className="hidden md:inline ml-2">Fiyat</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Fiyat Güncelle</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 text-red-400 hover:bg-red-900/50 hover:text-red-300"
                      onClick={handleBulkDelete}
                      disabled={isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline ml-2">Sil</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Seçilenleri Sil</TooltipContent>
                </Tooltip>
              </div>
              <div className="w-px h-5 bg-gray-600" />
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-gray-400 hover:bg-gray-700 hover:text-white rounded-full"
                onClick={() => setSelectedIds([])}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
