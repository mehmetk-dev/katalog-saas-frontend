"use client"

import React from "react"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import {
    AppearanceSection,
    BrandingSection,
    BackgroundSection,
    StorytellingSection,
    StructurePreview,
    TemplateSection,
} from "./design-sections"

interface EditorDesignTabProps {
    // Translation
    t: (key: string, params?: Record<string, unknown>) => string

    // Section toggles
    openSections: Record<string, boolean>
    toggleSection: (key: string) => void

    // Appearance settings
    layout: string
    onLayoutChange: (layout: string) => void
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

    // Color pickers
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

    backgroundColor: string
    onBackgroundColorChange?: (color: string) => void
    showBackgroundColorPicker: boolean
    setShowBackgroundColorPicker: (show: boolean) => void
    backgroundColorPickerRef: React.RefObject<HTMLDivElement | null>
    debouncedBackgroundColorChange: (color: string) => void

    // Background settings
    backgroundImage: string | null
    onBackgroundImageChange?: (url: string | null) => void
    backgroundImageFit: NonNullable<Catalog['background_image_fit']>
    onBackgroundImageFitChange?: (fit: NonNullable<Catalog['background_image_fit']>) => void
    backgroundGradient: string | null
    onBackgroundGradientChange?: (gradient: string | null) => void

    // Logo & Branding
    logoUrl: string | null
    onLogoUrlChange?: (url: string | null) => void
    logoPosition: Catalog['logo_position']
    onLogoPositionChange?: (position: NonNullable<Catalog['logo_position']>) => void
    titlePosition: Catalog['title_position']
    onTitlePositionChange?: (position: NonNullable<Catalog['title_position']>) => void

    // Storytelling
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

    // Upload
    handleUploadClick: () => void
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg' | 'cover') => void
    logoInputRef: React.RefObject<HTMLInputElement | null>
    bgInputRef: React.RefObject<HTMLInputElement | null>
    coverInputRef: React.RefObject<HTMLInputElement | null>

    // Template selection
    userPlan: string
    onUpgrade: () => void
    selectedProductIds: string[]
}

export function EditorDesignTab(props: EditorDesignTabProps) {
    return (
        <div className="m-0 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            <div className="space-y-3">
                <AppearanceSection
                    t={props.t}
                    openSections={props.openSections}
                    toggleSection={props.toggleSection}
                    layout={props.layout}
                    showPrices={props.showPrices}
                    onShowPricesChange={props.onShowPricesChange}
                    showDescriptions={props.showDescriptions}
                    onShowDescriptionsChange={props.onShowDescriptionsChange}
                    showAttributes={props.showAttributes}
                    onShowAttributesChange={props.onShowAttributesChange}
                    showSku={props.showSku}
                    onShowSkuChange={props.onShowSkuChange}
                    showUrls={props.showUrls}
                    onShowUrlsChange={props.onShowUrlsChange}
                    productImageFit={props.productImageFit}
                    onProductImageFitChange={props.onProductImageFitChange}
                    columnsPerRow={props.columnsPerRow}
                    onColumnsPerRowChange={props.onColumnsPerRowChange}
                    availableColumns={props.availableColumns}
                />

                <BrandingSection
                    t={props.t}
                    openSections={props.openSections}
                    toggleSection={props.toggleSection}
                    logoUrl={props.logoUrl}
                    onLogoUrlChange={props.onLogoUrlChange}
                    logoPosition={props.logoPosition}
                    onLogoPositionChange={props.onLogoPositionChange}
                    titlePosition={props.titlePosition}
                    onTitlePositionChange={props.onTitlePositionChange}
                    primaryColor={props.primaryColor}
                    onPrimaryColorChange={props.onPrimaryColorChange}
                    primaryColorParsed={props.primaryColorParsed}
                    showPrimaryColorPicker={props.showPrimaryColorPicker}
                    setShowPrimaryColorPicker={props.setShowPrimaryColorPicker}
                    primaryColorPickerRef={props.primaryColorPickerRef}
                    debouncedPrimaryColorChange={props.debouncedPrimaryColorChange}
                    headerTextColor={props.headerTextColor}
                    onHeaderTextColorChange={props.onHeaderTextColorChange}
                    showHeaderTextColorPicker={props.showHeaderTextColorPicker}
                    setShowHeaderTextColorPicker={props.setShowHeaderTextColorPicker}
                    headerTextColorPickerRef={props.headerTextColorPickerRef}
                    debouncedHeaderTextColorChange={props.debouncedHeaderTextColorChange}
                    handleUploadClick={props.handleUploadClick}
                    handleFileUpload={props.handleFileUpload}
                    logoInputRef={props.logoInputRef}
                />

                <BackgroundSection
                    t={props.t}
                    openSections={props.openSections}
                    toggleSection={props.toggleSection}
                    backgroundColor={props.backgroundColor}
                    onBackgroundColorChange={props.onBackgroundColorChange}
                    showBackgroundColorPicker={props.showBackgroundColorPicker}
                    setShowBackgroundColorPicker={props.setShowBackgroundColorPicker}
                    backgroundColorPickerRef={props.backgroundColorPickerRef}
                    debouncedBackgroundColorChange={props.debouncedBackgroundColorChange}
                    backgroundImage={props.backgroundImage}
                    onBackgroundImageChange={props.onBackgroundImageChange}
                    backgroundImageFit={props.backgroundImageFit}
                    onBackgroundImageFitChange={props.onBackgroundImageFitChange}
                    backgroundGradient={props.backgroundGradient}
                    onBackgroundGradientChange={props.onBackgroundGradientChange}
                    handleUploadClick={props.handleUploadClick}
                    handleFileUpload={props.handleFileUpload}
                    bgInputRef={props.bgInputRef}
                />

                <StorytellingSection
                    t={props.t}
                    openSections={props.openSections}
                    toggleSection={props.toggleSection}
                    enableCoverPage={props.enableCoverPage}
                    onEnableCoverPageChange={props.onEnableCoverPageChange}
                    coverImageUrl={props.coverImageUrl}
                    onCoverImageUrlChange={props.onCoverImageUrlChange}
                    coverDescription={props.coverDescription}
                    onCoverDescriptionChange={props.onCoverDescriptionChange}
                    enableCategoryDividers={props.enableCategoryDividers}
                    onEnableCategoryDividersChange={props.onEnableCategoryDividersChange}
                    coverTheme={props.coverTheme}
                    onCoverThemeChange={props.onCoverThemeChange}
                    catalogName={props.catalogName}
                    products={props.products}
                    logoUrl={props.logoUrl}
                    primaryColor={props.primaryColor}
                    handleFileUpload={props.handleFileUpload}
                    coverInputRef={props.coverInputRef}
                />

                <StructurePreview
                    t={props.t}
                    enableCoverPage={props.enableCoverPage}
                    enableCategoryDividers={props.enableCategoryDividers}
                    selectedProductIds={props.selectedProductIds}
                />

                <TemplateSection
                    t={props.t}
                    layout={props.layout}
                    onLayoutChange={props.onLayoutChange}
                    userPlan={props.userPlan}
                    onUpgrade={props.onUpgrade}
                />
            </div>
        </div>
    )
}
