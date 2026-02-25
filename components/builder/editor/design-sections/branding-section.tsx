import { Sparkles, Upload } from "lucide-react"
import NextImage from "next/image"
import { HexColorPicker } from "react-colorful"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Catalog } from "@/lib/actions/catalogs"
import type { BrandingSectionProps } from "./types"
import { SectionWrapper } from "./section-wrapper"

export function BrandingSection({
    t,
    openSections,
    toggleSection,
    logoUrl,
    onLogoPositionChange,
    logoPosition,
    logoSize,
    onLogoSizeChange,
    titlePosition,
    onTitlePositionChange,
    primaryColor,
    onPrimaryColorChange,
    primaryColorParsed,
    showPrimaryColorPicker,
    setShowPrimaryColorPicker,
    primaryColorPickerRef,
    debouncedPrimaryColorChange,
    headerTextColor,
    showHeaderTextColorPicker,
    setShowHeaderTextColorPicker,
    headerTextColorPickerRef,
    debouncedHeaderTextColorChange,
    handleUploadClick,
    handleFileUpload,
    logoInputRef,
}: BrandingSectionProps) {
    return (
        <SectionWrapper
            id="branding"
            title={t('builder.logoBranding') as string}
            icon={<Sparkles className="w-4 h-4" />}
            iconBg="bg-amber-50 dark:bg-amber-900/30 text-amber-600"
            isOpen={!!openSections.branding}
            onToggle={() => toggleSection('branding')}
        >
            <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200/50 shadow-sm rounded-[1.5rem] overflow-hidden">
                <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* 1. Left Column: Logo Upload (Visual Focus) */}
                        <div className="w-full md:w-40 shrink-0">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">
                                    {t('builder.logoUpload') as string}
                                </Label>
                                <div
                                    className={cn(
                                        "relative aspect-square w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden group/upload",
                                        logoUrl
                                            ? "border-indigo-100 bg-indigo-50/30"
                                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-100"
                                    )}
                                    onClick={() => {
                                        handleUploadClick()
                                        logoInputRef.current?.click()
                                    }}
                                >
                                    {logoUrl ? (
                                        <div className="relative w-full h-full p-3 group-hover/upload:opacity-50 transition-opacity">
                                            <NextImage src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                                        </div>
                                    ) : (
                                        <div className="text-center p-3 space-y-2 transition-transform duration-300 group-hover/upload:scale-110">
                                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-indigo-500">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold text-slate-600">Logo Seç</p>
                                                <p className="text-[9px] text-slate-400 font-medium">PNG, WEBP</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className={cn(
                                        "absolute inset-0 flex items-center justify-center transition-all duration-300 bg-black/5 backdrop-blur-[1px]",
                                        logoUrl ? "opacity-0 group-hover/upload:opacity-100" : "opacity-0 pointer-events-none"
                                    )}>
                                        <span className="text-[9px] font-bold bg-white px-3 py-1.5 rounded-full shadow-lg text-slate-800 transform translate-y-2 group-hover/upload:translate-y-0 transition-transform">
                                            DEĞİŞTİR
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                        </div>

                        {/* 2. Right Column: Controls (Dense & Clean) */}
                        <div className="flex-1 space-y-5">
                            {/* Row 1: Position, Alignment & Size */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Logo Konumu</Label>
                                    <Select value={logoPosition || 'none'} onValueChange={(v) => onLogoPositionChange?.(v as NonNullable<Catalog['logo_position']>)}>
                                        <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-100 transition-shadow hover:border-indigo-300">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                            <SelectItem value="none">Gösterme</SelectItem>
                                            <SelectItem value="header-left">Sol Üst</SelectItem>
                                            <SelectItem value="header-center">Orta Üst</SelectItem>
                                            <SelectItem value="header-right">Sağ Üst</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Logo Boyutu</Label>
                                    <Select value={logoSize || 'medium'} onValueChange={(v) => onLogoSizeChange?.(v as NonNullable<Catalog['logo_size']>)}>
                                        <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-100 transition-shadow hover:border-indigo-300">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                            <SelectItem value="small">Küçük</SelectItem>
                                            <SelectItem value="medium">Orta</SelectItem>
                                            <SelectItem value="large">Büyük</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Başlık Hizalama</Label>
                                    <Select value={titlePosition || 'left'} onValueChange={(v) => onTitlePositionChange?.(v as NonNullable<Catalog['title_position']>)}>
                                        <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-100 transition-shadow hover:border-indigo-300">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                            <SelectItem value="left">Sola Dayalı</SelectItem>
                                            <SelectItem value="center">Ortala</SelectItem>
                                            <SelectItem value="right">Sağa Dayalı</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Row 2: Colors */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Renk Teması</Label>
                                    <div className="flex gap-1.5">
                                        {['#4f46e5', '#9333ea', '#db2777', '#0f172a'].map((color) => (
                                            <button
                                                key={color}
                                                className="w-4 h-4 rounded-full ring-1 ring-slate-100 hover:scale-125 transition-transform"
                                                style={{ backgroundColor: color }}
                                                onClick={() => onPrimaryColorChange(`rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 1)`)}
                                                type="button"
                                                title="Hızlı Renk Seç"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Primary Color Compact */}
                                    <div className="group relative" ref={primaryColorPickerRef}>
                                        <div
                                            onClick={() => setShowPrimaryColorPicker(!showPrimaryColorPicker)}
                                            className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all duration-200"
                                        >
                                            <div
                                                className="w-9 h-9 rounded-lg shadow-sm ring-1 ring-black/5 shrink-0"
                                                style={{ backgroundColor: primaryColor }}
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-bold text-slate-700 truncate">Üst Kart</span>
                                                <span className="text-[10px] font-mono text-slate-400 truncate tracking-tight">{primaryColorParsed.hexColor}</span>
                                            </div>
                                        </div>
                                        {showPrimaryColorPicker && (
                                            <div className="absolute bottom-full left-0 mb-2 z-50 animate-in zoom-in-95 duration-200">
                                                <div className="bg-white p-3 rounded-2xl shadow-2xl border border-slate-100">
                                                    <HexColorPicker
                                                        color={primaryColorParsed.hexColor}
                                                        onChange={(hex) => {
                                                            const r = parseInt(hex.substring(1, 3), 16), g = parseInt(hex.substring(3, 5), 16), b = parseInt(hex.substring(5, 7), 16)
                                                            debouncedPrimaryColorChange(`rgba(${r}, ${g}, ${b}, ${primaryColorParsed.rgb.a})`)
                                                        }}
                                                        style={{ width: '100%', height: '140px' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Text Color Compact */}
                                    <div className="group relative" ref={headerTextColorPickerRef}>
                                        <div
                                            onClick={() => setShowHeaderTextColorPicker(!showHeaderTextColorPicker)}
                                            className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all duration-200"
                                        >
                                            <div
                                                className="w-9 h-9 rounded-lg shadow-sm ring-1 ring-slate-200 shrink-0"
                                                style={{ backgroundColor: headerTextColor || '#ffffff' }}
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-bold text-slate-700 truncate">Yazı Rengi</span>
                                                <span className="text-[10px] font-mono text-slate-400 truncate tracking-tight">{headerTextColor || '#FFFFFF'}</span>
                                            </div>
                                        </div>
                                        {showHeaderTextColorPicker && (
                                            <div className="absolute bottom-full right-0 mb-2 z-50 animate-in zoom-in-95 duration-200">
                                                <div className="bg-white p-3 rounded-2xl shadow-2xl border border-slate-100">
                                                    <HexColorPicker
                                                        color={headerTextColor || '#ffffff'}
                                                        onChange={(hex) => debouncedHeaderTextColorChange(hex)}
                                                        style={{ width: '100%', height: '140px' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card >
        </SectionWrapper >
    )
}
