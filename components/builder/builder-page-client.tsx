"use client"

import { useState, useTransition, useId, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Download, Share2, Save, ArrowLeft, Eye, Pencil, Globe, MoreVertical, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { CatalogEditor } from "@/components/builder/catalog-editor"
import { CatalogPreview } from "@/components/builder/catalog-preview"
import { UpgradeModal } from "@/components/builder/upgrade-modal"
import { ShareModal } from "@/components/catalogs/share-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/lib/user-context"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Catalog, createCatalog, updateCatalog, publishCatalog } from "@/lib/actions/catalogs"
import { type Product } from "@/lib/actions/products"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useTranslation } from "@/lib/i18n-provider"

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
}

interface BuilderPageClientProps {
  catalog: Catalog | null
  products: Product[]
}

export function BuilderPageClient({ catalog, products }: BuilderPageClientProps) {
  const router = useRouter()
  const { user, canExport, refreshUser } = useUser()
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [catalogName, setCatalogName] = useState(catalog?.name || "")
  const [catalogDescription, setCatalogDescription] = useState(catalog?.description || "")
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(catalog?.product_ids || [])
  const [layout, setLayout] = useState(catalog?.layout || "grid")
  const [primaryColor, setPrimaryColor] = useState(catalog?.primary_color || "#7c3aed")
  const [showPrices, setShowPrices] = useState(catalog?.show_prices ?? true)
  const [showDescriptions, setShowDescriptions] = useState(catalog?.show_descriptions ?? true)
  const [showAttributes, setShowAttributes] = useState(catalog?.show_attributes ?? false)
  const [view, setView] = useState<"split" | "editor" | "preview">("split")
  const [currentCatalogId, setCurrentCatalogId] = useState(catalog?.id || null)
  const [isPublished, setIsPublished] = useState(catalog?.is_published || false)
  const [isMobile, setIsMobile] = useState(false)
  // Yeni kişiselleştirme state'leri
  const [columnsPerRow, setColumnsPerRow] = useState(catalog?.columns_per_row || 3)
  const [backgroundColor, setBackgroundColor] = useState(catalog?.background_color || '#ffffff')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(catalog?.background_image || null)
  const [backgroundImageFit, setBackgroundImageFit] = useState<string>(catalog?.background_image_fit || 'cover')
  const [backgroundGradient, setBackgroundGradient] = useState<string | null>(catalog?.background_gradient || null)
  const [logoUrl, setLogoUrl] = useState<string | null>(catalog?.logo_url || user?.logo_url || null)
  const [logoPosition, setLogoPosition] = useState<string>(catalog?.logo_position || 'header-left')
  const [logoSize, setLogoSize] = useState<string>(catalog?.logo_size || 'medium')
  const [titlePosition, setTitlePosition] = useState<string>((catalog as any)?.title_position || 'left')
  const [showShareModal, setShowShareModal] = useState(false)
  const tabsId = useId()
  const [showExitDialog, setShowExitDialog] = useState(false)

  // Kaydedilmemiş değişiklik takibi
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedState, setLastSavedState] = useState({
    name: catalog?.name || "",
    description: catalog?.description || "",
    productIds: catalog?.product_ids || [],
    layout: catalog?.layout || "grid",
    primaryColor: catalog?.primary_color || "#7c3aed",
    showPrices: catalog?.show_prices ?? true,
    showDescriptions: catalog?.show_descriptions ?? true,
    showAttributes: catalog?.show_attributes ?? false,
    columnsPerRow: catalog?.columns_per_row || 3,
    backgroundColor: catalog?.background_color || '#ffffff',
  })

  // Değişiklik var mı kontrol et
  const hasUnsavedChanges = isDirty || (
    catalogName !== lastSavedState.name ||
    catalogDescription !== lastSavedState.description ||
    JSON.stringify(selectedProductIds) !== JSON.stringify(lastSavedState.productIds) ||
    layout !== lastSavedState.layout ||
    primaryColor !== lastSavedState.primaryColor ||
    showPrices !== lastSavedState.showPrices ||
    showDescriptions !== lastSavedState.showDescriptions ||
    showAttributes !== lastSavedState.showAttributes ||
    columnsPerRow !== lastSavedState.columnsPerRow ||
    backgroundColor !== lastSavedState.backgroundColor
  )

  // Sayfa kapatma/yenileme uyarısı
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = 'Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinizden emin misiniz?'
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Herhangi bir değişiklikte isDirty'i true yap
  useEffect(() => {
    // İlk render'da değil, sonraki değişikliklerde dirty yap
    const isInitialRender =
      catalogName === (catalog?.name || "") &&
      catalogDescription === (catalog?.description || "") &&
      JSON.stringify(selectedProductIds) === JSON.stringify(catalog?.product_ids || [])

    if (!isInitialRender) {
      setIsDirty(true)
    }
  }, [catalogName, catalogDescription, selectedProductIds, layout, primaryColor, showPrices, showDescriptions, showAttributes, columnsPerRow, backgroundColor])

  // Autosave state
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced Autosave - 3 saniye bekle, sonra kaydet
  useEffect(() => {
    // Sadece varolan kataloglar için autosave (yeni katalog = ilk manuel kayıt gerekli)
    if (!currentCatalogId || !isDirty) return

    // Önceki timeout'u temizle
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // 3 saniye sonra kaydet
    autoSaveTimeoutRef.current = setTimeout(async () => {
      setIsAutoSaving(true)
      try {
        await updateCatalog(currentCatalogId, {
          name: catalogName,
          description: catalogDescription,
          product_ids: selectedProductIds,
          layout,
          primary_color: primaryColor,
          show_prices: showPrices,
          show_descriptions: showDescriptions,
          columns_per_row: columnsPerRow,
          background_color: backgroundColor,
          background_image: backgroundImage,
          background_image_fit: backgroundImageFit as any,
          background_gradient: backgroundGradient,
          logo_url: logoUrl,
          logo_position: logoPosition as any,
          logo_size: logoSize as any,
        })

        // Başarılı - state'leri güncelle
        setLastSavedState({
          name: catalogName,
          description: catalogDescription,
          productIds: selectedProductIds,
          layout,
          primaryColor,
          showPrices,
          showDescriptions,
          showAttributes,
          columnsPerRow,
          backgroundColor,
        })
        setIsDirty(false)
      } catch (error) {
        console.error('Autosave failed:', error)
        // Sessizce fail - kullanıcıyı rahatsız etme
      } finally {
        setIsAutoSaving(false)
      }
    }, 3000)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [currentCatalogId, isDirty, catalogName, catalogDescription, selectedProductIds, layout, primaryColor, showPrices, showDescriptions, columnsPerRow, backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient, logoUrl, logoPosition, logoSize])

  // Ürünleri selectedProductIds sırasına göre sırala (kullanıcının belirlediği sıra)
  const selectedProducts = selectedProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined)

  // Ekran boyutunu takip et
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 // md breakpoint
      setIsMobile(mobile)
      // Mobilde varsayılan olarak editor görünümü
      if (mobile && view === "split") {
        setView("editor")
      } else if (!mobile && view !== "split") {
        setView("split")
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, []) // Only run on mount

  const handleSave = () => {
    startTransition(async () => {
      try {
        if (currentCatalogId) {
          await updateCatalog(currentCatalogId, {
            name: catalogName,
            description: catalogDescription,
            product_ids: selectedProductIds,
            layout,
            primary_color: primaryColor,
            show_prices: showPrices,
            show_descriptions: showDescriptions,
            columns_per_row: columnsPerRow,
            background_color: backgroundColor,
            background_image: backgroundImage,
            background_image_fit: backgroundImageFit as any,
            background_gradient: backgroundGradient,
            logo_url: logoUrl,
            logo_position: logoPosition as any,
            logo_size: logoSize as any,
          })
          toast.success(t('toasts.catalogSaved'))
        } else {
          const newCatalog = await createCatalog({
            name: catalogName,
            description: catalogDescription,
            layout,
          })
          setCurrentCatalogId(newCatalog.id)
          await updateCatalog(newCatalog.id, {
            product_ids: selectedProductIds,
            primary_color: primaryColor,
            show_prices: showPrices,
            show_descriptions: showDescriptions,
            columns_per_row: columnsPerRow,
            background_color: backgroundColor,
            background_image: backgroundImage,
            background_image_fit: backgroundImageFit as any,
            background_gradient: backgroundGradient,
            logo_url: logoUrl,
            logo_position: logoPosition as any,
            logo_size: logoSize as any,
          })
          router.replace(`/dashboard/builder?id=${newCatalog.id}`)
          toast.success(t('toasts.catalogCreated'))
        }

        // Kayıt başarılı - lastSavedState güncelle
        setLastSavedState({
          name: catalogName,
          description: catalogDescription,
          productIds: selectedProductIds,
          layout,
          primaryColor,
          showPrices,
          showDescriptions,
          showAttributes,
          columnsPerRow,
          backgroundColor,
        })
        setIsDirty(false)
      } catch {
        toast.error(t('toasts.catalogSaveFailed'))
      }
    })
  }

  const handlePublish = () => {
    if (!currentCatalogId) {
      toast.error(t('toasts.saveCatalogFirst'))
      return
    }

    startTransition(async () => {
      try {
        // 1. Önce mevcut durumu ve slug'ı kaydet
        const companyPart = user?.company || user?.name || "catalog"
        const namePart = catalogName || "untitled"
        const idPart = currentCatalogId.slice(0, 6)
        const shareSlug = `${slugify(companyPart)}-${slugify(namePart)}-${idPart}`

        await updateCatalog(currentCatalogId, {
          name: catalogName,
          description: catalogDescription,
          product_ids: selectedProductIds,
          layout,
          primary_color: primaryColor,
          show_prices: showPrices,
          show_descriptions: showDescriptions,
          show_attributes: showAttributes,
          columns_per_row: columnsPerRow,
          background_color: backgroundColor,
          background_image: backgroundImage,
          background_image_fit: backgroundImageFit as any,
          background_gradient: backgroundGradient,
          logo_url: logoUrl,
          logo_position: logoPosition as any,
          logo_size: logoSize as any,
          share_slug: shareSlug,
        })

        // 2. Sonra yayın durumunu güncelle
        const newPublishState = !isPublished
        await publishCatalog(currentCatalogId, newPublishState)
        setIsPublished(newPublishState)

        if (newPublishState) {
          // Yayınlandıysa yeni sekmede aç (yeni slug ile)
          const shareUrl = `${window.location.origin}/catalog/${shareSlug}`
          toast.success("Katalog yayınlandı ve güncellendi!", {
            action: {
              label: "Linki Kopyala",
              onClick: () => {
                navigator.clipboard.writeText(shareUrl)
                toast.success(t('toasts.linkCopied'))
              }
            }
          })
          // Kısa bir gecikme ile yeni sekme aç
          setTimeout(() => {
            window.open(shareUrl, '_blank')
          }, 500)
        } else {
          toast.success(t('toasts.catalogDeleted'))
        }
      } catch (error) {
        console.error("Publish error:", error)
        toast.error("Yayın durumu güncellenemedi")
      }
    })
  }

  const handleDownloadPDF = async () => {
    try {
      toast.info(t('builder.downloadStarting'), { id: "pdf-process" })

      if (!canExport()) {
        toast.dismiss("pdf-process")
        setShowUpgradeModal(true)
        return
      }

      // Mobilde önizleme görünümüne geç
      const previousView = view
      if (view === 'editor') {
        setView('preview')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const isPro = user?.plan === "pro"
      const resolutionText = isPro ? " (Yüksek Çözünürlük)" : ""
      toast.loading(`Görseller işleniyor ve PDF hazırlanıyor${resolutionText}...`, { id: "pdf-process" })

      const { toPng } = await import("html-to-image")
      const { jsPDF } = await import("jspdf")

      let container = document.getElementById('catalog-preview-container')
      if (!container) {
        setView('split')
        await new Promise(resolve => setTimeout(resolve, 1000))
        container = document.getElementById('catalog-preview-container')
      }

      if (!container) throw new Error("Önizleme alanı bulunamadı.")

      // Find Pages
      const pages = container.querySelectorAll('.catalog-page')
      if (pages.length === 0) throw new Error("Sayfa yapısı bulunamadı. Lütfen sayfayı yenileyin.")

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Process Each Page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement
        toast.loading(`Sayfa ${i + 1} / ${pages.length} hazırlanıyor${resolutionText}...`, { id: "pdf-process" })

        // Clone Page individually
        const clone = page.cloneNode(true) as HTMLElement
        document.body.appendChild(clone)

        // Reset styles for capture
        clone.style.position = 'fixed'
        clone.style.top = '0'
        clone.style.left = '0'
        clone.style.zIndex = '-9999'
        clone.style.transform = 'none'
        clone.style.margin = '0'
        clone.style.boxShadow = 'none'
        clone.style.width = '794px'
        clone.style.height = '1123px'

        try {
          // Process Images
          const images = clone.querySelectorAll('img')
          const imagePromises = Array.from(images).map(async (img) => {
            try {
              if (!img.src || img.src.startsWith('data:')) return

              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 8000)

              const response = await fetch(img.src, {
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit'
              })
              clearTimeout(timeoutId)

              if (!response.ok) throw new Error('Network error')

              const blob = await response.blob()
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })

              img.src = base64
              img.style.display = 'block'
              img.removeAttribute('crossOrigin')
              img.removeAttribute('srcset')
              img.removeAttribute('loading')

            } catch (e) {
              console.warn("Image skipped:", img.src)
              img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              img.style.objectFit = 'contain'
            }
          })

          await Promise.allSettled(imagePromises)
          await new Promise(r => setTimeout(r, 500))

          const imgData = await toPng(clone, {
            quality: 1, // Max quality
            pixelRatio: isPro ? 4 : 2, // Pro users get double resolution (for printing)
            backgroundColor: '#ffffff',
            cacheBust: true,
          })

          if (i > 0) pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

        } finally {
          if (document.body.contains(clone)) {
            document.body.removeChild(clone)
          }
        }
      }

      pdf.save(`${catalogName || 'Katalog'}.pdf`)

      // PDF başarıyla indirildikten SONRA export hakkını kullan
      const { incrementUserExports } = await import("@/lib/actions/user")
      const result = await incrementUserExports(catalogName)

      if (!result.error) {
        // Kullanıcı limitini güncelle
        await refreshUser()
      }

      // Önceki görünüme dön
      setView(previousView)

      toast.success(t('builder.pdfDownloaded') + resolutionText, { id: "pdf-process" })

    } catch (err: any) {
      console.error("PDF Fail:", err)
      const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      toast.error(t('builder.pdfFailed') + ": " + msg, { id: "pdf-process" })
    }
  }

  const handleShare = () => {
    if (!currentCatalogId || !catalog?.share_slug) {
      toast.error(t('toasts.saveCatalogFirst'))
      return
    }
    setShowShareModal(true)
  }

  // Görünüm modunu mobil için kontrol et
  const effectiveView = isMobile ? (view === "split" ? "editor" : view) : view

  return (
    <div className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] flex flex-col -m-3 sm:-m-4 md:-m-6 overflow-hidden">
      {/* Header - Clean Single Row */}
      <div className="h-12 sm:h-14 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-2 sm:px-4 shrink-0">

        {/* Left: Back + Name + Status */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => {
              if (hasUnsavedChanges) {
                setShowExitDialog(true)
              } else {
                router.push('/dashboard')
              }
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Input
            value={catalogName}
            onChange={(e) => setCatalogName(e.target.value)}
            className="h-8 font-medium text-sm w-[120px] sm:w-[180px] md:w-[220px] border-none bg-muted/50 focus:bg-background"
            placeholder={t('builder.catalogNamePlaceholder')}
          />
          {isPublished && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              <Globe className="w-2.5 h-2.5" />
              <span className="hidden md:inline">{t('builder.published')}</span>
            </div>
          )}
          {isAutoSaving ? (
            <div className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="hidden sm:inline">Kaydediliyor...</span>
            </div>
          ) : hasUnsavedChanges ? (
            <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              <span className="hidden sm:inline">Kaydedilmedi</span>
            </div>
          ) : currentCatalogId ? (
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-green-600 bg-green-50 dark:bg-green-950/50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="hidden md:inline">Kaydedildi</span>
            </div>
          ) : null}
        </div>

        {/* Center: View Mode Segmented Control (Desktop only) */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView("split")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${view === "split"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setView("editor")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${view === "editor"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("preview")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${view === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile View Toggle */}
        {isMobile && (
          <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView("editor")}
              className={`p-1.5 rounded-md transition-all ${effectiveView === "editor"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
                }`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("preview")}
              className={`p-1.5 rounded-md transition-all ${effectiveView === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
                }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Save - Primary Action */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="h-8 gap-1.5 px-3 bg-primary hover:bg-primary/90"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">{isPending ? t('builder.saving') : t('builder.save')}</span>
          </Button>

          {/* PDF - Secondary Action */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-3"
            onClick={handleDownloadPDF}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">PDF</span>
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                {t('builder.share')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePublish} disabled={isPending || !currentCatalogId}>
                <Globe className="w-4 h-4 mr-2" />
                {isPublished ? t('builder.unpublish') : t('builder.publish')}
              </DropdownMenuItem>
              {isPublished && catalog?.share_slug && (
                <DropdownMenuItem asChild>
                  <a href={`/catalog/${catalog.share_slug}`} target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('builder.viewCatalog')}
                  </a>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(effectiveView === "split" || effectiveView === "editor") && (
          <div className={`${effectiveView === "split" ? "w-1/2" : "w-full"} border-r overflow-auto`}>
            <CatalogEditor
              products={products}
              selectedProductIds={selectedProductIds}
              onSelectedProductIdsChange={setSelectedProductIds}
              catalogName={catalogName}
              onCatalogNameChange={setCatalogName}
              description={catalogDescription}
              onDescriptionChange={setCatalogDescription}
              layout={layout}
              onLayoutChange={setLayout}
              primaryColor={primaryColor}
              onPrimaryColorChange={setPrimaryColor}
              showPrices={showPrices}
              onShowPricesChange={setShowPrices}
              showDescriptions={showDescriptions}
              onShowDescriptionsChange={setShowDescriptions}
              showAttributes={showAttributes}
              onShowAttributesChange={setShowAttributes}
              userPlan={user?.plan || "free"}
              onUpgrade={() => setShowUpgradeModal(true)}
              columnsPerRow={columnsPerRow}
              onColumnsPerRowChange={setColumnsPerRow}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={setBackgroundColor}
              backgroundImage={backgroundImage}
              onBackgroundImageChange={setBackgroundImage}
              backgroundImageFit={backgroundImageFit}
              onBackgroundImageFitChange={setBackgroundImageFit}
              backgroundGradient={backgroundGradient}
              onBackgroundGradientChange={setBackgroundGradient}
              logoUrl={logoUrl}
              onLogoUrlChange={setLogoUrl}
              logoPosition={logoPosition}
              onLogoPositionChange={setLogoPosition}
              logoSize={logoSize}
              onLogoSizeChange={setLogoSize}
              titlePosition={titlePosition}
              onTitlePositionChange={setTitlePosition}
            />
          </div>
        )}

        {/* Preview */}
        {(effectiveView === "split" || effectiveView === "preview") && (
          <div id="catalog-preview-container" className={`${effectiveView === "split" ? "w-1/2" : "w-full"} bg-muted/30 overflow-auto`}>
            <CatalogPreview
              catalogName={catalogName}
              products={selectedProducts}
              layout={layout}
              primaryColor={primaryColor}
              showPrices={showPrices}
              showDescriptions={showDescriptions}
              showAttributes={showAttributes}
              columnsPerRow={columnsPerRow}
              backgroundColor={backgroundColor}
              backgroundImage={backgroundImage}
              backgroundImageFit={backgroundImageFit as any}
              backgroundGradient={backgroundGradient}
              logoUrl={logoUrl}
              logoPosition={logoPosition}
              logoSize={logoSize}
              titlePosition={titlePosition}
            />
          </div>
        )}
      </div>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />

      {/* Share Modal */}
      {catalog?.share_slug && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          catalogName={catalogName || catalog?.name || 'Katalog'}
          catalogDescription={catalogDescription || catalog?.description}
          shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/catalog/${catalog.share_slug}` : ''}
        />
      )}

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaydedilmemiş Değişiklikler</AlertDialogTitle>
            <AlertDialogDescription>
              Katalogda kaydedilmemiş değişiklikler var. Çıkmadan önce kaydetmek ister misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowExitDialog(false)}>
              İptal
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                setShowExitDialog(false)
                router.push('/dashboard')
              }}
            >
              Kaydetmeden Çık
            </Button>
            <Button
              onClick={() => {
                handleSave()
                setShowExitDialog(false)
                // Kayıt tamamlandıktan sonra yönlendir
                setTimeout(() => router.push('/dashboard'), 500)
              }}
            >
              Kaydet ve Çık
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
