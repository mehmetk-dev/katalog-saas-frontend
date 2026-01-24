"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Download, Share2, Save, ArrowLeft, Eye, EyeOff, Pencil, Globe, MoreVertical, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { CatalogEditor } from "@/components/builder/catalog-editor"
import { CatalogPreview } from "@/components/builder/catalog-preview"
import { UpgradeModal } from "@/components/builder/upgrade-modal"
import { ShareModal } from "@/components/catalogs/share-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/lib/user-context"
import { type Catalog, createCatalog, updateCatalog } from "@/lib/actions/catalogs"
import { type Product } from "@/lib/actions/products"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
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
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/-+/g, '-')   // Replace multiple - with single -
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
  // Helper: Convert hex to rgba
  const hexToRgba = (hex: string, alpha: number = 1): string => {
    if (hex.startsWith('rgba')) return hex
    if (hex === 'transparent') return 'rgba(0, 0, 0, 0)'
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      const r = parseInt(result[1], 16)
      const g = parseInt(result[2], 16)
      const b = parseInt(result[3], 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return `rgba(124, 58, 237, ${alpha})` // default purple
  }

  const getInitialPrimaryColor = () => {
    if (!catalog?.primary_color) return "rgba(124, 58, 237, 1)"
    if (catalog.primary_color.startsWith('rgba')) return catalog.primary_color
    if (catalog.primary_color === 'transparent') return 'rgba(0, 0, 0, 0)'
    return hexToRgba(catalog.primary_color)
  }

  const [primaryColor, setPrimaryColor] = useState(getInitialPrimaryColor())
  const [headerTextColor, setHeaderTextColor] = useState(catalog?.header_text_color || "#ffffff")
  const [showPrices, setShowPrices] = useState(catalog?.show_prices ?? true)
  const [showDescriptions, setShowDescriptions] = useState(catalog?.show_descriptions ?? true)
  const [showAttributes, setShowAttributes] = useState(catalog?.show_attributes ?? false)
  const [showSku, setShowSku] = useState(catalog?.show_sku ?? true)
  const [showUrls, setShowUrls] = useState(catalog?.show_urls ?? false)
  const [view, setView] = useState<"split" | "editor" | "preview">("split")
  const [currentCatalogId, setCurrentCatalogId] = useState(catalog?.id || null)
  const [isPublished, setIsPublished] = useState(catalog?.is_published || false)
  const [isMobile, setIsMobile] = useState(false)
  // Yeni kişiselleştirme state'leri
  const [columnsPerRow, setColumnsPerRow] = useState(catalog?.columns_per_row || 3)
  const [backgroundColor, setBackgroundColor] = useState(catalog?.background_color || '#ffffff')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(catalog?.background_image || null)
  const [backgroundImageFit, setBackgroundImageFit] = useState<NonNullable<Catalog['background_image_fit']>>(catalog?.background_image_fit || 'cover')
  const [backgroundGradient, setBackgroundGradient] = useState<string | null>(catalog?.background_gradient || null)
  const [logoUrl, setLogoUrl] = useState<string | null>(catalog?.logo_url || user?.logo_url || null)
  const [logoPosition, setLogoPosition] = useState<Catalog['logo_position']>(catalog?.logo_position || 'header-left')
  const [logoSize, setLogoSize] = useState<Catalog['logo_size']>(catalog?.logo_size || 'medium')
  const [titlePosition, setTitlePosition] = useState<Catalog['title_position']>(catalog?.title_position || 'left')
  const [productImageFit, setProductImageFit] = useState<NonNullable<Catalog['product_image_fit']>>(catalog?.product_image_fit || 'cover')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [hasUnpushedChanges, setHasUnpushedChanges] = useState(false)


  // Kaydedilmemiş değişiklik takibi
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedState, setLastSavedState] = useState({
    name: catalog?.name || "",
    description: catalog?.description || "",
    productIds: catalog?.product_ids || [],
    layout: catalog?.layout || "grid",
    primaryColor: getInitialPrimaryColor(),
    showPrices: catalog?.show_prices ?? true,
    showDescriptions: catalog?.show_descriptions ?? true,
    showAttributes: catalog?.show_attributes ?? false,
    showSku: catalog?.show_sku ?? true,
    showUrls: catalog?.show_urls ?? false,
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
    showSku !== lastSavedState.showSku ||
    showUrls !== lastSavedState.showUrls ||
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
  }, [catalogName, catalogDescription, selectedProductIds, layout, primaryColor, showPrices, showDescriptions, showAttributes, showSku, showUrls, columnsPerRow, backgroundColor, catalog?.name, catalog?.description, catalog?.product_ids])

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
          show_attributes: showAttributes,
          show_sku: showSku,
          show_urls: showUrls,
          columns_per_row: columnsPerRow,
          background_color: backgroundColor,
          background_image: backgroundImage,
          background_image_fit: backgroundImageFit,
          background_gradient: backgroundGradient,
          logo_url: logoUrl,
          logo_position: logoPosition,
          logo_size: logoSize,
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
          showSku,
          showUrls,
          columnsPerRow,
          backgroundColor,
        })
        setIsDirty(false)
        if (isPublished) {
          setHasUnpushedChanges(true)
        }
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
  }, [currentCatalogId, isDirty, catalogName, catalogDescription, selectedProductIds, layout, primaryColor, showPrices, showDescriptions, showAttributes, showSku, showUrls, productImageFit, headerTextColor, columnsPerRow, backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient, logoUrl, logoPosition, logoSize, isPublished])

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
      } else if (!mobile && view === "editor") {
        setView("split")
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [view]) // Include view to handle view changes

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
            show_attributes: showAttributes,
            show_sku: showSku,
            show_urls: showUrls,
            columns_per_row: columnsPerRow,
            background_color: backgroundColor,
            background_image: backgroundImage,
            background_image_fit: backgroundImageFit,
            background_gradient: backgroundGradient,
            logo_url: logoUrl,
            logo_position: logoPosition,
            logo_size: logoSize,
            product_image_fit: productImageFit,
            header_text_color: headerTextColor,
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
            show_attributes: showAttributes,
            show_sku: showSku,
            show_urls: showUrls,
            columns_per_row: columnsPerRow,
            background_color: backgroundColor,
            background_image: backgroundImage,
            background_image_fit: backgroundImageFit,
            background_gradient: backgroundGradient,
            logo_url: logoUrl,
            logo_position: logoPosition,
            logo_size: logoSize,
            product_image_fit: productImageFit,
            header_text_color: headerTextColor,
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
          showSku,
          showUrls,
          columnsPerRow,
          backgroundColor,
        })
        setIsDirty(false)
        if (isPublished) {
          setHasUnpushedChanges(true)
        }
      } catch {
        toast.error(t('toasts.catalogSaveFailed'))
      }
    })
  }

  const handlePushUpdates = () => {
    if (!currentCatalogId) return

    startTransition(async () => {
      try {
        // 1. Önce kaydet
        await updateCatalog(currentCatalogId, {
          name: catalogName,
          description: catalogDescription,
          product_ids: selectedProductIds,
          layout,
          primary_color: primaryColor,
          show_prices: showPrices,
          show_descriptions: showDescriptions,
          show_attributes: showAttributes,
          show_sku: showSku,
          show_urls: showUrls,
          columns_per_row: columnsPerRow,
          background_color: backgroundColor,
          background_image: backgroundImage,
          background_image_fit: backgroundImageFit,
          background_gradient: backgroundGradient,
          logo_url: logoUrl,
          logo_position: logoPosition,
          logo_size: logoSize,
          product_image_fit: productImageFit,
          header_text_color: headerTextColor,
        })

        // 2. Cache temizle (Slug kullanarak)
        const shareSlug = catalog?.share_slug
        if (shareSlug) {
          const { revalidateCatalogPublic } = await import("@/lib/actions/catalogs")
          await revalidateCatalogPublic(shareSlug)
        }

        setHasUnpushedChanges(false)
        setIsDirty(false)
        toast.success("Yayındaki katalog güncellendi! 🚀")
      } catch {
        toast.error("Güncelleme sırasında bir hata oluştu.")
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
        // 1. Durumu kaydet ve slug oluştur (eğer yoksa)
        let shareSlug = catalog?.share_slug
        if (!shareSlug) {
          const companyPart = user?.company || user?.name || "user"
          const namePart = catalogName || "catalog"
          const idPart = currentCatalogId.slice(0, 4)
          shareSlug = `${slugify(companyPart)}-${slugify(namePart)}-${idPart}`
        }

        await updateCatalog(currentCatalogId, {
          name: catalogName,
          description: catalogDescription,
          product_ids: selectedProductIds,
          layout,
          primary_color: primaryColor,
          show_prices: showPrices,
          show_descriptions: showDescriptions,
          show_attributes: showAttributes,
          show_sku: showSku,
          show_urls: showUrls,
          columns_per_row: columnsPerRow,
          background_color: backgroundColor,
          background_image: backgroundImage,
          background_image_fit: backgroundImageFit,
          background_gradient: backgroundGradient,
          logo_url: logoUrl,
          logo_position: logoPosition,
          logo_size: logoSize,
          product_image_fit: productImageFit,
          header_text_color: headerTextColor,
          share_slug: shareSlug,
        })

        // 2. Şimdi yayın durumunu güncelle
        const newPublishState = !isPublished
        const { publishCatalog: publishCatalogAction, revalidateCatalogPublic } = await import("@/lib/actions/catalogs")
        await publishCatalogAction(currentCatalogId, newPublishState, shareSlug)

        if (newPublishState && shareSlug) {
          await revalidateCatalogPublic(shareSlug)
        }

        setIsPublished(newPublishState)
        setHasUnpushedChanges(false)
        setIsDirty(false)

        if (newPublishState) {
          const shareUrl = `${window.location.origin}/catalog/${shareSlug}`
          toast.success("Katalog başarıyla yayınlandı! 🎉", {
            description: "Artık herkes tarafından görüntülenebilir.",
            action: {
              label: "Linki Kopyala",
              onClick: () => {
                navigator.clipboard.writeText(shareUrl)
                toast.success(t('toasts.linkCopied'))
              }
            }
          })
        } else {
          toast.success("Katalog yayından kaldırıldı.", {
            description: "Mevcut link artık çalışmayacaktır."
          })
        }
      } catch (error) {
        console.error("Publish error:", error)
        toast.error("İşlem sırasında bir hata oluştu.")
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

            } catch {
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

    } catch (err) {
      console.error("PDF Fail:", err)
      const msg = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err))
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
      {view !== "preview" && (
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
          <div className="flex flex-col min-w-0">
            <Input
              value={catalogName}
              onChange={(e) => setCatalogName(e.target.value)}
              className="h-8 font-bold text-base min-w-[150px] sm:min-w-[200px] border-none bg-transparent hover:bg-muted/30 focus:bg-background transition-colors p-1 rounded-md focus:ring-1 focus:ring-primary/20"
              placeholder={t('builder.catalogNamePlaceholder')}
            />
          </div>
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

        {/* Center: Preview Toggle (Desktop only) */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView("split")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                view === "split"
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
              onClick={() => setView("preview")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                effectiveView === "preview"
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
              className={`w-9 h-8 flex items-center justify-center rounded-md transition-all ${effectiveView === "editor"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
                }`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("preview")}
              className={`w-9 h-8 flex items-center justify-center rounded-md transition-all ${effectiveView === "preview"
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
            variant={hasUnsavedChanges ? "default" : "outline"}
            className={`h-8 gap-1.5 px-3 ${hasUnsavedChanges ? "bg-primary hover:bg-primary/90" : "text-muted-foreground"}`}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">{isPending ? t('builder.saving') : t('builder.save')}</span>
          </Button>

          {isPublished && hasUnpushedChanges && (
            <Button
              size="sm"
              variant="default"
              onClick={handlePushUpdates}
              disabled={isPending}
              className="h-8 gap-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg animate-in fade-in zoom-in duration-300"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">{t('builder.publishUpdates') || "Güncellemeleri Yayınla"}</span>
            </Button>
          )}


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

          {/* View Catalog - Direct Access (Desktop) */}
          {isPublished && catalog?.share_slug && (
            <a href={`/catalog/${catalog.share_slug}`} target="_blank" rel="noreferrer">
              <Button variant="default" size="sm" className="h-8 gap-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Canlı Sitede Gör</span>
              </Button>
            </a>
          )}

          {/* Direct Actions (Desktop) */}
          <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 gap-1.5 px-3 hidden md:flex">
            <Share2 className="w-3.5 h-3.5" />
            <span className="text-xs">{t('builder.share')}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePublish}
            disabled={isPending || !currentCatalogId}
            className="h-8 gap-1.5 px-3 hidden md:flex"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="text-xs">{isPublished ? t('builder.unpublish') : t('builder.publish')}</span>
          </Button>
        </div>
      </div>
      )}


      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(effectiveView === "split" || effectiveView === "editor") && (
          <div className={`${effectiveView === "split" ? "w-1/2" : "w-full"} border-r overflow-auto`}>
            <CatalogEditor
              products={products}
              selectedProductIds={selectedProductIds}
              onSelectedProductIdsChange={setSelectedProductIds}
              description={catalogDescription}
              onDescriptionChange={setCatalogDescription}
              layout={layout}
              onLayoutChange={setLayout}
              primaryColor={primaryColor}
              onPrimaryColorChange={setPrimaryColor}
              headerTextColor={headerTextColor}
              onHeaderTextColorChange={setHeaderTextColor}
              showPrices={showPrices}
              onShowPricesChange={setShowPrices}
              showDescriptions={showDescriptions}
              onShowDescriptionsChange={setShowDescriptions}
              showAttributes={showAttributes}
              onShowAttributesChange={setShowAttributes}
              showSku={showSku}
              onShowSkuChange={setShowSku}
              showUrls={showUrls}
              onShowUrlsChange={setShowUrls}
              productImageFit={productImageFit}
              onProductImageFitChange={setProductImageFit}
              userPlan={user?.plan || "free"}
              onUpgrade={() => setShowUpgradeModal(true)}
              columnsPerRow={columnsPerRow}
              onColumnsPerRowChange={setColumnsPerRow}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={setBackgroundColor}
              backgroundImage={backgroundImage}
              onBackgroundImageChange={setBackgroundImage}
              backgroundImageFit={backgroundImageFit}
              onBackgroundImageFitChange={(v) => setBackgroundImageFit(v)}
              backgroundGradient={backgroundGradient}
              onBackgroundGradientChange={setBackgroundGradient}
              logoUrl={logoUrl}
              onLogoUrlChange={setLogoUrl}
              logoPosition={logoPosition}
              onLogoPositionChange={(v) => setLogoPosition(v)}
              logoSize={logoSize}
              onLogoSizeChange={(v) => setLogoSize(v)}
              titlePosition={titlePosition}
              onTitlePositionChange={(v) => setTitlePosition(v)}
            />
          </div>
        )}

        {/* Preview */}
        {(effectiveView === "split" || effectiveView === "preview") && (
          <div
            id="catalog-preview-container"
            className={`${effectiveView === "split" ? "w-1/2" : "w-full"} ${view === "preview" ? "bg-background" : "bg-muted/30"} overflow-auto`}
          >
            <CatalogPreview
              catalogName={catalogName}
              products={selectedProducts}
              layout={layout}
              primaryColor={primaryColor}
              headerTextColor={headerTextColor}
              showPrices={showPrices}
              showDescriptions={showDescriptions}
              showAttributes={showAttributes}
              showSku={showSku}
              showUrls={showUrls}
              productImageFit={productImageFit}
              columnsPerRow={columnsPerRow}
              backgroundColor={backgroundColor}
              backgroundImage={backgroundImage}
              backgroundImageFit={backgroundImageFit as 'cover' | 'contain' | 'fill' | undefined}
              backgroundGradient={backgroundGradient}
              logoUrl={logoUrl}
              logoPosition={logoPosition ?? undefined}
              logoSize={logoSize}
              titlePosition={titlePosition}
            />
          </div>
        )}
      </div>

      {/* Preview Exit Button */}
      {view === "preview" && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="secondary"
            className="h-9 px-4 gap-2 shadow-lg"
            onClick={() => setView("split")}
          >
            <EyeOff className="w-4 h-4" />
            Bu görünümden çık
          </Button>
        </div>
      )}

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
