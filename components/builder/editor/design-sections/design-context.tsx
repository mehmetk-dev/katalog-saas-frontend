"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"

import { type CatalogDraft, type DraftSetters, getAvailableColumns, parseColor, rgbToHex } from "@/components/builder/builder-utils"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import { useDebouncedCallback } from "@/lib/hooks/use-debounce"
import { useEditorUpload } from "@/lib/hooks/use-editor-upload"
import { useTranslation } from "@/lib/contexts/i18n-provider"

/*
 * Tasarım sekmesinin bölümleri (şablon, görünüm, marka, arka plan, kapak) değerlerini ve
 * değiştiricilerini bir "kaynaktan" okur. Builder kaynağı builder state'idir (otomatik kayıt,
 * geri al); demo kaynağı sayfadaki yerel taslaktır. Böylece builder ve /create-demo aynı
 * bölümleri kullanır.
 *
 * Önceden CatalogEditor ~70 değeri ve setter'ı tek tek EditorDesignTab'a, o da her bölüme
 * aynı adlarla yeniden aktarıyordu; demo ise ayarları ayrıca kopyalıyordu.
 */

export interface DesignSource {
    draft: CatalogDraft
    setters: DraftSetters
    /** Birden çok alanı tek adımda değiştirir (builder'da tek geri alma adımı) */
    edit: (patch: Partial<CatalogDraft>) => void
    /** Kapak sayfası önizlemesi ve kategori sırası için yüklü ürünler */
    products: Product[]
    userPlan: string
    onUpgrade: () => void
}

type UploadType = "logo" | "bg" | "cover"

interface DesignTools {
    source: DesignSource
    openSections: Record<string, boolean>
    toggleSection: (key: string) => void
    handleUploadClick: () => void
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: UploadType) => void
    logoInputRef: RefObject<HTMLInputElement | null>
    bgInputRef: RefObject<HTMLInputElement | null>
    coverInputRef: RefObject<HTMLInputElement | null>
    debouncedPrimaryColorChange: (color: string) => void
    debouncedHeaderTextColorChange: (color: string) => void
    debouncedBackgroundColorChange: (color: string) => void
}

const DesignToolsContext = createContext<DesignTools | null>(null)

interface DesignToolsProviderProps {
    source: DesignSource
    /**
     * cloud: görseller Cloudinary'ye yüklenir (builder).
     * local: yalnızca tarayıcıda gösterilir, sunucuya gitmez (giriş yapmamış demo ziyaretçisi).
     */
    uploadMode?: "cloud" | "local"
    initialOpenSections?: Record<string, boolean>
    children: ReactNode
}

export function DesignToolsProvider({ source, uploadMode = "cloud", initialOpenSections, children }: DesignToolsProviderProps) {
    const { setPrimaryColor, setHeaderTextColor, setBackgroundColor, setCoverImageUrl, setBackgroundImage } = source.setters
    const { edit } = source
    const logoPosition = source.draft.logoPosition

    // Logo yüklenince konum "gösterme"deyse logo hiçbir yerde görünmüyordu; sol üste alınır
    const setLogoUrl = useCallback((url: string | null) => {
        const hidden = !logoPosition || logoPosition === "none"
        edit(url && hidden ? { logoUrl: url, logoPosition: "header-left" } : { logoUrl: url })
    }, [edit, logoPosition])
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

    const [openSections, setOpenSections] = useState<Record<string, boolean>>(
        initialOpenSections ?? { template: true, appearance: true, branding: true },
    )
    const toggleSection = useCallback((key: string) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
    }, [])

    // Renk seçici sürüklenirken her piksel bir geçmiş adımı/otomatik kayıt tetiklemesin
    const debouncedPrimaryColorChange = useDebouncedCallback((color: string) => setPrimaryColor(color), 50)
    const debouncedHeaderTextColorChange = useDebouncedCallback((color: string) => setHeaderTextColor(color), 50)
    const debouncedBackgroundColorChange = useDebouncedCallback((color: string) => setBackgroundColor(color), 50)

    const cloudUpload = useEditorUpload({
        onLogoUrlChange: setLogoUrl,
        onCoverImageUrlChange: setCoverImageUrl,
        onBackgroundImageChange: setBackgroundImage,
        backgroundImage: source.draft.backgroundImage,
        t,
    })

    // Yerel mod: dosya seçilince blob: adresi oluşturulur, sayfa kapanınca bırakılır
    const localUrlsRef = useRef<string[]>([])
    useEffect(() => () => localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), [])
    const handleLocalFile = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: UploadType) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file || !file.type.startsWith("image/")) return
        const url = URL.createObjectURL(file)
        localUrlsRef.current.push(url)
        if (type === "logo") setLogoUrl(url)
        else if (type === "bg") setBackgroundImage(url)
        else setCoverImageUrl(url)
    }, [setLogoUrl, setBackgroundImage, setCoverImageUrl])

    const value = useMemo<DesignTools>(() => ({
        source,
        openSections,
        toggleSection,
        handleUploadClick: uploadMode === "local" ? () => undefined : cloudUpload.handleUploadClick,
        handleFileUpload: uploadMode === "local" ? handleLocalFile : cloudUpload.handleFileUpload,
        logoInputRef: cloudUpload.logoInputRef,
        bgInputRef: cloudUpload.bgInputRef,
        coverInputRef: cloudUpload.coverInputRef,
        debouncedPrimaryColorChange,
        debouncedHeaderTextColorChange,
        debouncedBackgroundColorChange,
    }), [source, openSections, toggleSection, uploadMode, cloudUpload.handleUploadClick, cloudUpload.handleFileUpload, handleLocalFile, cloudUpload.logoInputRef, cloudUpload.bgInputRef, cloudUpload.coverInputRef, debouncedPrimaryColorChange, debouncedHeaderTextColorChange, debouncedBackgroundColorChange])

    return <DesignToolsContext.Provider value={value}>{children}</DesignToolsContext.Provider>
}

