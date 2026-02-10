"use client"

import { useState, useTransition, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { CatalogEditor } from "@/components/builder/catalog-editor"
import { CatalogPreview } from "@/components/builder/catalog-preview"
import { UpgradeModal } from "@/components/builder/upgrade-modal"
import { ShareModal } from "@/components/catalogs/share-modal"
import { useUser } from "@/lib/user-context"
import { type Catalog, createCatalog, updateCatalog } from "@/lib/actions/catalogs"
import { type Product } from "@/lib/actions/products"
import { useTranslation } from "@/lib/i18n-provider"
import { useLightbox, LightboxProvider, CatalogPreloader } from "@/lib/lightbox-context"
import { ImageLightbox } from "@/components/ui/image-lightbox"

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
  const { t: baseT } = useTranslation()
  const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
  const [isPending, startTransition] = useTransition()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [catalogName, setCatalogName] = useState(catalog?.name || "")
  const [catalogDescription, setCatalogDescription] = useState(catalog?.description || "")
  const { openLightbox } = useLightbox()
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(catalog?.product_ids || [])
  const [layout, setLayout] = useState(catalog?.layout || "grid")
  // Helper: Convert hex to rgba
  const hexToRgba = useCallback((hex: string, alpha: number = 1): string => {
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
  }, [])

  const getInitialPrimaryColor = useCallback(() => {
    if (!catalog?.primary_color) return "rgba(124, 58, 237, 1)"
    if (catalog.primary_color.startsWith('rgba')) return catalog.primary_color
    if (catalog.primary_color === 'transparent') return 'rgba(0, 0, 0, 0)'
    return hexToRgba(catalog.primary_color)
  }, [catalog?.primary_color, hexToRgba])

  const [primaryColor, setPrimaryColor] = useState(getInitialPrimaryColor())
  const [headerTextColor, setHeaderTextColor] = useState(catalog?.header_text_color || "#ffffff")
  const [showPrices, setShowPrices] = useState(catalog?.show_prices ?? true)
  const [showDescriptions, setShowDescriptions] = useState(catalog?.show_descriptions ?? true)
  const [showAttributes, setShowAttributes] = useState(catalog?.show_attributes ?? false)
  const [showSku, setShowSku] = useState(catalog?.show_sku ?? true)
  const [showUrls, setShowUrls] = useState(catalog?.show_urls ?? false)
  const [showInSearch, setShowInSearch] = useState(catalog?.show_in_search ?? true)
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
  // Storytelling Catalog States
  const [enableCoverPage, setEnableCoverPage] = useState(catalog?.enable_cover_page ?? false)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(catalog?.cover_image_url || null)
  const [coverDescription, setCoverDescription] = useState<string | null>(catalog?.cover_description || null)
  const [enableCategoryDividers, setEnableCategoryDividers] = useState(catalog?.enable_category_dividers ?? false)
  const [coverTheme, setCoverTheme] = useState(catalog?.cover_theme || "modern")


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
    backgroundImage: catalog?.background_image || null,
    logoUrl: catalog?.logo_url || null,
    enableCoverPage: catalog?.enable_cover_page ?? false,
    enableCategoryDividers: catalog?.enable_category_dividers ?? false,
    coverTheme: catalog?.cover_theme || "modern",
    showInSearch: catalog?.show_in_search ?? true,
    backgroundGradient: catalog?.background_gradient || null,
  })

  // Değişiklik var mı kontrol et - MEMOIZED & ROBUST
  const hasUnsavedChanges = useMemo(() => {
    return (
      catalogName !== lastSavedState.name ||
      catalogDescription !== lastSavedState.description ||
      JSON.stringify(selectedProductIds) !== JSON.stringify(lastSavedState.productIds) ||
      layout !== lastSavedState.layout ||
      coverTheme !== lastSavedState.coverTheme ||
      primaryColor !== lastSavedState.primaryColor ||
      showPrices !== lastSavedState.showPrices ||
      showDescriptions !== lastSavedState.showDescriptions ||
      showAttributes !== lastSavedState.showAttributes ||
      showSku !== lastSavedState.showSku ||
      showUrls !== lastSavedState.showUrls ||
      columnsPerRow !== lastSavedState.columnsPerRow ||
      backgroundColor !== lastSavedState.backgroundColor ||
      backgroundImage !== lastSavedState.backgroundImage ||
      logoUrl !== lastSavedState.logoUrl ||
      enableCoverPage !== lastSavedState.enableCoverPage ||
      enableCategoryDividers !== lastSavedState.enableCategoryDividers ||
      showInSearch !== lastSavedState.showInSearch ||
      backgroundGradient !== lastSavedState.backgroundGradient
    )
  }, [
    catalogName, catalogDescription, selectedProductIds, layout, coverTheme,
    primaryColor, showPrices, showDescriptions, showAttributes, showSku,
    showUrls, columnsPerRow, backgroundColor, backgroundImage, logoUrl,
    enableCoverPage, enableCategoryDividers, showInSearch, lastSavedState,
    backgroundGradient
  ])

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
  // CRITICAL: Sadece catalog.id değiştiğinde çalışmalı!
  // NOT: 'catalog' objesini dependency'e ekleme - her autosave sonrası revalidation
  // catalog objesini yeniden oluşturur ve bu useEffect'i tetikler, state'leri sıfırlar!
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
      setShowInSearch(catalog.show_in_search ?? true)
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
      // Storytelling Catalog States
      setEnableCoverPage(catalog.enable_cover_page ?? false)
      setCoverImageUrl(catalog.cover_image_url || null)
      setCoverDescription(catalog.cover_description || null)
      setEnableCategoryDividers(catalog.enable_category_dividers ?? false)

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
        backgroundImage: catalog.background_image || null,
        logoUrl: catalog.logo_url || null,
        enableCoverPage: catalog.enable_cover_page ?? false,
        enableCategoryDividers: catalog.enable_category_dividers ?? false,
        coverTheme: catalog.cover_theme || "modern",
        showInSearch: catalog.show_in_search ?? true,
        backgroundGradient: catalog.background_gradient || null,
      })
      setIsDirty(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog?.id]) // SADECE catalog.id değiştiğinde tetiklenir - diğer catalog prop'ları değişince DEĞİL!

  // backgroundGradient için lastSavedState'e ekleme yapalım (initial render'da)
  useEffect(() => {
    if (catalog) {
      setLastSavedState(prev => ({
        ...prev,
        backgroundGradient: catalog.background_gradient || null
      }))
    }
  }, [catalog?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave state
  const [, setIsAutoSaving] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Güncel değerleri ref'te tut - useEffect closure sorunlarını önler
  const catalogDataRef = useRef({
    catalogName, catalogDescription, selectedProductIds, layout, primaryColor,
    showPrices, showDescriptions, showAttributes, showSku, showUrls,
    columnsPerRow, backgroundColor, backgroundImage, backgroundImageFit,
    backgroundGradient, logoUrl, logoPosition, logoSize, titlePosition,
    productImageFit, headerTextColor, enableCoverPage, coverImageUrl,
    coverDescription, enableCategoryDividers, coverTheme, isPublished,
    showInSearch
  })

  // Ref'i her render'da güncelle (dependency olmadan)
  catalogDataRef.current = {
    catalogName, catalogDescription, selectedProductIds, layout, primaryColor,
    showPrices, showDescriptions, showAttributes, showSku, showUrls,
    columnsPerRow, backgroundColor, backgroundImage, backgroundImageFit,
    backgroundGradient, logoUrl, logoPosition, logoSize, titlePosition,
    productImageFit, headerTextColor, enableCoverPage, coverImageUrl,
    coverDescription, enableCategoryDividers, coverTheme, isPublished,
    showInSearch
  }

  // Debounced Autosave - 3 saniye bekle, sonra kaydet
  // OPTIMIZED: Sadece isDirty değiştiğinde effect yeniden oluşturulur
  useEffect(() => {
    // Sadece varolan kataloglar için autosave (yeni katalog = ilk manuel kayıt gerekli)
    if (!currentCatalogId || !hasUnsavedChanges) return

    // Önceki timeout'u temizle
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // 3 saniye sonra kaydet
    autoSaveTimeoutRef.current = setTimeout(async () => {
      const data = catalogDataRef.current
      setIsAutoSaving(true)
      try {
        await updateCatalog(currentCatalogId, {
          name: data.catalogName,
          description: data.catalogDescription,
          product_ids: data.selectedProductIds,
          layout: data.layout,
          primary_color: data.primaryColor,
          show_prices: data.showPrices,
          show_descriptions: data.showDescriptions,
          show_attributes: data.showAttributes,
          show_sku: data.showSku,
          show_urls: data.showUrls,
          columns_per_row: data.columnsPerRow,
          background_color: data.backgroundColor,
          background_image: data.backgroundImage,
          background_image_fit: data.backgroundImageFit,
          background_gradient: data.backgroundGradient,
          logo_url: data.logoUrl,
          logo_position: data.logoPosition,
          logo_size: data.logoSize,
          title_position: data.titlePosition,
          product_image_fit: data.productImageFit,
          header_text_color: data.headerTextColor,
          // Storytelling Catalog
          enable_cover_page: data.enableCoverPage,
          cover_image_url: data.coverImageUrl,
          cover_description: data.coverDescription,
          enable_category_dividers: data.enableCategoryDividers,
          show_in_search: data.showInSearch,
        })

        // Başarılı - state'leri güncelle
        setLastSavedState({
          name: data.catalogName,
          description: data.catalogDescription,
          productIds: data.selectedProductIds,
          layout: data.layout,
          primaryColor: data.primaryColor,
          showPrices: data.showPrices,
          showDescriptions: data.showDescriptions,
          showAttributes: data.showAttributes,
          showSku: data.showSku,
          showUrls: data.showUrls,
          columnsPerRow: data.columnsPerRow,
          backgroundColor: data.backgroundColor,
          backgroundImage: data.backgroundImage,
          logoUrl: data.logoUrl,
          enableCoverPage: data.enableCoverPage,
          enableCategoryDividers: data.enableCategoryDividers,
          coverTheme: data.coverTheme,
          showInSearch: data.showInSearch,
          backgroundGradient: data.backgroundGradient,
        })
        setIsDirty(false)
        if (data.isPublished) {
          setHasUnpushedChanges(true)
        }
        router.refresh() // Prop'ları güncelle (eventually)
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
  }, [currentCatalogId, isDirty]) // OPTIMIZED: Sadece 2 dependency!

  // Ürünleri selectedProductIds sırasına göre sırala (kullanıcının belirlediği sıra) - MEMOIZED
  const selectedProducts = useMemo(() =>
    selectedProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined),
    [selectedProductIds, products]
  )

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
    // Otomatik isim kontrolü
    let finalName = catalogName?.trim()
    if (!finalName) {
      const currentDate = new Date().toLocaleDateString('tr-TR')
      finalName = `${t("catalogs.newCatalog") || "Yeni Katalog"} - ${currentDate}`
      setCatalogName(finalName) // Arayüzde de güncelle
    }

    startTransition(async () => {
      try {
        if (currentCatalogId) {
          // 1. Mevcut katalogu tek seferde güncelle - Hızlı geri bildirim
          const updatePromise = updateCatalog(currentCatalogId, {
            name: finalName,
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
            // Storytelling Catalog
            enable_cover_page: enableCoverPage,
            cover_image_url: coverImageUrl,
            cover_description: coverDescription,
            enable_category_dividers: enableCategoryDividers,
            cover_theme: coverTheme,
            show_in_search: showInSearch,
          })

          // Beklemeden başarılı mesajı ver (Optimistic)
          toast.success(t('toasts.catalogSaved') as string)
          await updatePromise
        } else {
          // 2. Yeni katalog oluştururken TÜM verileri tek seferde gönder
          const newCatalog = await createCatalog({
            name: finalName,
            description: catalogDescription,
            layout,
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
            // Storytelling
            enable_cover_page: enableCoverPage,
            cover_image_url: coverImageUrl,
            cover_description: coverDescription,
            enable_category_dividers: enableCategoryDividers,
            cover_theme: coverTheme,
            show_in_search: showInSearch,
          })

          setCurrentCatalogId(newCatalog.id)
          toast.success(t('toasts.catalogCreated') as string)

          // refreshUser'ı arka planda yap, kullanıcıyı bekletme
          refreshUser()
          router.replace(`/dashboard/builder?id=${newCatalog.id}`)
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
          backgroundImage,
          logoUrl,
          enableCoverPage,
          enableCategoryDividers,
          coverTheme,
          showInSearch,
          backgroundGradient,
        })
        setIsDirty(false)
        if (isPublished) {
          setHasUnpushedChanges(true)
        }
        router.refresh()
      } catch (error) {
        console.error('Catalog save error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
        toast.error(`${t('toasts.catalogSaveFailed') as string}: ${errorMessage}`)
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
          // Storytelling Catalog
          enable_cover_page: enableCoverPage,
          cover_image_url: coverImageUrl,
          cover_description: coverDescription,
          enable_category_dividers: enableCategoryDividers,
          cover_theme: coverTheme,
          show_in_search: showInSearch,
        })

        // 2. Cache temizle (Slug kullanarak)
        const shareSlug = catalog?.share_slug
        if (shareSlug) {
          const { revalidateCatalogPublic } = await import("@/lib/actions/catalogs")
          await revalidateCatalogPublic(shareSlug)
        }

        setHasUnpushedChanges(false)
        setIsDirty(false)
        // lastSavedState'i güncelle ki hasUnsavedChanges false olsun
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
          backgroundImage,
          logoUrl,
          enableCoverPage,
          enableCategoryDividers,
          coverTheme,
          showInSearch,
          backgroundGradient,
        })
        toast.success("Yayındaki katalog güncellendi! 🚀")
        router.refresh()
      } catch (error) {
        console.error('Catalog publish/push error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
        toast.error(`Güncelleme sırasında bir hata oluştu: ${errorMessage}`)
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
      } catch {
        toast.error("Link güncellenirken hata oluştu.")
      }
    })
  }

  const handlePublish = () => {
    if (!currentCatalogId) {
      toast.error(t('toasts.saveCatalogFirst') as string)
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
          // Storytelling Catalog
          enable_cover_page: enableCoverPage,
          cover_image_url: coverImageUrl,
          cover_description: coverDescription,
          enable_category_dividers: enableCategoryDividers,
          cover_theme: coverTheme,
          show_in_search: showInSearch,
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
                toast.success(t('toasts.linkCopied') as string)
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
      toast.info(t('builder.downloadStarting') as string, { id: "pdf-process" })

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
            quality: 0.85, // Optimized quality (significant size reduction, minimal visual loss)
            pixelRatio: 2, // 2x HD resolution (perfect for print and screen, much faster than 4x)
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
      toast.success((t('builder.pdfDownloaded') as string) + resolutionText, { id: "pdf-process" })

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
      toast.error((t('builder.pdfFailed') as string) + ": " + msg, { id: "pdf-process" })
    }
  }

  const handleShare = () => {
    if (!currentCatalogId || !catalog?.share_slug) {
      toast.error(t('toasts.saveCatalogFirst') as string)
      return
    }
    setShowShareModal(true)
  }


  // Görünüm modunu mobil için kontrol et
  const effectiveView = isMobile ? (view === "split" ? "editor" : view) : view

  return (
    <LightboxProvider>
      <CatalogPreloader products={products} />
      <ImageLightbox />
      <div className="builder-page h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] flex flex-col -m-3 sm:-m-4 md:-m-6 overflow-hidden">
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
                // Storytelling Catalog Props
                enableCoverPage={enableCoverPage}
                onEnableCoverPageChange={setEnableCoverPage}
                coverImageUrl={coverImageUrl}
                onCoverImageUrlChange={setCoverImageUrl}
                coverDescription={coverDescription}
                onCoverDescriptionChange={setCoverDescription}
                enableCategoryDividers={enableCategoryDividers}
                onEnableCategoryDividersChange={setEnableCategoryDividers}
                coverTheme={coverTheme}
                onCoverThemeChange={setCoverTheme}
                showInSearch={showInSearch}
                onShowInSearchChange={setShowInSearch}
                catalogName={catalogName}
              />
            </div>
          )}

          {/* Preview */}
          {(effectiveView === "split" || effectiveView === "preview") && (
            <div
              id="catalog-preview-container"
              className={`${effectiveView === "split" ? "w-1/2" : "w-full"} bg-slate-100 dark:bg-[#03040a] overflow-auto`}
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
                logoUrl={logoUrl ?? undefined}
                logoPosition={logoPosition ?? undefined}
                logoSize={logoSize}
                titlePosition={titlePosition}
                enableCoverPage={enableCoverPage}
                coverImageUrl={coverImageUrl ?? undefined}
                coverDescription={coverDescription ?? undefined}
                enableCategoryDividers={enableCategoryDividers}
                theme={coverTheme}
              />
            </div>
          )}
        </div>

        {/* Preview Mode Floating Header (Switch Back) */}
        <PreviewFloatingHeader
          view={view}
          onViewChange={setView}
          catalogName={catalogName}
          onPublish={handlePublish}
          onDownloadPDF={handleDownloadPDF}
        />

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          plan={user?.plan || "free"}
        />

        {/* Share Modal */}
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          catalog={catalog}
          isPublished={isPublished}
          shareUrl={catalog?.share_slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/catalog/${catalog.share_slug}` : ""}
          onDownloadPdf={handleDownloadPDF}
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
            // Kayıt işlemi için yeterli süre bekle
            setTimeout(() => router.push('/dashboard'), 1500)
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
              logoUrl={logoUrl ?? undefined}
              logoPosition={logoPosition ?? undefined}
              logoSize={logoSize}
              titlePosition={titlePosition}
              isExporting={true} // Her zaman tüm sayfalar
              enableCoverPage={enableCoverPage}
              coverImageUrl={coverImageUrl ?? undefined}
              coverDescription={coverDescription ?? undefined}
              enableCategoryDividers={enableCategoryDividers}
              theme={coverTheme}
            />
          </div>
        )}
      </div>
    </LightboxProvider>
  )
}
