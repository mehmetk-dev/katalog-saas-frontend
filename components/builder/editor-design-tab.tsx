"use client"

import React, { useRef } from "react"
import {
    ChevronDown, Layout, Sparkles, Upload, Trash2,
    Image as ImageIcon, ChevronRight
} from "lucide-react"
import NextImage from "next/image"
import { HexColorPicker } from "react-colorful"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TEMPLATES } from "@/lib/constants"
import { COVER_THEMES, CoverPageRenderer } from "@/components/catalogs/covers"
import { TemplatePreviewCard } from "./template-preview-card"

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

export function EditorDesignTab({
    t,
    openSections,
    toggleSection,
    layout,
    onLayoutChange,
    showPrices,
    onShowPricesChange,
    showDescriptions,
    onShowDescriptionsChange,
    showAttributes,
    onShowAttributesChange,
    showSku,
    onShowSkuChange,
    showUrls,
    onShowUrlsChange,
    productImageFit,
    onProductImageFitChange,
    columnsPerRow,
    onColumnsPerRowChange,
    availableColumns,
    primaryColor,
    onPrimaryColorChange,
    primaryColorParsed,
    showPrimaryColorPicker,
    setShowPrimaryColorPicker,
    primaryColorPickerRef,
    debouncedPrimaryColorChange,
    headerTextColor,
    onHeaderTextColorChange,
    showHeaderTextColorPicker,
    setShowHeaderTextColorPicker,
    headerTextColorPickerRef,
    debouncedHeaderTextColorChange,
    backgroundColor,
    onBackgroundColorChange,
    showBackgroundColorPicker,
    setShowBackgroundColorPicker,
    backgroundColorPickerRef,
    debouncedBackgroundColorChange,
    backgroundImage,
    onBackgroundImageChange,
    backgroundImageFit,
    onBackgroundImageFitChange,
    backgroundGradient,
    onBackgroundGradientChange,
    logoUrl,
    onLogoUrlChange,
    logoPosition,
    onLogoPositionChange,
    titlePosition,
    onTitlePositionChange,
    enableCoverPage,
    onEnableCoverPageChange,
    coverImageUrl,
    onCoverImageUrlChange,
    coverDescription,
    onCoverDescriptionChange,
    enableCategoryDividers,
    onEnableCategoryDividersChange,
    coverTheme,
    onCoverThemeChange,
    catalogName,
    products,
    handleUploadClick,
    handleFileUpload,
    logoInputRef,
    bgInputRef,
    coverInputRef,
    userPlan,
    onUpgrade,
    selectedProductIds,
}: EditorDesignTabProps) {
    const handleTemplateSelect = (templateId: string, isPro: boolean) => {
        if (isPro && userPlan === "free") {
            onUpgrade()
            return
        }
        onLayoutChange(templateId)
    }

    return (
        <div className="m-0 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            {/* DESIGN SECTIONS - STACKED VERTICALLY */}
            <div className="space-y-3">

                {/* 1. APPEARANCE SETTINGS */}
                <div className="space-y-4">
                    <button onClick={() => toggleSection('appearance')} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                <Layout className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">{t('builder.designSettings')}</h3>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", openSections.appearance && "rotate-180")} />
                    </button>

                    <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: openSections.appearance ? '1fr' : '0fr' }}>
                        <div className="overflow-hidden">
                            <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200/50 shadow-sm rounded-[1.5rem] overflow-hidden">
                                <CardContent className="p-5 space-y-6">
                                    {/* Premium Toggles List - Spacious */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: t('builder.showPrices'), value: showPrices, onChange: onShowPricesChange, icon: <Sparkles className="w-3.5 h-3.5" /> },
                                            { label: t('builder.showDescriptions'), value: showDescriptions, onChange: onShowDescriptionsChange },
                                            { label: "Özellikleri Göster", value: showAttributes, onChange: onShowAttributesChange, disabled: layout === 'magazine' },
                                            { label: "Ürün Stoklarını Göster", value: showSku, onChange: onShowSkuChange },
                                            { label: "Ürün URL'leri", value: showUrls, onChange: onShowUrlsChange },
                                        ].map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-2xl transition-all duration-300 border border-slate-100/50 dark:border-slate-800/50",
                                                    item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-white dark:hover:bg-slate-800/50 hover:shadow-sm group",
                                                    item.label === "Ürün URL'leri" && "col-span-2 sm:col-span-1"
                                                )}
                                                onClick={() => !item.disabled && item.onChange?.(!item.value)}
                                            >
                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-tight transition-colors truncate",
                                                        item.disabled ? "text-slate-400" : "text-slate-600 dark:text-slate-400"
                                                    )}>
                                                        {item.label as string}
                                                    </span>
                                                    {item.disabled && <span className="text-[8px] font-medium italic opacity-60">Dergide yok</span>}
                                                </div>
                                                <div className={cn(
                                                    "w-9 h-[18px] rounded-full relative transition-all duration-500 shrink-0",
                                                    item.value && !item.disabled ? "bg-indigo-600 shadow-sm" : "bg-slate-200 dark:bg-slate-700"
                                                )}>
                                                    <div className={cn(
                                                        "absolute top-0.5 left-0.5 w-[14px] h-[14px] rounded-full bg-white transition-all duration-500 shadow-sm",
                                                        item.value && !item.disabled && "translate-x-[18px]"
                                                    )} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Product Image & Layout Settings Grid */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Image Alignment Pill */}
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase text-slate-500 block tracking-widest text-center">{(t('builder.productImages') || "Ürün Fotoğrafları") as string}</Label>
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
                                                            "flex-1 py-1.5 text-[9px] font-black uppercase rounded-xl transition-all duration-300",
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
                                        {availableColumns.length > 1 ? (
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-black uppercase text-slate-500 block tracking-widest text-center">Görünüm Düzeni</Label>
                                                <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl gap-1">
                                                    {availableColumns.map((num) => (
                                                        <button
                                                            key={num}
                                                            onClick={() => onColumnsPerRowChange?.(num)}
                                                            className={cn(
                                                                "flex-1 py-1.5 text-[9px] font-black uppercase rounded-xl transition-all duration-300",
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
                                        ) : (
                                            <div className="flex items-center justify-center text-[10px] text-slate-400 font-bold italic pt-4 leading-tight text-center">
                                                Seçili şablon için düzen sabit.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* 2. LOGO & BRANDING */}
                <div className="space-y-4">
                    <button onClick={() => toggleSection('branding')} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">{t('builder.logoBranding') as string}</h3>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", openSections.branding && "rotate-180")} />
                    </button>

                    <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: openSections.branding ? '1fr' : '0fr' }}>
                        <div className="overflow-hidden">
                            <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200/50 shadow-sm rounded-[1.5rem] overflow-hidden">
                                <CardContent className="p-5 space-y-5">
                                    {/* Logo Upload + Settings - Side by side on larger screens */}
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Logo Upload Area - Compact */}
                                        <div
                                            className={cn(
                                                "relative w-full sm:w-40 h-32 sm:h-auto sm:aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden shrink-0",
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
                                                <div className="relative w-[80%] h-[80%] group">
                                                    <NextImage src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                                                    <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 rounded-xl">
                                                        <span className="text-[8px] font-black uppercase text-slate-800 bg-white/90 px-2 py-1 rounded-full shadow-lg">DEĞİŞTİR</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center p-3 space-y-1.5">
                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto transition-transform group-hover:-translate-y-1">
                                                        <Upload className="w-5 h-5 text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">{t('builder.logoUpload') as string}</p>
                                                        <p className="text-[8px] text-slate-400 font-bold">PNG, WEBP (2MB)</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                                    </div>

                                    {/* Logo Position + Title Settings */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Logo Konumu</Label>
                                            <Select value={logoPosition || 'none'} onValueChange={(v) => onLogoPositionChange?.(v as NonNullable<Catalog['logo_position']>)}>
                                                <SelectTrigger className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                                                    <SelectValue placeholder="Gösterme" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl shadow-2xl">
                                                    <SelectItem value="none">Gösterme</SelectItem>
                                                    <SelectItem value="header-left">Sol Üst</SelectItem>
                                                    <SelectItem value="header-center">Orta Üst</SelectItem>
                                                    <SelectItem value="header-right">Sağ Üst</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Başlık Hizalama</Label>
                                            <Select value={titlePosition || 'left'} onValueChange={(v) => onTitlePositionChange?.(v as NonNullable<Catalog['title_position']>)}>
                                                <SelectTrigger className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[11px] font-bold">
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

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                                                debouncedPrimaryColorChange(`rgba(${r}, ${g}, ${b}, ${primaryColorParsed.rgb.a})`)
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
                                                            onChange={(hex) => debouncedHeaderTextColorChange(hex)}
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
                    </div>
                </div>

                {/* 3. BACKGROUND SETTINGS - FULL WIDTH ON LG */}
                <div className="space-y-4">
                    <button onClick={() => toggleSection('background')} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                <ImageIcon className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">{t('builder.backgroundSettings') as string}</h3>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", openSections.background && "rotate-180")} />
                    </button>

                    <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: openSections.background ? '1fr' : '0fr' }}>
                        <div className="overflow-hidden">
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
                                                            onChange={(hex) => debouncedBackgroundColorChange(hex)}
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
                                                            <Select value={backgroundImageFit} onValueChange={(v) => onBackgroundImageFitChange?.(v as NonNullable<Catalog['background_image_fit']>)}>
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
                </div>

                {/* 4. STORYTELLING CATALOG SETTINGS */}
                <div className="space-y-4">
                    <button onClick={() => toggleSection('storytelling')} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Hikaye Kataloğu</h3>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", openSections.storytelling && "rotate-180")} />
                    </button>

                    <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: openSections.storytelling ? '1fr' : '0fr' }}>
                        <div className="overflow-hidden">
                            <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200/50 shadow-sm rounded-[2rem] overflow-hidden">
                                <CardContent className="p-6 space-y-6">
                                    {/* Cover Page Toggle */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wide">Kapak Sayfası</Label>
                                                <p className="text-[10px] text-slate-500">Katalogda profesyonel bir kapak sayfası göster</p>
                                            </div>
                                            <button
                                                onClick={() => onEnableCoverPageChange?.(!enableCoverPage)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                                                    enableCoverPage ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                        enableCoverPage ? "translate-x-5" : "translate-x-0"
                                                    )}
                                                />
                                            </button>
                                        </div>

                                        {/* Cover Page Options (only visible when enabled) */}
                                        {enableCoverPage && (
                                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-500">
                                                {/* THEME SELECTOR */}
                                                <div className="space-y-3">
                                                    <Label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.1em] pl-1">Kapak Tasarımı</Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {Object.entries(COVER_THEMES).map(([key, theme]) => {
                                                            const isSelected = coverTheme === key || (!coverTheme && key === 'modern');
                                                            return (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => onCoverThemeChange?.(key)}
                                                                    className={cn(
                                                                        "flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                                                                        isSelected
                                                                            ? "border-indigo-600 bg-indigo-50/40 shadow-sm shadow-indigo-100"
                                                                            : "border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                                                                        isSelected
                                                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-110"
                                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                                                                    )}>
                                                                        <Layout className="w-3 h-3" />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className={cn(
                                                                            "text-[10px] font-bold truncate leading-tight transition-colors",
                                                                            isSelected ? "text-indigo-700 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"
                                                                        )}>
                                                                            {theme.name}
                                                                        </span>
                                                                    </div>
                                                                    {isSelected && (
                                                                        <div className="absolute right-0 top-0 h-full w-1 bg-indigo-600" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Cover Image Upload */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between px-1">
                                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kapak Görseli</Label>
                                                        <span className="text-[9px] text-slate-400 font-bold italic">Önerilen: 1920x1080px</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {coverImageUrl ? (
                                                            <div className="group relative aspect-video rounded-3xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md">
                                                                <NextImage src={coverImageUrl} alt="Cover" fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() => coverInputRef.current?.click()}
                                                                        className="h-8 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-white/20 text-[10px] font-bold uppercase transition-all"
                                                                    >
                                                                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                                                                        Değiştir
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() => onCoverImageUrlChange?.(null)}
                                                                        className="h-8 rounded-xl bg-red-500/80 backdrop-blur-md hover:bg-red-600 text-white border-none text-[10px] font-bold uppercase transition-all"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                                                        Kaldır
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => coverInputRef.current?.click()}
                                                                className="w-full aspect-video rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-900 transition-all duration-300 flex flex-col items-center justify-center group"
                                                            >
                                                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-50 transition-all duration-300">
                                                                    <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                                                                </div>
                                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-700">Görsel Seç</span>
                                                                <span className="text-[9px] text-slate-400 font-bold mt-1">Sürükle bırak veya tıkla</span>
                                                            </button>
                                                        )}
                                                        <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                                                    </div>
                                                </div>

                                                {/* Cover Description */}
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kapak Açıklaması</Label>
                                                    <textarea
                                                        value={coverDescription || ''}
                                                        onChange={(e) => onCoverDescriptionChange?.(e.target.value || null)}
                                                        placeholder="Katalog hakkında kısa bir açıklama (maksimum 500 karakter)"
                                                        maxLength={500}
                                                        className="w-full min-h-[100px] p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                                                    />
                                                    <p className="text-[9px] text-slate-400 text-right">{(coverDescription || '').length}/500</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Cover Page Preview */}
                                    {enableCoverPage && (
                                        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 animate-in fade-in zoom-in duration-500">
                                            <div className="aspect-[1/1.414] w-full max-w-[320px] mx-auto bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-200/50 scale-[0.9] origin-top transition-transform hover:scale-100 duration-500">
                                                <CoverPageRenderer
                                                    theme={coverTheme}
                                                    catalogName={catalogName}
                                                    coverImageUrl={coverImageUrl}
                                                    coverDescription={coverDescription}
                                                    logoUrl={logoUrl}
                                                    primaryColor={primaryColor}
                                                    productCount={products.length}
                                                />
                                            </div>
                                            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">Kapak Önizlemesi</p>
                                        </div>
                                    )}

                                    {/* Category Dividers Toggle */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wide">Kategori Geçiş Sayfaları</Label>
                                                <p className="text-[10px] text-slate-500">Kategoriler arası geçişlerde görsel ayraç sayfaları göster</p>
                                            </div>
                                            <button
                                                onClick={() => onEnableCategoryDividersChange?.(!enableCategoryDividers)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                                                    enableCategoryDividers ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                        enableCategoryDividers ? "translate-x-5" : "translate-x-0"
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* VISUAL STRUCTURE PREVIEW (SAYFA YAPISI) */}
                <div className="space-y-6 pt-6 animate-in fade-in duration-700">
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px bg-slate-200 flex-1 hidden sm:block" />
                        <div className="flex items-center gap-2 px-6">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500 shadow-lg shadow-amber-200 flex items-center justify-center text-white">
                                <Layout className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm sm:text-lg font-black uppercase tracking-[0.1em] text-slate-800 dark:text-slate-200">SAYFA YAPISI</h3>
                        </div>
                        <div className="h-px bg-slate-200 flex-1 hidden sm:block" />
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x px-4 items-center justify-center max-w-full">
                        {/* 1. Cover Page Card */}
                        <div className={cn(
                            "flex-shrink-0 w-24 h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-500",
                            enableCoverPage
                                ? "border-indigo-600 bg-indigo-50/50 shadow-lg scale-105"
                                : "border-slate-200 border-dashed bg-slate-50/50 opacity-40"
                        )}>
                            <div className={cn(
                                "w-7 h-7 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-sm",
                                enableCoverPage ? "bg-indigo-600" : "bg-slate-300"
                            )}>01</div>
                            <span className="text-[9px] font-black uppercase tracking-tight text-slate-500 text-center px-1">Kapak</span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />

                        {/* 2. Intro/Products Card */}
                        <div className="flex-shrink-0 w-24 h-32 rounded-2xl border-2 border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-10 bg-slate-100 rounded-lg border border-slate-200 flex flex-col gap-1 p-1">
                                <div className="w-full h-1/2 bg-slate-200/50 rounded-sm"></div>
                                <div className="w-full h-1/2 bg-slate-200/50 rounded-sm"></div>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tight text-slate-500 text-center px-1">Ürünler</span>
                            <span className="text-[8px] text-slate-400 font-bold">{selectedProductIds.length} Ürün</span>
                        </div>

                        {enableCategoryDividers && (
                            <>
                                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                <div className="flex-shrink-0 w-24 h-32 rounded-2xl border-2 border-violet-500 bg-violet-50/50 shadow-lg scale-105 flex flex-col items-center justify-center gap-2 animate-in zoom-in-50 duration-500">
                                    <div className="w-7 h-7 rounded-xl bg-violet-600 shadow-sm flex items-center justify-center text-white">
                                        <Layout className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-tight text-slate-600 text-center px-1">Geçişler</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* TEMPLATE SELECTOR */}
                <div className="space-y-6 pt-6 animate-in fade-in duration-700">
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px bg-slate-200 flex-1 hidden sm:block" />
                        <div className="flex items-center gap-2 px-6">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center text-white">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm sm:text-lg font-black uppercase tracking-[0.1em] text-slate-800 dark:text-slate-200">{t('builder.templateStyle') as string}</h3>
                        </div>
                        <div className="h-px bg-slate-200 flex-1 hidden sm:block" />
                    </div>

                    <div className="flex overflow-x-auto pb-8 gap-6 snap-x px-4 -mx-4 scrollbar-hide">
                        {TEMPLATES.map((tmpl) => (
                            <div key={tmpl.id} className="flex-shrink-0 w-64 snap-center">
                                <TemplatePreviewCard
                                    templateId={tmpl.id}
                                    templateName={tmpl.name}
                                    isPro={tmpl.isPro}
                                    isSelected={layout === tmpl.id}
                                    onSelect={() => handleTemplateSelect(tmpl.id, tmpl.isPro)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
