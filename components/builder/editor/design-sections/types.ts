import type React from "react"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"

// Shared translation function type
export type TranslateFn = (key: string, params?: Record<string, unknown>) => string

// Common section props
export interface SectionWrapperProps {
    id: string
    title: string
    icon: React.ReactNode
    iconBg: string
    isOpen: boolean
    onToggle: () => void
    children: React.ReactNode
}

// Section-specific props
export interface AppearanceSectionProps {
    t: TranslateFn
    openSections: Record<string, boolean>
    toggleSection: (key: string) => void
    layout: string
    showPrices: boolean
    onShowPricesChange: (show: boolean) => void
    showDescriptions: boolean
    onShowDescriptionsChange: (show: boolean) => void
    showAttributes: boolean
    onShowAttributesChange?: (show: boolean) => void
    showSku: boolean
    onShowSkuChange?: (show: boolean) => void
    showUrls: boolean
    onShowUrlsChange?: (show: boolean) => void
    productImageFit: NonNullable<Catalog['product_image_fit']>
    onProductImageFitChange?: (fit: NonNullable<Catalog['product_image_fit']>) => void
    columnsPerRow: number
    onColumnsPerRowChange?: (columns: number) => void
    availableColumns: number[]
}

export interface BrandingSectionProps {
    t: TranslateFn
    openSections: Record<string, boolean>
    toggleSection: (key: string) => void
    logoUrl: string | null
    onLogoUrlChange?: (url: string | null) => void
    logoPosition: Catalog['logo_position']
    onLogoPositionChange?: (position: NonNullable<Catalog['logo_position']>) => void
    logoSize?: Catalog['logo_size']
    onLogoSizeChange?: (size: NonNullable<Catalog['logo_size']>) => void
    titlePosition: Catalog['title_position']
    onTitlePositionChange?: (position: NonNullable<Catalog['title_position']>) => void
    primaryColor: string
    onPrimaryColorChange: (color: string) => void
    primaryColorParsed: { rgb: { r: number; g: number; b: number; a: number }; hexColor: string; opacity: number }
    showPrimaryColorPicker: boolean
    setShowPrimaryColorPicker: (show: boolean) => void
    primaryColorPickerRef: React.RefObject<HTMLDivElement | null>
    debouncedPrimaryColorChange: (color: string) => void
    headerTextColor: string
    onHeaderTextColorChange?: (color: string) => void
    showHeaderTextColorPicker: boolean
    setShowHeaderTextColorPicker: (show: boolean) => void
    headerTextColorPickerRef: React.RefObject<HTMLDivElement | null>
    debouncedHeaderTextColorChange: (color: string) => void
    handleUploadClick: () => void
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg' | 'cover') => void
    logoInputRef: React.RefObject<HTMLInputElement | null>
}

export interface BackgroundSectionProps {
    t: TranslateFn
    openSections: Record<string, boolean>
    toggleSection: (key: string) => void
    backgroundColor: string
    onBackgroundColorChange?: (color: string) => void
    showBackgroundColorPicker: boolean
    setShowBackgroundColorPicker: (show: boolean) => void
    backgroundColorPickerRef: React.RefObject<HTMLDivElement | null>
    debouncedBackgroundColorChange: (color: string) => void
    backgroundImage: string | null
    onBackgroundImageChange?: (url: string | null) => void
    backgroundImageFit: NonNullable<Catalog['background_image_fit']>
    onBackgroundImageFitChange?: (fit: NonNullable<Catalog['background_image_fit']>) => void
    backgroundGradient: string | null
    onBackgroundGradientChange?: (gradient: string | null) => void
    handleUploadClick: () => void
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg' | 'cover') => void
    bgInputRef: React.RefObject<HTMLInputElement | null>
}

export interface StorytellingSectionProps {
    t: TranslateFn
    openSections: Record<string, boolean>
    toggleSection: (key: string) => void
    enableCoverPage: boolean
    onEnableCoverPageChange?: (enable: boolean) => void
    coverImageUrl: string | null
    onCoverImageUrlChange?: (url: string | null) => void
    coverDescription: string | null
    onCoverDescriptionChange?: (desc: string | null) => void
    enableCategoryDividers: boolean
    onEnableCategoryDividersChange?: (enable: boolean) => void
    coverTheme: string
    onCoverThemeChange?: (theme: string) => void
    catalogName: string
    products: Product[]
    logoUrl: string | null
    primaryColor: string
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg' | 'cover') => void
    coverInputRef: React.RefObject<HTMLInputElement | null>
}

export interface StructurePreviewProps {
    t: TranslateFn
    enableCoverPage: boolean
    enableCategoryDividers: boolean
    selectedProductCount: number
}

export interface TemplateSectionProps {
    t: TranslateFn
    layout: string
    onLayoutChange: (layout: string) => void
    userPlan: string
    onUpgrade: () => void
}
