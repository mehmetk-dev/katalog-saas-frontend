"use client"

import { useState, useTransition, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Download, Share2, Save, ArrowLeft, Eye, EyeOff, Pencil, Globe, MoreVertical, ExternalLink, Copy, Check, RefreshCw, AlertTriangle } from "lucide-react"
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
import { cn } from "@/lib/utils"
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

function slugify(text: string) {
  const trMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o'
  }

  // Pre-process inputs
  const safeText = text ? String(text) : ""

  return safeText
    .split('')
    .map(c => trMap[c] || c) // Replace Turkish chars
    .join('')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Space to dash
    .replace(/[^\w-]+/g, '')  // Remove non-word (except dash)
    .replace(/-+/g, '-')      // Multiple dashes to single
    .replace(/^-+|-+$/g, '')  // Trim dashes from start/end
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

  // Sync state when catalog prop changes (prevents state leaking between catalogs)
  useEffect(() => {
    if (catalog) {
      setCatalogName(catalog.name || "")
      setCatalogDescription(catalog.description || "")
      setSelectedProductIds(catalog.product_ids || [])
      setLayout(catalog.layout || "grid")
      setPrimaryColor(getInitialPrimaryColor())
      setHeaderTextColor(catalog.header_text_color || "#ffffff")
      setShowPrices(catalog.show_prices ?? true)
      setShowDescriptions(catalog.show_descriptions ?? true)
      setShowAttributes(catalog.show_attributes ?? false)
      setShowSku(catalog.show_sku ?? true)
      setShowUrls(catalog.show_urls ?? false)
      setColumnsPerRow(catalog.columns_per_row || 3)
      setBackgroundColor(catalog.background_color || '#ffffff')
      setBackgroundImage(catalog.background_image || null)
      setBackgroundImageFit(catalog.background_image_fit || 'cover')
      setBackgroundGradient(catalog.background_gradient || null)
      setLogoUrl(catalog.logo_url || user?.logo_url || null)
      setLogoPosition(catalog.logo_position || 'header-left')
      setLogoSize(catalog.logo_size || 'medium')
      setTitlePosition(catalog.title_position || 'left')
      setProductImageFit(catalog.product_image_fit || 'cover')
      setIsPublished(catalog.is_published || false)
      setCurrentCatalogId(catalog.id || null)

      setLastSavedState({
        name: catalog.name || "",
        description: catalog.description || "",
        productIds: catalog.product_ids || [],
        layout: catalog.layout || "grid",
        primaryColor: getInitialPrimaryColor(),
        showPrices: catalog.show_prices ?? true,
        showDescriptions: catalog.show_descriptions ?? true,
        showAttributes: catalog.show_attributes ?? false,
        showSku: catalog.show_sku ?? true,
        showUrls: catalog.show_urls ?? false,
        columnsPerRow: catalog.columns_per_row || 3,
        backgroundColor: catalog.background_color || '#ffffff',
      })
      setIsDirty(false)
    }
  }, [catalog?.id]) // catalog.id değiştiğinde tetiklenir

  // Herhangi bir değişiklikte isDirty'i true yap
  useEffect(() => {
    // İlk render'da değil, sonraki değişikliklerde dirty yap
    const isInitialRender =
      catalogName === (catalog?.name || "") &&
      catalogDescription === (catalog?.description || "") &&
      JSON.stringify(selectedProductIds) === JSON.stringify(catalog?.product_ids || []) &&
      backgroundGradient === (catalog?.background_gradient || null)

    if (!isInitialRender) {
      setIsDirty(true)
    }
  }, [catalogName, catalogDescription, selectedProductIds, layout, primaryColor, showPrices, showDescriptions, showAttributes, showSku, showUrls, columnsPerRow, backgroundColor, backgroundGradient])

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
          title_position: titlePosition,
          product_image_fit: productImageFit,
          header_text_color: headerTextColor,
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
  }, [
    currentCatalogId,
    isDirty,
    catalogName,
    catalogDescription,
    selectedProductIds,
    layout,
    primaryColor,
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
    showUrls,
    productImageFit,
    headerTextColor,
    columnsPerRow,
    backgroundColor,
    backgroundImage,
    backgroundImageFit,
    backgroundGradient,
    logoUrl,
    logoPosition,
    logoSize,
    titlePosition,
    isPublished
  ])

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
            title_position: titlePosition,
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
            title_position: titlePosition,
            product_image_fit: productImageFit,
            header_text_color: headerTextColor,
          })
          router.replace(`/dashboard/builder?id=${newCatalog.id}`)
          toast.success(t('toasts.catalogCreated'))
          refreshUser()
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
          title_position: titlePosition,
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

  // Slug hesaplama (Sürekli güncel olması gereken slug)
  const expectedSlug = useMemo(() => {
    if (!currentCatalogId) return ""
    const companyPart = user?.company || user?.name || "user"
    const namePart = catalogName && catalogName.trim().length > 0 ? catalogName : "katalog"
    const idPart = currentCatalogId.slice(0, 4)

    const parts = [slugify(companyPart), slugify(namePart), idPart]
    return parts.filter(p => p && p.length > 0).join('-')
  }, [user, catalogName, currentCatalogId])

  // URL güncelleme butonu sadece katalog şu anda yayınlanmışsa ve slug değişmişse gösterilmeli
  // Hiç yayınlanmamış katalog için yeni slug otomatik oluşturulur, "Link Yenile" göstermeye gerek yok
  const isUrlOutdated = isPublished && catalog?.share_slug && catalog.share_slug !== expectedSlug

  const handleUpdateSlug = () => {
    if (!currentCatalogId) return

    startTransition(async () => {
      try {
        // Sadece slug'ı güncelle
        await updateCatalog(currentCatalogId, {
          share_slug: expectedSlug
        })

        // Cache temizle
        const { revalidateCatalogPublic } = await import("@/lib/actions/catalogs")
        if (catalog?.share_slug) {
          await revalidateCatalogPublic(catalog.share_slug) // Eskisi
        }
        await revalidateCatalogPublic(expectedSlug) // Yenisi

        toast.success("Katalog linki güncellendi!", {
          description: "Yeni link oluşturuldu."
        })
      } catch (error) {
        toast.error("Link güncellenirken hata oluştu.")
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
        // 1. Slug belirle
        // Eğer katalog hiç yayınlanmamışsa (isPublished === false), her zaman yeni slug oluştur
        // Eğer daha önce yayınlanmışsa, mevcut slug'ı koru (kullanıcı manuel güncellemek isterse handleUpdateSlug kullanır)
        let shareSlug = catalog?.share_slug

        // Hiç yayınlanmamışsa, yeni slug oluştur (kullanıcı isim değiştirdiyse yeni slug ile yayınlanmalı)
        if (!isPublished) {
          shareSlug = expectedSlug
        } else if (!shareSlug) {
          // Yayınlanmış ama slug yoksa (edge case), yeni slug oluştur
          shareSlug = expectedSlug
        }
        // Eğer yayınlanmışsa ve slug varsa, mevcut slug'ı koru

        // updateCatalog çağrısında slug'ı değiştirmeden (veya ilk kez ekleyerek) gönder
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
          title_position: titlePosition,
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


  // Export State
  const [isExporting, setIsExporting] = useState(false)

  const handleDownloadPDF = async () => {
    try {
      toast.info(t('builder.downloadStarting'), { id: "pdf-process" })

      if (!canExport()) {
        toast.dismiss("pdf-process")
        setShowUpgradeModal(true)
        return
      }

      // 1. Export Modunu Aktif Et (Hayalet konteynırı render eder)
      setIsExporting(true)

      // Bekle ki React hayalet konteynırı tüm sayfalarla birlikte render etsin
      await new Promise(resolve => setTimeout(resolve, 1500))

      const isPro = user?.plan === "pro"
      const resolutionText = isPro ? " (Yüksek Çözünürlük)" : ""
      toast.loading(`Görseller işleniyor ve PDF hazırlanıyor${resolutionText}...`, { id: "pdf-process" })

      const { toJpeg } = await import("html-to-image")
      const { jsPDF } = await import("jspdf")

      // HAYALET KONTEYNIRI HEDEFLE
      const container = document.getElementById('catalog-export-container')

      if (!container) {
        setIsExporting(false)
        throw new Error("Export hazırlığı tamamlanamadı. Lütfen tekrar deneyin.")
      }

      // Sayfaları Bul (Hayalet konteynır içindeki tüm .catalog-page-wrapper'lar)
      const pages = container.querySelectorAll('.catalog-page-wrapper')

      if (pages.length === 0) {
        setIsExporting(false)
        throw new Error("Sayfa yapısı oluşturulamadı. Lütfen tekrar deneyin.")
      }

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Process Each Page
      const pageElements = Array.from(pages)

      for (let i = 0; i < pageElements.length; i++) {
        const wrapper = pageElements[i] as HTMLElement
        // Wrapper'ın kendisi mi yoksa içindeki mi page?
        const page = wrapper.classList.contains('catalog-page') ? wrapper : wrapper.querySelector('.catalog-page') as HTMLElement

        if (!page) continue

        toast.loading(`Sayfa ${i + 1} / ${pageElements.length} hazırlanıyor${resolutionText}...`, { id: "pdf-process" })

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

          const { toJpeg } = await import("html-to-image")
          const imgData = await toJpeg(clone, {
            quality: 1.0, // %100 Kalite (Maksimum)
            pixelRatio: 4, // 4x Ultra HD Çözünürlük (Herkes için)
            backgroundColor: '#ffffff',
            cacheBust: true,
          })

          if (i > 0) pdf.addPage()
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)

        } finally {
          if (document.body.contains(clone)) {
            document.body.removeChild(clone)
          }
        }
      }

      // İndirme işlemini başlat
      pdf.save(`${slugify(catalogName || "katalog")}.pdf`)

      // UI'ı hemen güncelle (Hayaleti kapat ve başarı mesajı ver)
      setIsExporting(false)
      toast.success(t('builder.pdfDownloaded') + resolutionText, { id: "pdf-process" })

      // Arka planda kota/limit işlemlerini yap (Kullanıcıyı bekletme)
      import("@/lib/actions/user").then(async ({ incrementUserExports }) => {
        const result = await incrementUserExports(catalogName)
        if (!result.error) {
          refreshUser()
        }
      }).catch(err => console.error("Export limit update failed:", err))

    } catch (err) {
      console.error("PDF Fail:", err)
      setIsExporting(false)
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
        <div className="h-16 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-3 sm:px-6 shrink-0 gap-4">

          {/* Left: Back + Name + Live Bar */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
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
                className="h-9 font-bold text-lg min-w-[120px] w-[200px] sm:w-[240px] border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-input transition-all px-2 rounded-md"
                placeholder={t('builder.catalogNamePlaceholder')}
              />


            </div>

            {!isMobile && (
              <>
                <div className="h-6 w-px bg-border/60" />

                {/* Status & Live Bar */}
                <div className="flex items-center gap-4">



                  {isPublished && catalog?.share_slug ? (
                    <>
                      <div className="flex items-center gap-1 pl-1 pr-1.5 py-1 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-full transition-all hover:border-emerald-200 dark:hover:border-emerald-800">
                        <div className="flex items-center gap-1.5 px-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Yayında</span>
                        </div>

                        <div className="h-4 w-px bg-emerald-200/50 dark:bg-emerald-800/50 mx-1" />

                        <div className="flex items-center gap-1 group">




                          {/* URL Güncelleme Uyarısı (Buton Şeklinde) */}
                          {/* Sadece katalog gerçekten yayınlanmışsa (catalog.is_published === true) ve slug değişmişse göster */}
                          {/* Hiç yayınlanmamış katalog için bu buton gösterilmez - yayınlarken otomatik yeni slug oluşturulur */}
                          {isUrlOutdated && catalog?.is_published === true && (
                            <div className="flex items-center animate-in fade-in zoom-in duration-300 mr-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleUpdateSlug}
                                className="h-6 px-2 text-[10px] font-medium gap-1.5 rounded-full bg-amber-100/80 hover:bg-amber-200 text-amber-700 border border-amber-200/50 shadow-sm"
                                title="URL güncel bilgilerinizle eşleşmiyor."
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Link Yenile
                              </Button>
                            </div>
                          )}

                          {/* Aksiyonlar: Kopyala & Görüntüle */}
                          <div className="flex items-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600"
                              onClick={() => {
                                const url = `${window.location.origin}/catalog/${catalog?.share_slug}`
                                navigator.clipboard.writeText(url)
                                toast.success("Link kopyalandı!")
                              }}
                              title="Linki Kopyala"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <a
                              href={`/catalog/${catalog.share_slug}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600"
                                title="Kataloğu Görüntüle"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Yayını Güncelle Butonu (Amber - Sarı) */}
                      {isPublished && hasUnpushedChanges && (
                        <div className="ml-2 animate-in fade-in zoom-in slide-in-from-left-2 duration-300 flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handlePushUpdates}
                            disabled={isPending}
                            className="h-8 px-4 text-xs font-bold gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 border border-amber-600/20 hover:scale-105 transition-all"
                            title="Yaptığınız değişiklikler sadece taslak olarak kaydedildi. Kullanıcıların görmesi için tıklayın."
                          >
                            <RefreshCw className={cn("w-3.5 h-3.5", isPending && "animate-spin")} />
                            YAYINI GÜNCELLE
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                      {/* Status: Yayında Değil */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/80 rounded-full border border-slate-200/60">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span className="text-xs text-slate-500 font-medium">Yayında Değil</span>
                      </div>

                      {/* Yayınla Butonu */}
                      <Button
                        size="sm"
                        onClick={handlePublish}
                        disabled={isPending}
                        className="h-7 px-3 text-xs font-bold gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all"
                      >
                        <Globe className="w-3 h-3" />
                        Yayınla
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Center: Switch (Desktop) */}
          {!isMobile && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-full border shadow-sm">
                <Label
                  htmlFor="view-mode"
                  className="text-xs font-medium px-2 cursor-pointer transition-colors text-foreground"
                  onClick={() => setView('split')}
                >
                  Editör
                </Label>
                <Switch
                  id="view-mode"
                  checked={false}
                  onCheckedChange={(checked) => {
                    if (checked) setView('preview')
                  }}
                  className="data-[state=checked]:bg-primary"
                />
                <Label
                  htmlFor="view-mode"
                  className="text-xs font-medium px-2 cursor-pointer transition-colors text-muted-foreground"
                  onClick={() => setView('preview')}
                >
                  Önizleme
                </Label>
              </div>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile View Toggle */}
            {isMobile && (
              <div className="flex bg-muted rounded-md p-0.5 mr-2">
                <Button
                  variant={(view as string) !== "preview" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setView("editor")}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={(view as string) === "preview" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setView("preview")}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {/* Unsaved Changes Indicator (Next to Save Button) */}
            {hasUnsavedChanges && !isPending && (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Kaydedilmemiş değişiklikler
              </span>
            )}

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              variant="ghost"
              className={`h-9 gap-2 px-4 transition-all ${hasUnsavedChanges
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              <Save className={`w-4 h-4 ${hasUnsavedChanges ? "text-amber-600" : ""}`} />
              <span className="hidden sm:inline text-sm font-medium">
                {isPending ? "Kaydediliyor..." : (hasUnsavedChanges ? "Kaydet" : "Kaydedildi")}
              </span>
            </Button>



            <Button
              variant="default" // Primary
              size="sm"
              onClick={handleShare}
              className="h-9 gap-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Paylaş</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" title="Daha fazla seçenek">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePublish}>
                  <Globe className="w-4 h-4 mr-2" />
                  {isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF İndir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

      {/* Preview Mode Floating Header (Switch Back) */}
      {view === "preview" && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md p-1.5 rounded-full border shadow-lg ring-1 ring-black/5">
            <Label
              htmlFor="preview-mode-switch"
              className="text-xs font-medium px-3 cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
              onClick={() => setView('split')}
            >
              Editör
            </Label>
            <Switch
              id="preview-mode-switch"
              checked={true}
              onCheckedChange={(checked) => !checked && setView('split')}
              className="data-[state=checked]:bg-primary"
            />
            <Label
              className="text-xs font-medium px-3 text-foreground cursor-default"
            >
              Önizleme
            </Label>
          </div>
        </div>
      )}

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />

      {/* Share Modal */}
      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        catalog={catalog}
        isPublished={isPublished}
        shareUrl={catalog?.share_slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/catalog/${catalog.share_slug}` : ""}
        onDownloadPdf={handleDownloadPDF}
      />

      {/* Share Modal */}
      {/* Share Modal */}
      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        catalog={catalog}
        isPublished={isPublished}
        shareUrl={catalog?.share_slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/catalog/${catalog.share_slug}` : ""}
        onDownloadPdf={handleDownloadPDF}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        plan={user?.plan || "free"}
      />

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

      {/* GHOST CONTAINER (PDF Export için Gizli Alan) */}
      {isExporting && (
        <div
          id="catalog-export-container"
          style={{
            position: 'fixed',
            top: 0,
            left: '-9999px',
            width: '1000px', // Yeterince geniş
            zIndex: -100,
            opacity: 0, // Görünmez ama render olur
            pointerEvents: 'none',
            overflow: 'visible' // Taşmaları engelleme
          }}
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
            isExporting={true} // Her zaman tüm sayfalar
          />
        </div>
      )}
    </div>
  )
}