/**
 * Bölümlerin kullandığı değerler ve değiştiriciler — eski prop adlarıyla aynı, böylece bölüm
 * gövdeleri değişmeden kaynaktan beslenir.
 */
export function useDesignProps() {
    const tools = useContext(DesignToolsContext)
    if (!tools) throw new Error("useDesignProps must be used within DesignToolsProvider")
    const { source, ...rest } = tools
    const { draft, setters } = source
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

    const primaryColorParsed = useMemo(() => {
        const rgb = parseColor(draft.primaryColor)
        return { rgb, hexColor: rgbToHex(rgb.r, rgb.g, rgb.b), opacity: Math.round(rgb.a * 100) }
    }, [draft.primaryColor])
    const availableColumns = useMemo(() => getAvailableColumns(draft.layout), [draft.layout])

    return {
        ...rest,
        t,
        userPlan: source.userPlan,
        onUpgrade: source.onUpgrade,
        catalogName: draft.catalogName,
        products: source.products,

        // Şablon ve görünüm
        layout: draft.layout,
        onLayoutChange: setters.setLayout,
        showPrices: draft.showPrices,
        onShowPricesChange: setters.setShowPrices,
        showDescriptions: draft.showDescriptions,
        onShowDescriptionsChange: setters.setShowDescriptions,
        showAttributes: draft.showAttributes,
        onShowAttributesChange: setters.setShowAttributes,
        showSku: draft.showSku,
        onShowSkuChange: setters.setShowSku,
        showUrls: draft.showUrls,
        onShowUrlsChange: setters.setShowUrls,
        productImageFit: draft.productImageFit,
        onProductImageFitChange: setters.setProductImageFit,
        columnsPerRow: draft.columnsPerRow,
        onColumnsPerRowChange: setters.setColumnsPerRow,
        availableColumns,

        // Marka
        logoUrl: draft.logoUrl,
        onLogoUrlChange: setters.setLogoUrl,
        logoPosition: draft.logoPosition,
        onLogoPositionChange: setters.setLogoPosition as (position: NonNullable<Catalog['logo_position']>) => void,
        logoSize: draft.logoSize,
        onLogoSizeChange: setters.setLogoSize as (size: NonNullable<Catalog['logo_size']>) => void,
        titlePosition: draft.titlePosition,
        onTitlePositionChange: setters.setTitlePosition as (position: NonNullable<Catalog['title_position']>) => void,
        primaryColor: draft.primaryColor,
        onPrimaryColorChange: setters.setPrimaryColor,
        primaryColorParsed,
        headerTextColor: draft.headerTextColor,
        onHeaderTextColorChange: setters.setHeaderTextColor,

        // Arka plan
        backgroundColor: draft.backgroundColor,
        onBackgroundColorChange: setters.setBackgroundColor,
        backgroundImage: draft.backgroundImage,
        onBackgroundImageChange: setters.setBackgroundImage,
        backgroundImageFit: draft.backgroundImageFit,
        onBackgroundImageFitChange: setters.setBackgroundImageFit,
        backgroundGradient: draft.backgroundGradient,
        onBackgroundGradientChange: setters.setBackgroundGradient,

        // Kapak ve kategori ayraçları
        enableCoverPage: draft.enableCoverPage,
        onEnableCoverPageChange: setters.setEnableCoverPage,
        coverImageUrl: draft.coverImageUrl,
        onCoverImageUrlChange: setters.setCoverImageUrl,
        coverDescription: draft.coverDescription,
        onCoverDescriptionChange: setters.setCoverDescription,
        enableCategoryDividers: draft.enableCategoryDividers,
        onEnableCategoryDividersChange: setters.setEnableCategoryDividers,
        categoryOrder: draft.categoryOrder,
        onCategoryOrderChange: setters.setCategoryOrder,
        coverTheme: draft.coverTheme,
        onCoverThemeChange: setters.setCoverTheme,
    }
}

export type DesignProps = ReturnType<typeof useDesignProps>
