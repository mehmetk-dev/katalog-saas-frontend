"use client"

import { useState, useRef } from "react"
import {
  Palette, Grid3X3, GripVertical, Trash2, Package, Image as ImageIcon,
  Upload, ChevronDown, Tag, CheckSquare, BoxSelect, Maximize2,
  ChevronRight, Layout, Settings2, Sparkles, Search
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/actions/products"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/lib/i18n-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { TEMPLATES } from "@/lib/constants"
import { CatalogPreview } from "../catalogs/catalog-preview"
import { getPreviewProductsByLayout } from "../templates/preview-data"
import { ResponsiveContainer } from "@/components/ui/responsive-container"

interface CatalogEditorProps {
  products: Product[]
  selectedProductIds: string[]
  onSelectedProductIdsChange: (ids: string[]) => void
  description: string
  onDescriptionChange: (desc: string) => void
  layout: string
  onLayoutChange: (layout: string) => void
  primaryColor: string
  onPrimaryColorChange: (color: string) => void
  showPrices: boolean
  onShowPricesChange: (show: boolean) => void
  showDescriptions: boolean
  onShowDescriptionsChange: (show: boolean) => void
  userPlan: string
  onUpgrade: () => void
  columnsPerRow?: number
  onColumnsPerRowChange?: (columns: number) => void
  backgroundColor?: string
  onBackgroundColorChange?: (color: string) => void
  backgroundImage?: string | null
  onBackgroundImageChange?: (url: string | null) => void
  backgroundGradient?: string | null
  onBackgroundGradientChange?: (gradient: string | null) => void
  backgroundImageFit?: string
  onBackgroundImageFitChange?: (fit: string) => void
  logoUrl?: string | null
  onLogoUrlChange?: (url: string | null) => void
  logoPosition?: string
  onLogoPositionChange?: (position: string) => void
  logoSize?: string
  onLogoSizeChange?: (size: string) => void
  titlePosition?: string
  onTitlePositionChange?: (position: string) => void
  showAttributes?: boolean
  onShowAttributesChange?: (show: boolean) => void
  showSku?: boolean
  onShowSkuChange?: (show: boolean) => void
}

export function CatalogEditor({
  products,
  selectedProductIds,
  onSelectedProductIdsChange,
  description,
  onDescriptionChange,
  layout,
  onLayoutChange,
  primaryColor,
  onPrimaryColorChange,
  showPrices,
  onShowPricesChange,
  showDescriptions,
  onShowDescriptionsChange,
  userPlan,
  onUpgrade,
  columnsPerRow = 3,
  onColumnsPerRowChange,
  backgroundColor = '#ffffff',
  onBackgroundColorChange,
  backgroundImage = null,
  onBackgroundImageChange,
  backgroundImageFit = 'cover',
  onBackgroundImageFitChange,
  backgroundGradient = null,
  onBackgroundGradientChange,
  logoUrl = null,
  onLogoUrlChange,
  logoPosition = 'header-left',
  onLogoPositionChange,
  logoSize = 'medium',
  onLogoSizeChange,
  titlePosition = 'left',
  onTitlePositionChange,
  showAttributes = false,
  onShowAttributesChange,
  showSku = true,
  onShowSkuChange,
}: CatalogEditorProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [visibleCount, setVisibleCount] = useState(12)
  const [activeTab, setActiveTab] = useState("content")
  const [searchQuery, setSearchQuery] = useState("")

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[]

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const visibleProducts = filteredProducts.slice(0, visibleCount)

  const toggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      onSelectedProductIdsChange(selectedProductIds.filter((i) => i !== id))
    } else {
      onSelectedProductIdsChange([...selectedProductIds, id])
    }
  }

  const handleTemplateSelect = (templateId: string, isPro: boolean) => {
    if (isPro && userPlan === "free") {
      onUpgrade()
      return
    }
    onLayoutChange(templateId)
  }

  // Logo/BG Upload Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg') => {
    const file = e.target.files?.[0]
    if (!file) return
    const limit = type === 'logo' ? 2 : 5
    if (file.size > limit * 1024 * 1024) {
      toast.error(t('toasts.imageSizeLimit', { size: limit }))
      return
    }

    const toastId = toast.loading(`${type === 'logo' ? 'Logo' : 'Arka plan'} yükleniyor...`)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const { convertToWebP } = await import("@/lib/image-utils")
      const supabase = createClient()
      const { blob } = await convertToWebP(file)

      const fileName = `${type}-${Date.now()}.webp`
      const { error } = await supabase.storage.from('product-images').upload(fileName, blob, { contentType: 'image/webp' })
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
      if (type === 'logo') onLogoUrlChange?.(publicUrl)
      else onBackgroundImageChange?.(publicUrl)
      toast.success(t(`toasts.${type === 'logo' ? 'logoUploaded' : 'backgroundUploaded'}`), { id: toastId })
    } catch (err) {
      toast.error(t('common.error'), { id: toastId })
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        {/* Sub-Header / Navigation */}
        <div className="bg-white dark:bg-slate-900 border-b px-2 py-3 shrink-0">
          <TabsList className="flex w-full max-w-[500px] mx-auto h-11 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50">
            <TabsTrigger
              value="content"
              className="flex-1 rounded-lg text-[11px] sm:text-xs uppercase tracking-wider font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all gap-2"
            >
              <Package className="w-3.5 h-3.5" />
              {t('builder.productSelection')}
            </TabsTrigger>
            <TabsTrigger
              value="design"
              className="flex-1 rounded-lg text-[11px] sm:text-xs uppercase tracking-wider font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all gap-2"
            >
              <Palette className="w-3.5 h-3.5" />
              {t('builder.designSettings')}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 custom-scrollbar">
          <TabsContent value="content" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* CATALOG DETAILS */}
            <Card className="bg-white shadow-sm border-slate-200 overflow-hidden">
              <div className="bg-slate-50/50 px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{t('builder.catalogDetails')}</h3>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">{t('builder.description')}</Label>
                  <textarea
                    className="w-full min-h-[80px] p-3 text-sm bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none placeholder:text-slate-400 font-medium"
                    placeholder={t('builder.descriptionPlaceholder')}
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEARCH & FILTERS SECTION HEADER */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-500">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{t('builder.productSelection')}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-5 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('builder.searchProducts')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-11 bg-white rounded-xl border-slate-200 shadow-sm transition-all focus:ring-primary/20"
                  />
                </div>
                <div className="md:col-span-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full h-11 bg-white shadow-sm border-slate-200 rounded-xl font-medium">
                      <SelectValue placeholder={t('common.category')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50"
                    onClick={() => {
                      const allIds = filteredProducts.map(p => p.id)
                      const isAllSelected = allIds.every(id => selectedProductIds.includes(id))
                      if (isAllSelected) {
                        onSelectedProductIdsChange(selectedProductIds.filter(id => !allIds.includes(id)))
                      } else {
                        onSelectedProductIdsChange([...new Set([...selectedProductIds, ...allIds])])
                      }
                    }}
                  >
                    {filteredProducts.every(p => selectedProductIds.includes(p.id)) ? t('builder.clearSelection') : t('builder.selectAll')}
                  </Button>
                </div>
              </div>
            </div>

            {/* PRODUCTS LIST SCROLLABLE */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="max-h-[400px] overflow-y-auto p-3 custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {visibleProducts.map(product => (
                    <div
                      key={product.id}
                      className={cn(
                        "relative aspect-square rounded-lg border-2 transition-all cursor-pointer overflow-hidden group bg-white",
                        selectedProductIds.includes(product.id)
                          ? "border-primary ring-2 ring-primary/10 scale-[0.98]"
                          : "border-transparent hover:border-slate-100"
                      )}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                      <div className="absolute top-1.5 right-1.5">
                        <div className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center transition-all shadow-sm border border-white/20",
                          selectedProductIds.includes(product.id) ? "bg-primary text-white" : "bg-white/80 text-transparent"
                        )}>
                          <CheckSquare className="w-3 h-3" />
                        </div>
                      </div>

                      <div className="absolute bottom-1.5 left-1.5 right-1.5 text-white">
                        <p className="text-[9px] sm:text-[10px] font-bold truncate">{product.name}</p>
                        <p className="text-[9px] opacity-90 font-medium">{product.price ? `₺${product.price}` : "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {visibleCount < filteredProducts.length && (
                  <div className="flex justify-center pt-4 pb-2">
                    <Button variant="ghost" size="sm" onClick={() => setVisibleCount(v => v + 20)} className="rounded-full h-8 text-xs font-bold text-slate-500 hover:text-primary">
                      {t('builder.loadMore', { count: filteredProducts.length - visibleCount })}
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* SORTING AREA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{t('builder.selectedProducts', { count: selectedProductIds.length })}</h3>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase">{t('builder.dragToReorder')}</p>
                </div>
                {selectedProductIds.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => onSelectedProductIdsChange([])} className="h-8 text-xs font-bold text-destructive hover:bg-destructive/5 px-3 rounded-lg">
                    {t('builder.clearSelection')}
                  </Button>
                )}
              </div>

              <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3">
                <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedProductIds.map((id, index) => {
                      const product = products.find(p => p.id === id)
                      if (!product) return null
                      return (
                        <div
                          key={id}
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData("text", index.toString()); setDraggingIndex(index) }}
                          onDragOver={(e) => { e.preventDefault(); setDropIndex(index) }}
                          onDrop={(e) => {
                            e.preventDefault()
                            const from = Number(e.dataTransfer.getData("text"))
                            const newList = [...selectedProductIds]
                            const [moved] = newList.splice(from, 1)
                            newList.splice(index, 0, moved)
                            onSelectedProductIdsChange(newList)
                            setDraggingIndex(null); setDropIndex(null)
                          }}
                          className={cn(
                            "flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm transition-all group",
                            draggingIndex === index && "opacity-50 scale-95 border-dashed border-primary pre-drag",
                            dropIndex === index && draggingIndex !== index && "border-primary ring-2 ring-primary/10"
                          )}
                        >
                          <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 shrink-0">
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <div className="w-8 h-8 rounded shrink-0 border border-slate-100 overflow-hidden">
                            <img src={product.image_url || "/placeholder.svg"} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate text-slate-700">{product.name}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => onSelectedProductIdsChange(selectedProductIds.filter(i => i !== id))} className="h-7 w-7 text-slate-400 hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )
                    })}
                    {selectedProductIds.length === 0 && (
                      <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                        <Package className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs font-medium">Henüz ürün seçilmedi</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="design" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            {/* APPEARANCE BASICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Layout className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{t('builder.accentColor')}</h3>
                  </div>

                  {/* Colors */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: "Slate", color: "#0f172a" }, { name: "Royal", color: "#6366f1" },
                        { name: "Ocean", color: "#0ea5e9" }, { name: "Forest", color: "#22c55e" },
                        { name: "Gold", color: "#eab308" }, { name: "Sunset", color: "#f97316" },
                        { name: "Berry", color: "#ec4899" }, { name: "Red", color: "#dc2626" },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => onPrimaryColorChange(preset.color)}
                          className={cn(
                            "w-8 h-8 rounded-full border border-white shadow-sm transition-all hover:scale-110",
                            primaryColor === preset.color && "ring-2 ring-primary ring-offset-2 scale-110"
                          )}
                          style={{ backgroundColor: preset.color }}
                        />
                      ))}
                      <div className="relative">
                        <Input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => onPrimaryColorChange(e.target.value)}
                          className="w-8 h-8 p-0 border-none cursor-pointer rounded-full overflow-hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      {/* Premium Toggle Row */}
                      {[
                        { label: t('builder.showPrices'), value: showPrices, onChange: onShowPricesChange },
                        { label: t('builder.showDescriptions'), value: showDescriptions, onChange: onShowDescriptionsChange },
                        { label: t('builder.showAttributes') || "Özellikleri Göster", value: showAttributes, onChange: onShowAttributesChange },
                        { label: t('builder.showSku') || "Stok Kodlarını Göster", value: showSku, onChange: onShowSkuChange },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between group cursor-pointer" onClick={() => item.onChange?.(!item.value)}>
                          <Label className="text-sm font-medium text-slate-700 cursor-pointer group-hover:text-primary transition-colors">{item.label}</Label>
                          <div className={cn(
                            "w-10 h-5 rounded-full relative transition-all duration-300 shadow-inner",
                            item.value ? "bg-primary" : "bg-slate-200"
                          )}>
                            <div className={cn(
                              "absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300",
                              item.value && "translate-x-5"
                            )} />
                          </div>
                        </div>
                      ))}

                      <div className="space-y-2 pt-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">Sütun Sayısı (Web)</Label>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                          {[2, 3, 4].map((num) => (
                            <button
                              key={num}
                              onClick={() => onColumnsPerRowChange?.(num)}
                              className={cn(
                                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                columnsPerRow === num
                                  ? "bg-white text-primary shadow-sm"
                                  : "text-slate-500 hover:text-slate-700"
                              )}
                            >
                              {num} Sütun
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LOGO & BRANDING */}
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{t('builder.logoBranding')}</h3>
                  </div>

                  <div className="space-y-5">
                    <div
                      className={cn(
                        "relative aspect-[16/6] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer bg-slate-50 hover:bg-white hover:border-primary/50",
                        logoUrl && "border-solid border-slate-100 bg-white"
                      )}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {logoUrl ? (
                        <>
                          <img src={logoUrl} alt="Logo" className="max-h-[80%] max-w-[80%] object-contain" />
                          <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                            <p className="text-[10px] font-bold uppercase text-slate-800 bg-white px-2 py-1 rounded shadow-sm">{t('builder.changeLogo')}</p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                          <p className="text-xs text-slate-600 font-medium">{t('builder.logoUpload')}</p>
                          <p className="text-[10px] text-slate-400 mt-1">max 2MB, WebP önerilir</p>
                        </div>
                      )}
                      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                    </div>

                    {logoUrl && (
                      <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in duration-300">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold text-slate-400">Boyut</Label>
                          <Select value={logoSize} onValueChange={onLogoSizeChange}>
                            <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">{t('builder.sizes.small')}</SelectItem>
                              <SelectItem value="medium">{t('builder.sizes.medium')}</SelectItem>
                              <SelectItem value="large">{t('builder.sizes.large')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold text-slate-400">Konum</Label>
                          <Select value={logoPosition} onValueChange={onLogoPositionChange}>
                            <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="header-left">Sol Üst</SelectItem>
                              <SelectItem value="header-center">Orta Üst</SelectItem>
                              <SelectItem value="header-right">Sağ Üst</SelectItem>
                              <SelectItem value="footer-left">Sol Alt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* BACKGROUND SETTINGS */}
              <Card className="shadow-sm border-slate-200 md:col-span-2">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{t('builder.backgroundSettings')}</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">Arka Plan Rengi</Label>
                        <div className="flex gap-2">
                          <Input type="color" value={backgroundColor} onChange={(e) => onBackgroundColorChange?.(e.target.value)} className="w-10 h-10 p-0 border-none cursor-pointer rounded-lg" />
                          <Input value={backgroundColor} onChange={(e) => onBackgroundColorChange?.(e.target.value)} className="h-10 font-mono text-sm" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase text-slate-400">Gradyan (Geçiş)</Label>
                        <div className="flex flex-col gap-3">
                          <Select value={backgroundGradient?.includes('linear-gradient') ? 'custom' : (backgroundGradient || 'none')} onValueChange={(v) => {
                            if (v === 'none') onBackgroundGradientChange?.(null)
                            else if (v === 'custom') onBackgroundGradientChange?.(`linear-gradient(135deg, ${backgroundColor}, ${primaryColor})`)
                            else onBackgroundGradientChange?.(v)
                          }}>
                            <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Gradyan seçin" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t('builder.none')}</SelectItem>
                              <SelectItem value="custom">Özel Gradyan</SelectItem>
                              <SelectItem value="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">Sunset</SelectItem>
                              <SelectItem value="linear-gradient(135deg, #667eea 0%, #5AB9EA 100%)">Ocean</SelectItem>
                              <SelectItem value="linear-gradient(135deg, #f5af19 0%, #f12711 100%)">Warm</SelectItem>
                            </SelectContent>
                          </Select>

                          {backgroundGradient?.includes('linear-gradient') && (
                            <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 space-y-1">
                                  <Label className="text-[10px] uppercase font-bold text-slate-400">Başlangıç</Label>
                                  <div className="flex gap-1.5 items-center">
                                    <Input
                                      type="color"
                                      value={backgroundGradient?.match(/#([A-Fa-f0-9]{3,6})/g)?.[0] || backgroundColor}
                                      onChange={(e) => {
                                        const colors = backgroundGradient?.match(/#([A-Fa-f0-9]{3,6})/g) || [backgroundColor, primaryColor]
                                        onBackgroundGradientChange?.(`linear-gradient(135deg, ${e.target.value}, ${colors[1] || primaryColor})`)
                                      }}
                                      className="w-7 h-7 p-0 border-none cursor-pointer rounded-full"
                                    />
                                    <span className="text-[10px] font-mono text-slate-500 uppercase">{backgroundGradient?.match(/#([A-Fa-f0-9]{3,6})/g)?.[0] || backgroundColor}</span>
                                  </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <Label className="text-[10px] uppercase font-bold text-slate-400">Bitiş</Label>
                                  <div className="flex gap-1.5 items-center">
                                    <Input
                                      type="color"
                                      value={backgroundGradient?.match(/#([A-Fa-f0-9]{3,6})/g)?.[1] || primaryColor}
                                      onChange={(e) => {
                                        const colors = backgroundGradient?.match(/#([A-Fa-f0-9]{3,6})/g) || [backgroundColor, primaryColor]
                                        onBackgroundGradientChange?.(`linear-gradient(135deg, ${colors[0] || backgroundColor}, ${e.target.value})`)
                                      }}
                                      className="w-7 h-7 p-0 border-none cursor-pointer rounded-full"
                                    />
                                    <span className="text-[10px] font-mono text-slate-500 uppercase">{backgroundGradient?.match(/#([A-Fa-f0-9]{3,6})/g)?.[1] || primaryColor}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                      <Label className="text-xs font-bold uppercase text-slate-400">Arka Plan Görseli</Label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div
                          className={cn(
                            "flex-1 min-h-[100px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer bg-slate-50 hover:bg-white hover:border-primary/50",
                            backgroundImage && "border-solid border-slate-100 bg-white"
                          )}
                          onClick={() => bgInputRef.current?.click()}
                        >
                          {backgroundImage ? (
                            <img src={backgroundImage} className="max-h-[80px] rounded shadow-sm" />
                          ) : (
                            <div className="text-center p-2">
                              <ImageIcon className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                              <p className="text-[10px] font-medium text-slate-600">Görsel Yükle</p>
                            </div>
                          )}
                          <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg')} />
                        </div>

                        {backgroundImage && (
                          <div className="flex-1 space-y-3 animate-in slide-in-from-right-2 duration-300">
                            <Select value={backgroundImageFit} onValueChange={onBackgroundImageFitChange}>
                              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cover">Kapla (Cover)</SelectItem>
                                <SelectItem value="contain">Sığdır (Contain)</SelectItem>
                                <SelectItem value="fill">Doldur (Stretch)</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="destructive" size="sm" onClick={() => onBackgroundImageChange?.(null)} className="w-full h-8 text-xs">
                              Görseli Kaldır
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="opacity-50" />

            {/* TEMPLATE SELECTION - MOVED TO BOTTOM */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                  <Layout className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider">{t('builder.templateStyle')}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => handleTemplateSelect(tmpl.id, tmpl.isPro)}
                    className={cn(
                      "group relative aspect-[3/4] rounded-xl border-2 transition-all cursor-pointer overflow-hidden bg-white shadow-sm",
                      layout === tmpl.id
                        ? "border-primary ring-2 ring-primary/20 scale-[0.98]"
                        : "border-slate-100 hover:border-slate-300"
                    )}
                  >
                    <ResponsiveContainer>
                      <CatalogPreview
                        layout={tmpl.id}
                        name={tmpl.name}
                        products={getPreviewProductsByLayout(tmpl.id)}
                      />
                    </ResponsiveContainer>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-10">
                      <p className="text-[10px] font-bold text-white truncate">{tmpl.name}</p>
                      {tmpl.isPro && (
                        <div className="absolute top-2 right-2 bg-amber-400 text-[8px] font-bold text-slate-900 px-1.5 py-0.5 rounded-full shadow-sm">
                          PRO
                        </div>
                      )}
                    </div>
                    {layout === tmpl.id && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-20">
                        <div className="bg-primary text-white p-1 rounded-full shadow-lg">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
