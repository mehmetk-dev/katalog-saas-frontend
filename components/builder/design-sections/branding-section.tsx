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
                <CardContent className="p-5 space-y-5">
                    {/* Logo Upload + Settings */}
                    <div className="flex flex-col sm:flex-row gap-4">
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
        </SectionWrapper>
    )
}
