"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  Palette, GripVertical, Trash2, Package, Image as ImageIcon,
  Upload, ChevronDown, CheckSquare, Layout, Sparkles, Search
} from "lucide-react"
import NextImage from "next/image"
import { toast } from "sonner"
import { HexColorPicker } from "react-colorful"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/actions/products"
import type { Catalog } from "@/lib/actions/catalogs"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useTranslation } from "@/lib/i18n-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { TEMPLATES } from "@/lib/constants"
import { ResponsiveContainer } from "@/components/ui/responsive-container"

import { CatalogPreview } from "../catalogs/catalog-preview"
import { getPreviewProductsByLayout } from "../templates/preview-data"
import { storage } from "@/lib/storage"
import { getSessionSafe } from "@/lib/supabase/client"

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
  backgroundImageFit?: Catalog['background_image_fit']
  onBackgroundImageFitChange?: (fit: NonNullable<Catalog['background_image_fit']>) => void
  logoUrl?: string | null
  onLogoUrlChange?: (url: string | null) => void
  logoPosition?: Catalog['logo_position']
  onLogoPositionChange?: (position: NonNullable<Catalog['logo_position']>) => void
  logoSize?: Catalog['logo_size']
  onLogoSizeChange?: (size: NonNullable<Catalog['logo_size']>) => void
  titlePosition?: Catalog['title_position']
  onTitlePositionChange?: (position: NonNullable<Catalog['title_position']>) => void
  showAttributes?: boolean
  onShowAttributesChange?: (show: boolean) => void
  showSku?: boolean
  onShowSkuChange?: (show: boolean) => void
  showUrls?: boolean
  onShowUrlsChange?: (show: boolean) => void
  headerTextColor?: string
  onHeaderTextColorChange?: (color: string) => void
  productImageFit?: 'cover' | 'contain' | 'fill'
  onProductImageFitChange?: (fit: 'cover' | 'contain' | 'fill') => void
}

// Helper: Parse color to RGB
const parseColor = (color: string) => {
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1
      }
    }
  } else if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return { r, g, b, a: 1 }
  }
  return { r: 124, g: 58, b: 237, a: 1 }
}

