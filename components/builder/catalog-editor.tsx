"use client"

import { useState, useRef } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Palette, Type, Grid3X3, GripVertical, Trash2, Package, Lock, LayoutTemplate, RefreshCw, Image, Upload, Columns, ImageIcon, ChevronDown, Tag, CheckSquare, BoxSelect, Maximize2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/actions/products"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n-provider"

import { TEMPLATES } from "@/lib/constants"

interface CatalogEditorProps {
  products: Product[]
  selectedProductIds: string[]
  onSelectedProductIdsChange: (ids: string[]) => void
  catalogName: string
  onCatalogNameChange: (name: string) => void
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
  // Yeni kişiselleştirme props
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
}

export function CatalogEditor({
  products,
  selectedProductIds,
  onSelectedProductIdsChange,
  catalogName,
  onCatalogNameChange,
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
  // Yeni kişiselleştirme props (varsayılan değerlerle)
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
  logoPosition = 'top-left',
  onLogoPositionChange,
  logoSize = 'medium',
  onLogoSizeChange,
}: CatalogEditorProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [visibleCount, setVisibleCount] = useState(12)

  // Kategorileri çıkar
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[]

  // Filtrelenmiş ürünler
  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter(p => p.category === selectedCategory)

  // Görünen ürünler (lazy loading)
  const visibleProducts = filteredProducts.slice(0, visibleCount)

  const toggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      onSelectedProductIdsChange(selectedProductIds.filter((i) => i !== id))
    } else {
      onSelectedProductIdsChange([...selectedProductIds, id])
    }
  }

  const removeProduct = (id: string) => {
    onSelectedProductIdsChange(selectedProductIds.filter((i) => i !== id))
  }

  const handleTemplateSelect = (templateId: string, isPro: boolean) => {
    if (isPro && userPlan !== "pro") {
      onUpgrade()
      return
    }
    onLayoutChange(templateId)
  }

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
    setDraggingIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDropIndex(index)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    const startIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))

    if (isNaN(startIndex) || startIndex === index) {
      setDraggingIndex(null)
      setDropIndex(null)
      return
    }

    const newOrder = [...selectedProductIds]
    const [movedItem] = newOrder.splice(startIndex, 1)
    newOrder.splice(index, 0, movedItem)

    onSelectedProductIdsChange(newOrder)
    setDraggingIndex(null)
    setDropIndex(null)
  }

  const handleDragEnd = () => {
    setDraggingIndex(null)
    setDropIndex(null)
  }

  // Görsel yükleme handler'ları - Supabase Storage
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('toasts.imageSizeLimit', { size: 2 }))
      e.target.value = ''
      return
    }

    toast.loading('Logo yükleniyor...', { id: 'logo-upload' })

    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `logo-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      onLogoUrlChange?.(publicUrl)
      toast.success(t('toasts.logoUploaded'), { id: 'logo-upload' })
    } catch (error: any) {
      console.error("Logo upload error:", error)
      toast.error(error?.message || t('common.error'), { id: 'logo-upload' })
    } finally {
      e.target.value = ''
    }
  }

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('toasts.imageSizeLimit', { size: 5 }))
      e.target.value = ''
      return
    }

    toast.loading('Arka plan yükleniyor...', { id: 'bg-upload' })

    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `bg-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      onBackgroundImageChange?.(publicUrl)
      toast.success(t('toasts.backgroundUploaded'), { id: 'bg-upload' })
    } catch (error: any) {
      console.error("Background upload error:", error)
      toast.error(error?.message || t('common.error'), { id: 'bg-upload' })
    } finally {
      e.target.value = ''
    }
  }

  // Hazır gradient'ler
  const gradientPresets = [
    { name: t("builder.none"), value: "" },
    { name: t("builder.presets.sunset"), value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { name: t("builder.presets.ocean"), value: "linear-gradient(135deg, #667eea 0%, #5AB9EA 100%)" },
    { name: t("builder.presets.gold"), value: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)" },
    { name: t("builder.presets.night"), value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" },
    { name: t("builder.presets.mint"), value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
    { name: t("builder.presets.pink"), value: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)" },
  ]

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Catalog Details */}
      <Card>
        <CardHeader className="pb-1 p-2 sm:p-3 shrink-0">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Type className="w-4 h-4" />
            {t("builder.catalogDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-3 sm:space-y-4 p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
          <div className="space-y-1.5 sm:space-y-2 shrink-0">
            <Label htmlFor="title" className="text-xs sm:text-sm">{t("builder.catalogName")}</Label>
            <Input id="title" value={catalogName} onChange={(e) => onCatalogNameChange(e.target.value)} className="h-9 sm:h-10" placeholder={t("builder.catalogNamePlaceholder") || "Catalog Title"} />
          </div>
          <div className="space-y-1.5 sm:space-y-2 flex-1 flex flex-col min-h-0">
            <Label htmlFor="description" className="text-xs sm:text-sm shrink-0">{t("builder.description")}</Label>
            <Textarea
              id="description"
              placeholder={t("builder.descriptionPlaceholder")}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="text-sm flex-1 resize-none h-auto min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>



      {/* Şablon Seçimi - Moved to Top */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            {t("builder.templateStyle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
          <div className="grid grid-cols-2 gap-4">
            {TEMPLATES.map((template) => {
              const isLocked = template.isPro && userPlan !== "pro"
              const isSelected = layout === template.id
              return (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id, template.isPro)}
                  className={cn(
                    "relative cursor-pointer border rounded-lg p-2 sm:p-3 hover:bg-muted/50 transition-all",
                    isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : "border-border",
                    isLocked && "opacity-70 hover:opacity-80"
                  )}
                >
                  {/* Template içeriği aynı kalacak */}
                  <div className="aspect-[3/4] rounded-md overflow-hidden border mb-2 bg-muted relative group">
                    {/* Preview Image - Placeholder */}
                    <div className={cn("absolute inset-0 bg-gradient-to-br",
                      template.id === 'modern-grid' ? "from-slate-100 to-white" :
                        template.id === 'minimalist' ? "from-gray-50 to-white" :
                          template.id === 'magazine' ? "from-violet-50 to-white" :
                            "from-slate-100 to-white"
                    )} />

                    {/* Template name / badge */}
                    {isLocked && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-black/70 text-white backdrop-blur-sm border-0">
                          <Lock className="w-2.5 h-2.5 mr-1" />
                          PRO
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium truncate">{template.name}</span>
                    {isSelected && <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Arka Plan Ayarları - YENİ */}
        <Card className="flex flex-col h-full">
          <CardHeader className="pb-1 p-2 sm:p-3 shrink-0">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              {t("builder.backgroundSettings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
            <div className="flex flex-col sm:flex-row gap-4 h-full">
              <div className="flex-1 space-y-3 min-w-0">
                {/* Renk ve Gradient */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">{t("builder.color")}</Label>
                    <div className="flex gap-1.5">
                      <Input type="color" value={backgroundColor} onChange={(e) => onBackgroundColorChange?.(e.target.value)} className="w-8 h-9 p-0.5 shrink-0" />
                      <Input value={backgroundColor} onChange={(e) => onBackgroundColorChange?.(e.target.value)} className="flex-1 font-mono text-xs h-9" placeholder="#ffffff" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">{t("builder.gradient")}</Label>
                    <Select value={backgroundGradient || ""} onValueChange={(v) => onBackgroundGradientChange?.(v || null)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("common.select") || "Select..."} /></SelectTrigger>
                      <SelectContent>
                        {gradientPresets.map((preset) => (
                          <SelectItem key={preset.name} value={preset.value || "none"}>{preset.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Upload & Controls */}
                <div className="space-y-2 pt-1">
                  {backgroundImage && (
                    <div className="flex bg-muted/50 p-1 rounded-lg">
                      {[
                        { value: 'cover', icon: <ImageIcon className="w-3.5 h-3.5" />, label: t("builder.backgroundSize.cover") },
                        { value: 'contain', icon: <BoxSelect className="w-3.5 h-3.5" />, label: t("builder.backgroundSize.contain") },
                        { value: 'fill', icon: <Maximize2 className="w-3.5 h-3.5" />, label: t("builder.backgroundSize.fill") },
                      ].map((opt) => (
                        <Button
                          key={opt.value}
                          variant={backgroundImageFit === opt.value ? 'secondary' : 'ghost'}
                          size="sm"
                          className={cn(
                            "flex-1 h-7 text-[10px] sm:text-xs gap-1.5",
                            backgroundImageFit === opt.value && "shadow-sm"
                          )}
                          onClick={() => onBackgroundImageFitChange?.(opt.value)}
                        >
                          {opt.icon}
                          <span className="hidden sm:inline">{opt.label}</span>
                        </Button>
                      ))}
                    </div>
                  )}

                  <input type="file" ref={bgInputRef} accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
                  <Button
                    variant={backgroundImage ? "outline" : "outline"}
                    className={cn(
                      "w-full h-9 border-dashed transition-all",
                      !backgroundImage && "h-16 border-primary/20 hover:border-primary/50 text-muted-foreground bg-muted/10"
                    )}
                    onClick={() => bgInputRef.current?.click()}
                  >
                    <Upload className={cn("w-4 h-4 mr-2", !backgroundImage && "w-5 h-5 mb-1")} />
                    {backgroundImage ? t("builder.changeBackground") : <div className="flex flex-col items-center leading-none gap-1"><span>{t("builder.uploadBackground")}</span><span className="text-[10px] opacity-70">max 5MB</span></div>}
                  </Button>
                </div>
              </div>

              {/* Preview Area */}
              {backgroundImage && (
                <div className="sm:w-[120px] shrink-0 flex flex-col gap-2">
                  <Label className="text-xs sm:text-sm text-center block w-full text-muted-foreground">{t("builder.preview")}</Label>
                  <div className="aspect-[210/297] w-full rounded-lg border bg-muted overflow-hidden relative group shadow-sm">
                    <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: backgroundColor || '#ffffff' }} />
                    <div className="absolute inset-0 w-full h-full transition-all duration-300" style={{
                      backgroundImage: `url(${backgroundImage})`,
                      backgroundSize: backgroundImageFit === 'fill' ? '100% 100%' : backgroundImageFit,
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }} />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                      onClick={() => onBackgroundImageChange?.(null)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Logo/Marka - YENİ */}
        <Card className="flex flex-col h-full">
          <CardHeader className="pb-1 p-2 sm:p-3 shrink-0">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Image className="w-4 h-4" />
              {t("builder.logoBranding")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
            <div className="space-y-4">
              <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={handleLogoUpload} />

              {/* Logo Preview veya Upload */}
              {logoUrl ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <div className="w-16 h-16 rounded-lg border bg-white overflow-hidden flex items-center justify-center p-1 shrink-0">
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="w-3 h-3 mr-1.5" />
                      {t("builder.changeLogo")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs text-destructive hover:text-destructive"
                      onClick={() => onLogoUrlChange?.(null)}
                    >
                      <Trash2 className="w-3 h-3 mr-1.5" />
                      {t("builder.removeLogo")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-20 border-dashed border-primary/20 hover:border-primary/50 text-muted-foreground bg-muted/10"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">{t("builder.logoUpload")}</span>
                    <span className="text-[10px] opacity-70">max 2MB</span>
                  </div>
                </Button>
              )}

              {/* Pozisyon ve Boyut - Logo varsa göster */}
              {logoUrl && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t("builder.position")}</Label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { value: 'top-left', label: t("builder.positions.topLeft") }, { value: 'top-center', label: t("builder.positions.topCenter") }, { value: 'top-right', label: t("builder.positions.topRight") },
                      ].map((pos) => (
                        <button
                          key={pos.value}
                          onClick={() => onLogoPositionChange?.(pos.value)}
                          className={cn(
                            "h-7 rounded-md border text-[10px] transition-all hover:bg-muted",
                            logoPosition === pos.value
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-border"
                          )}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t("builder.size")}</Label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { value: 'small', label: t("builder.sizes.small") },
                        { value: 'medium', label: t("builder.sizes.medium") },
                        { value: 'large', label: t("builder.sizes.large") },
                      ].map((size) => (
                        <button
                          key={size.value}
                          onClick={() => onLogoSizeChange?.(size.value)}
                          className={cn(
                            "h-7 rounded-md border text-[10px] transition-all hover:bg-muted",
                            logoSize === size.value
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-border"
                          )}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Ana Renk */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            {t("builder.accentColor")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex gap-2">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                className="w-10 h-9 sm:w-12 sm:h-10 p-1"
              />
              <Input
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                className="flex-1 font-mono text-xs sm:text-sm h-9 sm:h-10"
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm text-muted-foreground">{t("builder.quickPalettes")}</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Sunset", color: "#f97316" },
                { name: "Ocean", color: "#0ea5e9" },
                { name: "Forest", color: "#22c55e" },
                { name: "Berry", color: "#ec4899" },
                { name: "Royal", color: "#6366f1" },
                { name: "Slate", color: "#0f172a" },
                { name: "Gold", color: "#eab308" },
                { name: "Red", color: "#dc2626" },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onPrimaryColorChange(preset.color)}
                  className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full border shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    primaryColor === preset.color && "ring-2 ring-ring ring-offset-2 scale-110"
                  )}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Selection */}
      <Card>
        <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-3 md:p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs sm:text-sm">{t("builder.productSelection")}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              title={t("builder.refreshList")}
              onClick={() => router.refresh()}
              className="h-6 w-6 sm:h-7 sm:w-7"
            >
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0 space-y-4">
          {/* Kategori Seçimi & Tümünü Seç */}
          {products.length > 0 && (
            <div className="space-y-2">
              {/* Kategori Filtreleri */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    className="h-6 sm:h-7 text-[10px] sm:text-xs px-2"
                    onClick={() => { setSelectedCategory("all"); setVisibleCount(12) }}
                  >
                    {t("common.all")} ({products.length})
                  </Button>
                  {categories.map(cat => {
                    const count = products.filter(p => p.category === cat).length
                    return (
                      <Button
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        size="sm"
                        className="h-6 sm:h-7 text-[10px] sm:text-xs px-2"
                        onClick={() => { setSelectedCategory(cat); setVisibleCount(12) }}
                      >
                        <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                        {cat} ({count})
                      </Button>
                    )
                  })}
                </div>
              )}

              {/* Toplu Seçim Butonları */}
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = filteredProducts.map(p => p.id)
                    onSelectedProductIdsChange([...new Set([...selectedProductIds, ...allIds])])
                  }}
                  className="gap-1 sm:gap-2 h-6 sm:h-7 text-[10px] sm:text-xs px-2"
                >
                  <CheckSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">{selectedCategory === "all" ? t("builder.selectAll") : t("builder.selectCategory", { category: selectedCategory })} ({filteredProducts.length})</span>
                  <span className="sm:hidden">Seç ({filteredProducts.length})</span>
                </Button>
                {selectedProductIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectedProductIdsChange([])}
                    className="text-destructive hover:text-destructive h-6 sm:h-7 text-[10px] sm:text-xs px-2"
                  >
                    <span className="hidden sm:inline">{t("builder.clearSelection")} ({selectedProductIds.length})</span>
                    <span className="sm:hidden">Temizle ({selectedProductIds.length})</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* All Products List */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm text-muted-foreground">
              {selectedCategory === "all" ? t("common.all") : selectedCategory} ({filteredProducts.length})
            </Label>
            {products.length === 0 ? (
              <div className="text-center py-6 sm:py-8 border rounded-lg bg-muted/20">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-muted-foreground/50 mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{t("builder.noProductsResult")}</p>
                <Button size="sm" asChild className="w-full sm:w-auto">
                  <Link href="/dashboard/products">{t("products.addProduct") || "Add Product"}</Link>
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {/* Kompakt ürün listesi */}
                <div className="max-h-52 overflow-auto p-1.5 space-y-1">
                  {visibleProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 group">
                      <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                        className="h-4 w-4"
                      />
                      <div className="w-6 h-6 rounded overflow-hidden bg-muted shrink-0">
                        <img
                          src={product.image_url || "/placeholder.svg?height=24&width=24&query=product"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate">{product.name}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {product.price ? `₺${Number(product.price).toFixed(0)}` : "-"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Daha Fazla Gör - Belirgin */}
                {visibleCount < filteredProducts.length && (
                  <div className="border-t bg-muted/30 p-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setVisibleCount(prev => prev + 12)}
                    >
                      <ChevronDown className="w-4 h-4" />
                      {t("builder.loadMore", { count: filteredProducts.length - visibleCount })}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Selected Products (Sortable) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm text-muted-foreground">
                {t("builder.selectedProducts", { count: selectedProductIds.length })} - <span className="text-primary italic">{t("builder.dragToReorder")}</span>
              </Label>
              {selectedProductIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectedProductIdsChange([])}
                  className="h-6 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {t("builder.clearSelection")}
                </Button>
              )}
            </div>

            {selectedProductIds.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                {t("builder.noProductsSelected")}
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {selectedProductIds.map((id, index) => {
                  const product = products.find(p => p.id === id)
                  if (!product) return null

                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "flex items-center gap-2 sm:gap-3 p-2 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-move",
                        draggingIndex === index && "opacity-50 border-primary border-dashed",
                        dropIndex === index && "border-t-4 border-t-primary"
                      )}
                    >
                      <div className="p-1 text-muted-foreground">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="font-mono text-xs text-muted-foreground w-6 text-center">
                        {index + 1}
                      </div>
                      <div className="w-8 h-8 rounded overflow-hidden bg-muted shrink-0 border">
                        <img
                          src={product.image_url || "/placeholder.svg?height=32&width=32&query=product"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sayfa Düzeni */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Columns className="w-4 h-4" />
            {t("builder.pageLayout")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">{t("builder.productsPerRow")}</Label>
            <div className="flex gap-2">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => onColumnsPerRowChange?.(num)}
                  className={cn(
                    "flex-1 h-12 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1",
                    columnsPerRow === num
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex gap-0.5">
                    {Array(num).fill(0).map((_, i) => (
                      <div key={i} className="w-3 h-4 bg-current rounded-sm opacity-60" />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{t("builder.columns", { count: num })}</span>
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <Label className="text-xs sm:text-sm">{t("builder.showPrices")}</Label>
            </div>
            <Switch checked={showPrices} onCheckedChange={onShowPricesChange} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <Label className="text-xs sm:text-sm">{t("builder.showDescriptions")}</Label>
            </div>
            <Switch checked={showDescriptions} onCheckedChange={onShowDescriptionsChange} />
          </div>
        </CardContent>
      </Card>




    </div >

  )
}
