"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode, type RefObject } from "react"

import { useBuilder } from "@/components/builder/builder-context"
import { getAvailableColumns, parseColor, rgbToHex } from "@/components/builder/builder-utils"
import type { Catalog } from "@/lib/actions/catalogs"
import { useDebouncedCallback } from "@/lib/hooks/use-debounce"
import { useEditorUpload } from "@/lib/hooks/use-editor-upload"
import { useTranslation } from "@/lib/contexts/i18n-provider"

/*
 * Tasarım sekmesinin bölümleri (şablon, görünüm, marka, arka plan, kapak) değerlerini ve
 * değiştiricilerini doğrudan builder state'inden okur. Önceden CatalogEditor ~70 değeri ve
 * setter'ı tek tek EditorDesignTab'a, o da her bölüme aynı adlarla yeniden aktarıyordu; yeni bir
 * ayar eklemek dört dosyayı değiştirmeyi gerektiriyordu.
 *
 * Bu context yalnızca editöre özgü araçları taşır: hangi bölümün açık olduğu, dosya yükleme ve
 * renk seçicilerdeki gecikmeli güncelleme.
 */

type UploadType = "logo" | "bg" | "cover"

interface DesignTools {
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

export function DesignToolsProvider({ children }: { children: ReactNode }) {
    const { state } = useBuilder()
    const { setPrimaryColor, setHeaderTextColor, setBackgroundColor, setLogoUrl, setCoverImageUrl, setBackgroundImage, backgroundImage } = state
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ template: true, appearance: true, branding: true })
    const toggleSection = useCallback((key: string) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
    }, [])

    // Renk seçici sürüklenirken her piksel bir geçmiş adımı/otomatik kayıt tetiklemesin
    const debouncedPrimaryColorChange = useDebouncedCallback((color: string) => setPrimaryColor(color), 50)
    const debouncedHeaderTextColorChange = useDebouncedCallback((color: string) => setHeaderTextColor(color), 50)
    const debouncedBackgroundColorChange = useDebouncedCallback((color: string) => setBackgroundColor(color), 50)

    const upload = useEditorUpload({
        onLogoUrlChange: setLogoUrl,
        onCoverImageUrlChange: setCoverImageUrl,
        onBackgroundImageChange: setBackgroundImage,
        backgroundImage,
        t,
    })

    const value = useMemo<DesignTools>(() => ({
        openSections,
        toggleSection,
        handleUploadClick: upload.handleUploadClick,
        handleFileUpload: upload.handleFileUpload,
        logoInputRef: upload.logoInputRef,
        bgInputRef: upload.bgInputRef,
        coverInputRef: upload.coverInputRef,
        debouncedPrimaryColorChange,
        debouncedHeaderTextColorChange,
        debouncedBackgroundColorChange,
    }), [openSections, toggleSection, upload.handleUploadClick, upload.handleFileUpload, upload.logoInputRef, upload.bgInputRef, upload.coverInputRef, debouncedPrimaryColorChange, debouncedHeaderTextColorChange, debouncedBackgroundColorChange])

    return <DesignToolsContext.Provider value={value}>{children}</DesignToolsContext.Provider>
}

/**
 * Bölümlerin kullandığı değerler ve değiştiriciler — eski prop adlarıyla aynı, böylece bölüm
 * gövdeleri değişmeden context'ten beslenir.
 */
export function useDesignProps() {
    const tools = useContext(DesignToolsContext)
    if (!tools) throw new Error("useDesignProps must be used within DesignToolsProvider")
    const { state, userPlan } = useBuilder()
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

    const primaryColorParsed = useMemo(() => {
        const rgb = parseColor(state.primaryColor)
        return { rgb, hexColor: rgbToHex(rgb.r, rgb.g, rgb.b), opacity: Math.round(rgb.a * 100) }
    }, [state.primaryColor])
    const availableColumns = useMemo(() => getAvailableColumns(state.layout), [state.layout])
    const products = useMemo(() => Array.from(state.productMap.values()), [state.productMap])
    const onUpgrade = useCallback(() => state.setShowUpgradeModal(true), [state])

    return {
        ...tools,
        t,
        userPlan,
        onUpgrade,
        catalogName: state.catalogName,
        products,

        // Şablon ve görünüm
        layout: state.layout,
        onLayoutChange: state.setLayout,
        showPrices: state.showPrices,
        onShowPricesChange: state.setShowPrices,
        showDescriptions: state.showDescriptions,
        onShowDescriptionsChange: state.setShowDescriptions,
        showAttributes: state.showAttributes,
        onShowAttributesChange: state.setShowAttributes,
        showSku: state.showSku,
        onShowSkuChange: state.setShowSku,
        showUrls: state.showUrls,
        onShowUrlsChange: state.setShowUrls,
        productImageFit: state.productImageFit,
        onProductImageFitChange: state.setProductImageFit as (fit: NonNullable<Catalog['product_image_fit']>) => void,
        columnsPerRow: state.columnsPerRow,
        onColumnsPerRowChange: state.setColumnsPerRow,
        availableColumns,

        // Marka
        logoUrl: state.logoUrl,
        onLogoUrlChange: state.setLogoUrl,
        logoPosition: state.logoPosition,
        onLogoPositionChange: state.setLogoPosition as (position: NonNullable<Catalog['logo_position']>) => void,
        logoSize: state.logoSize,
        onLogoSizeChange: state.setLogoSize as (size: NonNullable<Catalog['logo_size']>) => void,
        titlePosition: state.titlePosition,
        onTitlePositionChange: state.setTitlePosition as (position: NonNullable<Catalog['title_position']>) => void,
        primaryColor: state.primaryColor,
        onPrimaryColorChange: state.setPrimaryColor,
        primaryColorParsed,
        headerTextColor: state.headerTextColor,
        onHeaderTextColorChange: state.setHeaderTextColor,

        // Arka plan
        backgroundColor: state.backgroundColor,
        onBackgroundColorChange: state.setBackgroundColor,
        backgroundImage: state.backgroundImage,
        onBackgroundImageChange: state.setBackgroundImage,
        backgroundImageFit: state.backgroundImageFit,
        onBackgroundImageFitChange: state.setBackgroundImageFit as (fit: NonNullable<Catalog['background_image_fit']>) => void,
        backgroundGradient: state.backgroundGradient,
        onBackgroundGradientChange: state.setBackgroundGradient,

        // Kapak ve kategori ayraçları
        enableCoverPage: state.enableCoverPage,
        onEnableCoverPageChange: state.setEnableCoverPage,
        coverImageUrl: state.coverImageUrl,
        onCoverImageUrlChange: state.setCoverImageUrl,
        coverDescription: state.coverDescription,
        onCoverDescriptionChange: state.setCoverDescription,
        enableCategoryDividers: state.enableCategoryDividers,
        onEnableCategoryDividersChange: state.setEnableCategoryDividers,
        categoryOrder: state.categoryOrder,
        onCategoryOrderChange: state.setCategoryOrder,
        coverTheme: state.coverTheme,
        onCoverThemeChange: state.setCoverTheme,
    }
}

export type DesignProps = ReturnType<typeof useDesignProps>