// Helper: RGB to hex
const rgbToHex = (r: number, g: number, b: number) => {
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')}`
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
  titlePosition: _titlePosition = 'left',
  onTitlePositionChange: _onTitlePositionChange,
  showAttributes = false,
  onShowAttributesChange,
  showSku = true,
  onShowSkuChange,
  showUrls = false,
  onShowUrlsChange,
  headerTextColor = '#ffffff',
  onHeaderTextColorChange,
  productImageFit = 'cover',
  onProductImageFitChange,
}: CatalogEditorProps) {
  const { t } = useTranslation()
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [showPrimaryColorPicker, setShowPrimaryColorPicker] = useState(false)
  const [showHeaderTextColorPicker, setShowHeaderTextColorPicker] = useState(false)
  const [showBackgroundColorPicker, setShowBackgroundColorPicker] = useState(false)
  const primaryColorPickerRef = useRef<HTMLDivElement>(null)
  const headerTextColorPickerRef = useRef<HTMLDivElement>(null)
  const backgroundColorPickerRef = useRef<HTMLDivElement>(null)

  // Optimize: Parse primaryColor once
  const primaryColorParsed = useMemo(() => {
    const rgb = parseColor(primaryColor)
    const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b)
    const opacity = Math.round(rgb.a * 100)
    return { rgb, hexColor, opacity }
  }, [primaryColor])

  // Close color pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (showPrimaryColorPicker && primaryColorPickerRef.current && !primaryColorPickerRef.current.contains(target)) {
        setShowPrimaryColorPicker(false)
      }

      if (showHeaderTextColorPicker && headerTextColorPickerRef.current && !headerTextColorPickerRef.current.contains(target)) {
        setShowHeaderTextColorPicker(false)
      }

      if (showBackgroundColorPicker && backgroundColorPickerRef.current && !backgroundColorPickerRef.current.contains(target)) {
        setShowBackgroundColorPicker(false)
      }
    }

    if (showPrimaryColorPicker || showHeaderTextColorPicker || showBackgroundColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPrimaryColorPicker, showHeaderTextColorPicker, showBackgroundColorPicker])
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

  // Upload işlemlerini iptal etmek için ref'ler
  const uploadAbortControllers = useRef<Map<string, AbortController>>(new Map())
  const uploadTimeoutIds = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Fotoğraf yükleme alanına tıklandığında (daha dosya seçilmeden) oturumu tazele (Just-in-Time)
  const handleUploadClick = async () => {
    // Session check logic here using createClient imported from lib/supabase/client
    // But we need to import createClient first if not already imported.
    // Looking at imports, createClient is not imported in this file, only getSessionSafe and storage.
    // However, getSessionSafe uses createClient internally or we can use refreshSession from it?
    // Let's check imports. Lines 1-30 shows `import { getSessionSafe } from "@/lib/supabase/client"`.
    // We need to import `createClient` too or use a way to refresh.
    // Actually, let's use `createClient` to be consistent with other files.
    // I will add the function body here and assume `createClient` needs to be added to imports or used from `getSessionSafe` if it exposed it (it usually doesn't).
    // Wait, the previous tool output showed imports. Line 30: `import { getSessionSafe } from "@/lib/supabase/client"`.
    // I need to add `createClient` to imports or use `supabase-js` directly but better to use the helper.
    // Let's check if I can add the function now and fix imports in next step or use a dynamic import/existing import if possible.
    // To be safe, I'll add the function and then check imports.
    // Actually, I can use `getSessionSafe` which might refresh? No, we want explicit refresh.
    // Let's add `createClient` to the import list in a separate step or just use what we have?
    // I'll add the function now.

    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { error } = await supabase.auth.refreshSession()
    if (error) console.error('[CatalogEditor] Pre-upload session refresh failed:', error)
  }

  // YENİ: Tekil dosya yükleme ve Retry (Yeniden Deneme) mantığı
  const uploadFileWithRetry = async (file: File, type: 'logo' | 'bg', signal?: AbortSignal): Promise<string> => {
    const MAX_RETRIES = 3
    const TIMEOUT_MS = 10000 // 10 Saniye (Kullanıcı isteği)
    const uploadKey = `${type}-${Date.now()}`

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // İptal kontrolü
      if (signal?.aborted) {
        throw new Error('Upload cancelled')
      }

      let timeoutId: NodeJS.Timeout | null = null

      try {
        // 1. Bekleme Süresi (Exponential Backoff - İlk denemede beklemez)
        if (attempt > 0) {
          const waitTime = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s...
          toast.loading(`Bağlantı yoğun, tekrar deneniyor (${attempt + 1}/${MAX_RETRIES})...`)

          // Bekleme sırasında da iptal kontrolü
          await new Promise<void>((resolve, reject) => {
            const checkInterval = setInterval(() => {
              if (signal?.aborted) {
                clearInterval(checkInterval)
                reject(new Error('Upload cancelled'))
              }
            }, 100)

            setTimeout(() => {
              clearInterval(checkInterval)
              resolve()
            }, waitTime)
          })
        } else {
        }

        // İptal kontrolü (bekleme sonrası)
        if (signal?.aborted) {
          throw new Error('Upload cancelled')
        }

        // 2. Dosya adı oluştur
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const fileName = `${type}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`

        // 3. Klasör belirleme
        const folder = type === 'logo' ? 'company-logos' : 'catalog-backgrounds'

        // 4. YARIŞ BAŞLASIN: Upload vs Timeout
        // Hangisi önce biterse o kazanır. 1 saniye bekleme şartı yok.

        const uploadPromise = storage.upload(file, {
          path: folder, // Logo için company-logos, background için catalog-backgrounds
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
          fileName,
          signal, // AĞ SEVİYESİNDE İPTAL DESTEĞİ
        })

        // Timeout promise'i (temizlenebilir)
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            console.error(`[CatalogEditor] ⏱️ Upload timeout for ${type} after ${TIMEOUT_MS / 1000} seconds`)
            reject(new Error('UPLOAD_TIMEOUT'))
          }, TIMEOUT_MS)

          // Timeout ID'yi kaydet (temizlemek için)
          uploadTimeoutIds.current.set(uploadKey, timeoutId)
        })

        const result: any = await Promise.race([uploadPromise, timeoutPromise])

        // Timeout'u temizle (başarılı olduysa)
        if (timeoutId) {
          clearTimeout(timeoutId)
          uploadTimeoutIds.current.delete(uploadKey)
          timeoutId = null
        }

        // 5. Sonuç Kontrolü
        if (result && result.url) {
          return result.url // Başarılı! URL'i döndür ve fonksiyondan çık.
        } else {
          throw new Error('Upload successful but URL is missing')
        }

      } catch (error: any) {
        // Timeout'u temizle (hata durumunda)
        if (timeoutId) {
          clearTimeout(timeoutId)
          uploadTimeoutIds.current.delete(uploadKey)
          timeoutId = null
        }

        // İptal hatası ise direkt fırlat
        if (error.message === 'Upload cancelled' || signal?.aborted) {
          throw error
        }

        console.error(`[CatalogEditor] ❌ Attempt ${attempt + 1}/${MAX_RETRIES} failed for ${type}:`, error.message)

        // Eğer son denemeyse hatayı fırlat ki ana fonksiyon yakalasın
        if (attempt === MAX_RETRIES - 1) {
          throw error
        }
        // Değilse döngü başa döner ve tekrar dener
      }
    }
    throw new Error('Unexpected retry loop exit')
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

    // Önceki upload işlemlerini iptal et (aynı type için)
    const uploadKey = `${type}-upload`
    const existingController = uploadAbortControllers.current.get(uploadKey)
    if (existingController) {
      existingController.abort()
    }

    // Yeni AbortController oluştur
    const abortController = new AbortController()
    uploadAbortControllers.current.set(uploadKey, abortController)

    // Önceki timeout'ları temizle
    const existingTimeout = uploadTimeoutIds.current.get(uploadKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      uploadTimeoutIds.current.delete(uploadKey)
    }

    const toastId = toast.loading(`${type === 'logo' ? 'Logo' : 'Arka plan'} yükleniyor...`)

    try {
      // 0. Oturum Kontrolü (Daha dayanıklı)
      const session = await getSessionSafe()
      if (!session?.access_token) {
        toast.error("Oturum hazır değil veya süresi dolmuş. Lütfen tekrar giriş yapın.")
        return
      }

      // YUKARIDAKİ AKILLI FONKSİYONU ÇAĞIRIYORUZ
      const publicUrl = await uploadFileWithRetry(file, type, abortController.signal)


      // State'i güncelle (veritabanına kaydetmeye gerek yok, sadece state)
      if (type === 'logo') {
        onLogoUrlChange?.(publicUrl)
      } else {
        onBackgroundImageChange?.(publicUrl)
      }

      toast.success(t(`toasts.${type === 'logo' ? 'logoUploaded' : 'backgroundUploaded'}`), { id: toastId })
    } catch (error: any) {
      // İptal hatası ise sessizce geç
      if (error.message === 'Upload cancelled' || abortController.signal.aborted) {
        toast.dismiss(toastId)
        return
      }

      console.error("Upload error:", error)

      // Hata mesajını ayrıştır ve kullanıcı dostu bir mesaj göster
      let errorMessage = "Yükleme başarısız oldu."

      if (error?.message === 'UPLOAD_TIMEOUT' || error?.message === 'TIMEOUT' || error?.message?.includes('timeout')) {
        errorMessage = "İşlem zaman aşımına uğradı (tüm denemeler başarısız). İnternet bağlantınızı kontrol edip tekrar deneyin."
      } else if (error?.message) {
        // Diğer teknik hatalar için de kısa bir bilgi
        const msg = error.message.length > 60 ? error.message.substring(0, 60) + '...' : error.message
        errorMessage = `Hata: ${msg}`
      }

      toast.error(errorMessage, {
        id: toastId,
        duration: 5000 // Hata mesajı biraz daha uzun kalsın
      })
    } finally {
      // Cleanup: AbortController'ı temizle
      uploadAbortControllers.current.delete(uploadKey)

      // Dosya inputunu temizle ki aynı dosyayı tekrar seçebilsin
      if (e.target) e.target.value = ''
    }
  }

  // Arka plan resmi kaldırıldığında devam eden upload'ları iptal et
  useEffect(() => {
    if (backgroundImage === null) {
      const bgUploadKey = 'bg-upload'
      const controller = uploadAbortControllers.current.get(bgUploadKey)
      if (controller) {
        controller.abort()
        uploadAbortControllers.current.delete(bgUploadKey)
      }

      // Timeout'ları da temizle
      const timeout = uploadTimeoutIds.current.get(bgUploadKey)
      if (timeout) {
        clearTimeout(timeout)
        uploadTimeoutIds.current.delete(bgUploadKey)
      }
    }
  }, [backgroundImage])

  // Sütun kısıtlamaları
  const getAvailableColumns = (layout: string) => {
    switch (layout) {
      case 'bold':
      case 'luxury':
      case 'minimalist':
      case 'clean-white':
      case 'elegant-cards':
      case 'magazine':
      case 'fashion-lookbook':
        return [2]
      case 'modern-grid':
      case 'product-tiles':
      case 'catalog-pro':
      case 'retail':
      case 'tech-modern':
        return [2, 3]
      case 'compact-list':
        return [1] // Liste görünümleri genelde tek sütun
      case 'industrial':
      case 'classic-catalog':
      default:
        return [2, 3, 4]
    }
  }

  const availableColumns = getAvailableColumns(layout)

  // Otomatik sütun düzeltme
  useEffect(() => {
    if (availableColumns.length > 0 && !availableColumns.includes(columnsPerRow!) && onColumnsPerRowChange) {
      onColumnsPerRowChange(availableColumns[0])
    }
  }, [layout, availableColumns, columnsPerRow, onColumnsPerRowChange])


  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-900/50 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        {/* Modern App-like Tab Navigation */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 border-b px-4 py-3 shrink-0">
          <TabsList className="flex w-full max-w-[480px] mx-auto h-12 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 shadow-inner">
            <TabsTrigger
              value="content"
              className="flex-1 rounded-xl text-[10px] sm:text-xs uppercase tracking-[0.05em] font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 transition-all duration-300 gap-2"
            >
              <Package className="w-4 h-4" />
              {t('builder.productSelection')}
            </TabsTrigger>
            <TabsTrigger
              value="design"
              className="flex-1 rounded-xl text-[10px] sm:text-xs uppercase tracking-[0.05em] font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 transition-all duration-300 gap-2"
            >
              <Palette className="w-4 h-4" />
              {t('builder.designSettings')}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-12 px-3 sm:px-6 custom-scrollbar space-y-6">
          <TabsContent value="content" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* CATALOG DETAILS - COMPACT VERSION */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <Card className="relative bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm border-slate-200/50 shadow-sm rounded-[1.5rem] overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                      {t('builder.catalogDetails')}
                    </span>
                  </div>
                  {selectedProductIds.length > 0 && (
                    <div className="bg-indigo-600 text-[10px] font-black text-white px-2 py-0.5 rounded-full shadow-sm shadow-indigo-200">
                      {selectedProductIds.length} ÜRÜN SEÇİLDİ
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <textarea
                      className="w-full min-h-[90px] p-3 text-sm bg-transparent border-none rounded-xl focus:ring-0 transition-all outline-none resize-none placeholder:text-muted-foreground font-medium text-slate-700 dark:text-slate-300"
                      placeholder={t('builder.descriptionPlaceholder')}
                      value={description}
                      onChange={(e) => onDescriptionChange(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SEARCH & FILTERS SECTION */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    placeholder={t('builder.searchProducts')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-white dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-11 bg-white dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm text-xs font-bold px-4">
                        <SelectValue placeholder={t('common.category')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border shadow-xl">
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-11 rounded-2xl border border-slate-200/60 bg-white font-black text-[10px] uppercase px-4 transition-all",
                      filteredProducts.every(p => selectedProductIds.includes(p.id))
                        ? "text-destructive hover:bg-destructive/5"
                        : "text-indigo-600 hover:bg-indigo-50"
                    )}
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

              {/* PRODUCTS GRID - PREMIUM CARDS */}
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                {visibleProducts.map(product => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={cn(
                        "relative group cursor-pointer transition-all duration-300",
                        isSelected ? "scale-[0.98]" : "hover:scale-[1.02]"
                      )}
                    >
                      <div className={cn(
                        "aspect-[4/5] rounded-[1.25rem] overflow-hidden border transition-all duration-300 shadow-sm bg-white dark:bg-slate-900 relative",
                        isSelected
                          ? "border-indigo-600 ring-2 ring-indigo-600/20"
                          : "border-slate-100 dark:border-slate-800 hover:shadow-md"
                      )}>
                        <div className="absolute inset-0">
                          <NextImage
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className={cn(
                              "object-cover transition-all duration-500",
                              isSelected ? "scale-105" : "group-hover:scale-110"
                            )}
                            unoptimized
                          />
                          <div className={cn(
                            "absolute inset-0 transition-opacity duration-300",
                            isSelected ? "bg-indigo-600/10 opacity-100" : "bg-black/0 group-hover:bg-black/10 opacity-0"
                          )} />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent h-1/2 opacity-70" />
                        </div>

                        {/* Top Indicator */}
                        <div className="absolute top-2 right-2">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md",
                            isSelected
                              ? "bg-indigo-600 text-white scale-110"
                              : "bg-white/90 dark:bg-slate-800/90 text-transparent opacity-0 group-hover:opacity-100"
                          )}>
                            <CheckSquare className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Info Overlay */}
                        <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5">
                          <p className="text-[10px] sm:text-xs font-black text-white truncate drop-shadow-sm uppercase tracking-tight">
                            {product.name}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] sm:text-[10px] font-bold text-white/90 drop-shadow-sm">
                              {product.price ? `₺${product.price}` : "-"}
                            </span>
                            {product.sku && (
                              <span className="text-[8px] font-medium text-white/60 bg-black/20 px-1 rounded truncate max-w-[50px]">
                                {product.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {visibleCount < filteredProducts.length && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(v => v + 24)}
                    className="rounded-2xl h-10 px-6 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 border-slate-200/60 transition-all hover:bg-indigo-50"
                  >
                    {t('builder.loadMore', { count: filteredProducts.length - visibleCount })}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
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
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData("text", index.toString());
                            setDraggingIndex(index)
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDropIndex(index)
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const from = Number(e.dataTransfer.getData("text"))
                            const newList = [...selectedProductIds]
                            const [moved] = newList.splice(from, 1)
                            newList.splice(index, 0, moved)
                            onSelectedProductIdsChange(newList)
                            setDraggingIndex(null); setDropIndex(null)
                          }}
                          className={cn(
                            "flex items-center gap-3 p-2 bg-card rounded-lg border border-border shadow-sm transition-all group",
                            draggingIndex === index && "opacity-50 scale-95 border-dashed border-primary pre-drag",
                            dropIndex === index && draggingIndex !== index && "border-primary ring-2 ring-primary/10"
                          )}
                        >
                          <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 group-hover:text-muted-foreground shrink-0">
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <div className="w-8 h-8 rounded shrink-0 border border-border overflow-hidden relative">
                            <NextImage src={product.image_url || "/placeholder.svg"} alt={product.name} fill className="object-cover" unoptimized />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate text-foreground">{product.name}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => onSelectedProductIdsChange(selectedProductIds.filter(i => i !== id))} className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )
                    })}
                    {selectedProductIds.length === 0 && (
                      <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
                        <Package className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs font-medium">Henüz ürün seçilmedi</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="design" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            {/* DESIGN GRID - TWO COLUMNS ON DESKTOP */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 1. APPEARANCE SETTINGS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                    <Layout className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">{t('builder.designSettings')}</h3>
                </div>

                <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200/50 shadow-sm rounded-[1.5rem] overflow-hidden">
                  <CardContent className="p-5 space-y-6">
                    {/* Premium Toggles */}
                    <div className="space-y-4">
                      {[
                        { label: t('builder.showPrices'), value: showPrices, onChange: onShowPricesChange, icon: <Sparkles className="w-3.5 h-3.5" /> },
                        { label: t('builder.showDescriptions'), value: showDescriptions, onChange: onShowDescriptionsChange },
                        { label: "Özellikleri Göster", value: showAttributes, onChange: onShowAttributesChange, disabled: layout === 'magazine' },
                        { label: "Stok Kodlarını Göster", value: showSku, onChange: onShowSkuChange, disabled: layout === 'magazine' },
                        { label: "Ürün URL'leri", value: showUrls, onChange: onShowUrlsChange },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-2xl transition-all duration-300",
                            item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          )}
                          onClick={() => !item.disabled && item.onChange?.(!item.value)}
                        >
                          <span className={cn(
                            "text-xs font-bold transition-colors",
                            item.disabled ? "text-slate-400" : "text-slate-700 dark:text-slate-300"
                          )}>
                            {item.label}
                            {item.disabled && <span className="text-[8px] ml-2 font-medium italic opacity-60">(Dergide yok)</span>}
                          </span>
                          <div className={cn(
                            "w-10 h-5 rounded-full relative transition-all duration-500",
                            item.value && !item.disabled ? "bg-indigo-600 shadow-md shadow-indigo-200" : "bg-slate-200 dark:bg-slate-800"
                          )}>
                            <div className={cn(
                              "absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-all duration-500",
                              item.value && !item.disabled && "translate-x-5"
                            )} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Image Alignment Pill */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Label className="text-[11px] font-black uppercase text-slate-500 mb-2.5 block tracking-widest text-center">{t('builder.productImages') || "Ürün Fotoğrafları"}</Label>
                      <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl gap-1">
                        {[
                          { value: 'cover' as const, label: 'Kırp' },
                          { value: 'contain' as const, label: 'Sığdır' },
                          { value: 'fill' as const, label: 'Doldur' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => onProductImageFitChange?.(option.value)}
                            className={cn(
                              "flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all duration-300",
                              productImageFit === option.value
                                ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-md scale-[1.02]"
                                : "text-slate-500 hover:text-slate-700"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Column Count Pill */}
                    {['modern-grid', 'product-tiles', 'catalog-pro', 'bold', 'tech-modern', 'clean-white', 'elegant-cards', 'retail'].includes(layout) && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Label className="text-[11px] font-black uppercase text-slate-500 mb-2.5 block tracking-widest text-center">Görünüm Düzeni</Label>
                        <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl gap-1">
                          {[2, 3, 4].map((num) => (
                            <button
                              key={num}
                              onClick={() => onColumnsPerRowChange?.(num)}
                              className={cn(
                                "flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all duration-300",
                                columnsPerRow === num
                                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-md scale-[1.02]"
                                  : "text-slate-500 hover:text-slate-700"
                              )}
                            >
                              {num} Sütun
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 2. LOGO & BRANDING */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">{t('builder.logoBranding')}</h3>
                </div>

                <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200/50 shadow-sm rounded-[1.5rem] overflow-hidden">
                  <CardContent className="p-5 space-y-6">
                    {/* Logo Upload Area */}
                    <div
                      className={cn(
                        "relative aspect-[16/7] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden",
                        logoUrl
                          ? "border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800"
                          : "border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-400 group"
                      )}
                      onClick={() => {
                        handleUploadClick()
                        logoInputRef.current?.click()
                      }}
                    >
                      {logoUrl ? (
                        <div className="relative w-[85%] h-[85%] group">
                          <NextImage src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                          <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 rounded-2xl">
                            <span className="text-[9px] font-black uppercase text-slate-800 bg-white/90 px-3 py-1.5 rounded-full shadow-xl ring-1 ring-black/5">DEĞİŞTİR</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-6 space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto transition-transform group-hover:-translate-y-1">
                            <Upload className="w-6 h-6 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">{t('builder.logoUpload')}</p>
                            <p className="text-[9px] text-slate-400 font-bold tracking-tight">PNG, WEBP (Max 2MB)</p>
                          </div>
                        </div>
                      )}
                      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                    </div>

                    {/* Logo/Title Settings Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Logo Konumu</Label>
                        <Select value={logoPosition || 'header-left'} onValueChange={(v) => onLogoPositionChange?.(v as any)}>
                          <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl shadow-2xl">
                            <SelectItem value="header-left">Sol Üst</SelectItem>
                            <SelectItem value="header-center">Orta Üst</SelectItem>
                            <SelectItem value="header-right">Sağ Üst</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Başlık Hizalama</Label>
                        <Select value={_titlePosition || 'left'} onValueChange={(v) => _onTitlePositionChange?.(v as any)}>
                          <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl shadow-2xl">
                            <SelectItem value="left">Sola Dayalı</SelectItem>
                            <SelectItem value="center">Ortala</SelectItem>
                            <SelectItem value="right">Sağa Dayalı</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Branding Colors */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Renk Paleti</span>
                        <div className="flex gap-1.5">
                          {['#4f46e5', '#9333ea', '#c026d3', '#0f172a'].map((color) => (
                            <button
                              key={color}
                              className="w-5 h-5 rounded-full border border-white shadow-sm transition-transform hover:scale-125"
                              style={{ backgroundColor: color }}
                              onClick={() => onPrimaryColorChange(`rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 1)`)}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Primary Color Picker */}
                        <div className="space-y-2 relative" ref={primaryColorPickerRef}>
                          <Label className="text-[10px] font-bold text-slate-500">Üst Kart Rengi</Label>
                          <div
                            className="h-12 w-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 flex items-center px-3 gap-2 cursor-pointer transition-all hover:border-indigo-400"
                            onClick={() => setShowPrimaryColorPicker(!showPrimaryColorPicker)}
                          >
                            <div className="w-6 h-6 rounded-lg shadow-sm ring-1 ring-black/5" style={{ backgroundColor: primaryColor }} />
                            <span className="text-[10px] font-mono font-bold uppercase">{primaryColorParsed.hexColor}</span>
                          </div>
                          {showPrimaryColorPicker && (
                            <div className="absolute bottom-full left-0 mb-3 z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-border p-4 animate-in slide-in-from-bottom-4 duration-300">
                              <HexColorPicker
                                color={primaryColorParsed.hexColor}
                                onChange={(hex) => {
                                  const r = parseInt(hex.substring(1, 3), 16), g = parseInt(hex.substring(3, 5), 16), b = parseInt(hex.substring(5, 7), 16)
                                  onPrimaryColorChange(`rgba(${r}, ${g}, ${b}, ${primaryColorParsed.rgb.a})`)
                                }}
                                style={{ width: '220px', height: '140px' }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Text Color Picker */}
                        <div className="space-y-2 relative" ref={headerTextColorPickerRef}>
                          <Label className="text-[10px] font-bold text-slate-500">Üst Yazı Rengi</Label>
                          <div
                            className="h-12 w-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 flex items-center px-3 gap-2 cursor-pointer transition-all hover:border-indigo-400"
                            onClick={() => setShowHeaderTextColorPicker(!showHeaderTextColorPicker)}
                          >
                            <div className="w-6 h-6 rounded-lg shadow-sm ring-1 ring-black/5" style={{ backgroundColor: headerTextColor || '#ffffff' }} />
                            <span className="text-[10px] font-mono font-bold uppercase">{headerTextColor || '#FFFFFF'}</span>
                          </div>
                          {showHeaderTextColorPicker && (
                            <div className="absolute bottom-full right-0 mb-3 z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-border p-4 animate-in slide-in-from-bottom-4 duration-300">
                              <HexColorPicker
                                color={headerTextColor || '#ffffff'}
                                onChange={(hex) => onHeaderTextColorChange?.(hex)}
                                style={{ width: '220px', height: '140px' }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 3. BACKGROUND SETTINGS - FULL WIDTH ON LG */}
              <div className="space-y-4 lg:col-span-2">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">{t('builder.backgroundSettings')}</h3>
                </div>

                <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200/50 shadow-sm rounded-[2rem] overflow-hidden">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* BG Color & Gradient */}
                      <div className="space-y-6">
                        <div className="space-y-2 relative" ref={backgroundColorPickerRef}>
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Arka Plan Rengi</Label>
                          <div
                            className="h-14 w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 gap-3 cursor-pointer transition-all hover:border-indigo-300"
                            onClick={() => setShowBackgroundColorPicker(!showBackgroundColorPicker)}
                          >
                            <div className="w-8 h-8 rounded-xl shadow-md ring-2 ring-white" style={{ backgroundColor: backgroundColor || '#ffffff' }} />
                            <span className="text-xs font-mono font-bold uppercase tracking-tight">{backgroundColor || '#FFFFFF'}</span>
                          </div>
                          {showBackgroundColorPicker && (
                            <div className="absolute top-full left-0 mt-3 z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-border p-4 animate-in zoom-in-95 duration-300">
                              <HexColorPicker
                                color={backgroundColor || '#ffffff'}
                                onChange={(hex) => onBackgroundColorChange?.(hex)}
                                style={{ width: '240px', height: '160px' }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Gradyan Efekti</Label>
                          <Select value={backgroundGradient || 'none'} onValueChange={(v) => onBackgroundGradientChange?.(v === 'none' ? null : v)}>
                            <SelectTrigger className="h-14 rounded-2xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-xs font-bold">
                              <SelectValue placeholder="Yok" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl">
                              <SelectItem value="none">Düz Renk</SelectItem>
                              <SelectItem value="linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)">Yumuşak Slate</SelectItem>
                              <SelectItem value="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">Indigo Gece</SelectItem>
                              <SelectItem value="linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)">Pembe Bulut</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* BG Image Upload */}
                      <div className="space-y-3 lg:col-span-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fon Görseli</Label>
                        <div className="flex flex-col sm:flex-row gap-4 h-full min-h-[140px]">
                          <div
                            className={cn(
                              "flex-1 rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden",
                              backgroundImage
                                ? "border-indigo-100 bg-white shadow-inner"
                                : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 group"
                            )}
                            onClick={() => {
                              handleUploadClick()
                              bgInputRef.current?.click()
                            }}
                          >
                            {backgroundImage ? (
                              <div className="relative w-full h-full p-2 group">
                                <NextImage src={backgroundImage} alt="BG" fill className="object-contain" unoptimized />
                                <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 rounded-xl">
                                  <span className="text-[9px] font-black text-slate-800 bg-white/90 px-3 py-1.5 rounded-full shadow-lg">DEĞİŞTİR</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center p-4 space-y-2">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                                  <ImageIcon className="w-5 h-5 text-blue-500" />
                                </div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-tight">Görsel Seç</p>
                              </div>
                            )}
                            <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg')} />
                          </div>

                          {backgroundImage && (
                            <div className="flex-1 flex flex-col gap-3 animate-in slide-in-from-right-4 duration-500">
                              <div className="space-y-1.5">
                                <Label className="text-[9px] font-black text-slate-400 px-1">Görünüm</Label>
                                <Select value={backgroundImageFit} onValueChange={(v) => onBackgroundImageFitChange?.(v as any)}>
                                  <SelectTrigger className="h-10 rounded-xl text-xs font-bold"><SelectValue /></SelectTrigger>
                                  <SelectContent className="rounded-2xl">
                                    <SelectItem value="cover">Kapla (Cover)</SelectItem>
                                    <SelectItem value="contain">Sığdır (Contain)</SelectItem>
                                    <SelectItem value="fill">Doldur (Stretch)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onBackgroundImageChange?.(null)}
                                className="mt-auto h-10 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none"
                              >
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
            </div>

            {/* 4. TEMPLATE SELECTOR - STUNNING GRID */}
            <div className="space-y-6 pt-6 animate-in fade-in duration-700">
              <div className="flex items-center justify-center gap-3">
                <div className="h-px bg-slate-200 flex-1 hidden sm:block" />
                <div className="flex items-center gap-2 px-6">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-lg font-black uppercase tracking-[0.1em] text-slate-800 dark:text-slate-200">{t('builder.templateStyle')}</h3>
                </div>
                <div className="h-px bg-slate-200 flex-1 hidden sm:block" />
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {TEMPLATES.map((tmpl) => {
                  const isSelected = layout === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleTemplateSelect(tmpl.id, tmpl.isPro)}
                      className={cn(
                        "group relative aspect-[3/4.2] rounded-[1.75rem] transition-all duration-500 cursor-pointer overflow-hidden",
                        isSelected
                          ? "ring-4 ring-indigo-600 ring-offset-4 ring-offset-slate-50 scale-95 shadow-2xl"
                          : "hover:scale-[1.03] hover:shadow-xl shadow-md border-border"
                      )}
                    >
                      <div className="absolute inset-0 bg-white dark:bg-slate-900">
                        <ResponsiveContainer>
                          <CatalogPreview
                            layout={tmpl.id}
                            catalogName={tmpl.name}
                            products={getPreviewProductsByLayout(tmpl.id)}
                            primaryColor={primaryColor || '#4f46e5'}
                            headerTextColor={headerTextColor || '#ffffff'}
                            showPrices={showPrices ?? true}
                            showDescriptions={showDescriptions ?? true}
                            showAttributes={showAttributes ?? true}
                            showSku={showSku ?? true}
                            showUrls={showUrls ?? true}
                            productImageFit={productImageFit || 'cover'}
                          />
                        </ResponsiveContainer>
                      </div>

                      {/* Premium Glass Overlay */}
                      <div className={cn(
                        "absolute inset-x-0 bottom-0 p-3.5 transition-all duration-500 z-20",
                        isSelected
                          ? "bg-indigo-600/95 backdrop-blur-md text-white"
                          : "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-white group-hover:bg-indigo-600 group-hover:text-white"
                      )}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] truncate">{tmpl.name}</p>
                          {tmpl.isPro && !isSelected && (
                            <span className="text-[8px] font-black bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded shadow-sm">PRO</span>
                          )}
                        </div>
                      </div>

                      {/* Status Indicator */}
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-white text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center shadow-xl animate-in zoom-in-50 duration-300 z-30">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                      )}

                      {/* Selection Overlay Tint */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none z-10" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
