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

// Atomic Components
import { BuilderToolbar } from "./builder-toolbar"
import { ExitDialog } from "./exit-dialog"
import { PreviewFloatingHeader } from "./preview-floating-header"

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
          // Katalog oluşturulduğu anda kullanıcı bilgilerini güncelle
          await refreshUser()
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
    const companyPart = (user?.company || user?.name || "user")
    // Eğer şirket ismi "FogCatalog" ise URL'de tekrar etmemesi için slug'a ekleme
    const cleanCompany = companyPart.toLowerCase().replace(/[^a-z0-9]/g, "") === "fogcatalog" ? "" : companyPart
    const namePart = catalogName && catalogName.trim().length > 0 ? catalogName : "katalog"
    const idPart = currentCatalogId.slice(0, 4)

    const parts = [slugify(cleanCompany), slugify(namePart), idPart]
    return parts.filter(p => p && p.length > 0).join('-')
  }, [user, catalogName, currentCatalogId])

  // URL güncelleme butonu sadece katalog şu anda yayınlanmışsa ve slug değişmişse gösterilmeli
  // Hiç yayınlanmamış katalog için yeni slug otomatik oluşturulur, "Link Yenile" göstermeye gerek yok
  const isUrlOutdated = !!(isPublished && catalog?.share_slug && catalog.share_slug !== expectedSlug)

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
        <BuilderToolbar
          catalog={catalog}
          catalogName={catalogName}
          onCatalogNameChange={setCatalogName}
          isMobile={isMobile}
          isPublished={isPublished}
          hasUnsavedChanges={hasUnsavedChanges}
          hasUnpushedChanges={hasUnpushedChanges}
          isUrlOutdated={isUrlOutdated}
          isPending={isPending}
          view={view}
          onViewChange={setView}
          onSave={handleSave}
          onPublish={handlePublish}
          onPushUpdates={handlePushUpdates}
          onUpdateSlug={handleUpdateSlug}
          onShare={handleShare}
          onDownloadPDF={handleDownloadPDF}
          onExit={() => {
            if (hasUnsavedChanges) {
              setShowExitDialog(true)
            } else {
              router.push('/dashboard')
            }
          }}
        />
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
      <PreviewFloatingHeader view={view} onViewChange={setView} />

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
      <ExitDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onExitWithoutSaving={() => {
          setShowExitDialog(false)
          router.push('/dashboard')
        }}
        onSaveAndExit={() => {
          handleSave()
          setShowExitDialog(false)
          // Kayıt tamamlandıktan sonra yönlendir
          setTimeout(() => router.push('/dashboard'), 500)
        }}
      />

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
