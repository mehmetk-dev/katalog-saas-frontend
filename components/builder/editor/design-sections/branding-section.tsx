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
            <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200/50 shadow-sm rounded-[1.5rem] overflow-visible">
                <CardContent className="p-5 space-y-5">
                    {/* Row 1: Logo Upload + Logo Settings */}
                    <div className="flex gap-4 items-start">
                        {/* Logo Upload */}
                        <div className="w-20 shrink-0">
                            <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider ml-0.5 block mb-1.5">
                                {t('builder.logoUpload') as string}
                            </Label>
                            <div
                                className={cn(
                                    "relative aspect-square w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden group/upload",
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
                                    <div className="relative w-full h-full p-2 group-hover/upload:opacity-50 transition-opacity">
                                        <NextImage src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                                    </div>
                                ) : (
                                    <div className="text-center p-2 space-y-1 transition-transform duration-300 group-hover/upload:scale-110">
                                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-indigo-500">
                                            <Upload className="w-4 h-4" />
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-500">{t('builder.selectLogo') as string}</p>
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className={cn(
                                    "absolute inset-0 flex items-center justify-center transition-all duration-300 bg-black/5 backdrop-blur-[1px]",
                                    logoUrl ? "opacity-0 group-hover/upload:opacity-100" : "opacity-0 pointer-events-none"
                                )}>
                                    <span className="text-[8px] font-bold bg-white px-2 py-1 rounded-full shadow-lg text-slate-800 transform translate-y-2 group-hover/upload:translate-y-0 transition-transform">
                                        {t('builder.changeLogo2') as string}
                                    </span>
                                </div>
                            </div>
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                        </div>

                        {/* Logo Controls: Position, Size, Title Alignment */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider ml-0.5">{t('builder.logoPosition') as string}</Label>
                                <Select value={logoPosition || 'none'} onValueChange={(v) => onLogoPositionChange?.(v as NonNullable<Catalog['logo_position']>)}>
                                    <SelectTrigger className="h-9 rounded-xl bg-white border-slate-200 text-[11px] font-semibold focus:ring-2 focus:ring-indigo-100 transition-shadow hover:border-indigo-300 px-2.5">
                                        <SelectValue placeholder={t('builder.selectPlaceholder') as string} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                        <SelectItem value="none">{t('builder.hideLabel') as string}</SelectItem>
                                        <SelectItem value="header-left">{t('builder.posTopLeft') as string}</SelectItem>
                                        <SelectItem value="header-center">{t('builder.posTopCenter') as string}</SelectItem>
                                        <SelectItem value="header-right">{t('builder.posTopRight') as string}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider ml-0.5">{t('builder.logoSizeLabel') as string}</Label>
                                <Select value={logoSize || 'medium'} onValueChange={(v) => onLogoSizeChange?.(v as NonNullable<Catalog['logo_size']>)}>
                                    <SelectTrigger className="h-9 rounded-xl bg-white border-slate-200 text-[11px] font-semibold focus:ring-2 focus:ring-indigo-100 transition-shadow hover:border-indigo-300 px-2.5">
                                        <SelectValue placeholder={t('builder.selectPlaceholder') as string} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                        <SelectItem value="small">{t('builder.sizeSmall') as string}</SelectItem>
                                        <SelectItem value="medium">{t('builder.sizeMedium') as string}</SelectItem>
                                        <SelectItem value="large">{t('builder.sizeLarge') as string}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider ml-0.5">{t('builder.titleAlignment') as string}</Label>
                                <Select value={titlePosition || 'left'} onValueChange={(v) => onTitlePositionChange?.(v as NonNullable<Catalog['title_position']>)}>
                                    <SelectTrigger className="h-9 rounded-xl bg-white border-slate-200 text-[11px] font-semibold focus:ring-2 focus:ring-indigo-100 transition-shadow hover:border-indigo-300 px-2.5">
                                        <SelectValue placeholder={t('builder.selectPlaceholder') as string} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                        <SelectItem value="left">{t('builder.alignLeft') as string}</SelectItem>
                                        <SelectItem value="center">{t('builder.alignCenter') as string}</SelectItem>
                                        <SelectItem value="right">{t('builder.alignRight') as string}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Color Pickers - Clean Inline */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-0.5">{t('builder.colorTheme') as string}</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Primary Color */}
                            <div className="relative" ref={primaryColorPickerRef}>
                                <div
                                    onClick={() => setShowPrimaryColorPicker(!showPrimaryColorPicker)}
                                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all duration-200"
                                >
                                    <div
                                        className="w-9 h-9 rounded-lg shadow-sm ring-1 ring-black/5 shrink-0"
                                        style={{ backgroundColor: primaryColor }}
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-bold text-slate-700 truncate">{t('builder.headerCard') as string}</span>
                                        <span className="text-[10px] font-mono text-slate-400 truncate tracking-tight">{primaryColorParsed.hexColor}</span>
                                    </div>
                                </div>
                                {showPrimaryColorPicker && (
                                    <div className="absolute bottom-full left-0 mb-2 z-50 animate-in zoom-in-95 duration-200">
                                        <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 w-[220px]">
                                            <HexColorPicker
                                                color={primaryColorParsed.hexColor}
                                                onChange={(hex) => {
                                                    const r = parseInt(hex.substring(1, 3), 16), g = parseInt(hex.substring(3, 5), 16), b = parseInt(hex.substring(5, 7), 16)
                                                    debouncedPrimaryColorChange(`rgba(${r}, ${g}, ${b}, ${primaryColorParsed.rgb.a})`)
                                                }}
                                                style={{ width: '100%', height: '160px' }}
                                            />
                                            {/* Hex Input */}
                                            <div className="mt-3 flex items-center gap-2">
                                                <div
                                                    className="w-8 h-8 rounded-lg ring-1 ring-black/10 shrink-0"
                                                    style={{ backgroundColor: primaryColor }}
                                                />
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono">#</span>
                                                    <input
                                                        type="text"
                                                        value={primaryColorParsed.hexColor.replace('#', '').toUpperCase()}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)
                                                            if (val.length === 6) {
                                                                const hex = `#${val}`
                                                                const r = parseInt(val.substring(0, 2), 16), g = parseInt(val.substring(2, 4), 16), b = parseInt(val.substring(4, 6), 16)
                                                                debouncedPrimaryColorChange(`rgba(${r}, ${g}, ${b}, ${primaryColorParsed.rgb.a})`)
                                                            }
                                                        }}
                                                        className="w-full h-8 pl-7 pr-2 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-mono font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 uppercase"
                                                        maxLength={6}
                                                        spellCheck={false}
                                                    />
                                                </div>
                                            </div>
                                            {/* Preset Colors */}
                                            <div className="mt-3 flex gap-1.5 flex-wrap">
                                                {['#1e40af', '#4f46e5', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#0891b2', '#334155', '#000000'].map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        className={cn(
                                                            "w-5 h-5 rounded-md ring-1 ring-black/10 hover:scale-125 transition-all duration-150 cursor-pointer",
                                                            primaryColorParsed.hexColor.toLowerCase() === color && "ring-2 ring-indigo-500 ring-offset-1"
                                                        )}
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => {
                                                            const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16)
                                                            onPrimaryColorChange(`rgba(${r}, ${g}, ${b}, 1)`)
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Text Color */}
                            <div className="relative" ref={headerTextColorPickerRef}>
                                <div
                                    onClick={() => setShowHeaderTextColorPicker(!showHeaderTextColorPicker)}
                                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all duration-200"
                                >
                                    <div
                                        className="w-9 h-9 rounded-lg shadow-sm ring-1 ring-slate-200 shrink-0"
                                        style={{ backgroundColor: headerTextColor || '#ffffff' }}
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-bold text-slate-700 truncate">{t('builder.textColor') as string}</span>
                                        <span className="text-[10px] font-mono text-slate-400 truncate tracking-tight">{(headerTextColor || '#FFFFFF').toUpperCase()}</span>
                                    </div>
                                </div>
                                {showHeaderTextColorPicker && (
                                    <div className="absolute bottom-full right-0 mb-2 z-50 animate-in zoom-in-95 duration-200">
                                        <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 w-[220px]">
                                            <HexColorPicker
                                                color={headerTextColor || '#ffffff'}
                                                onChange={(hex) => debouncedHeaderTextColorChange(hex)}
                                                style={{ width: '100%', height: '160px' }}
                                            />
                                            {/* Hex Input */}
                                            <div className="mt-3 flex items-center gap-2">
                                                <div
                                                    className="w-8 h-8 rounded-lg ring-1 ring-black/10 shrink-0"
                                                    style={{ backgroundColor: headerTextColor || '#ffffff' }}
                                                />
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono">#</span>
                                                    <input
                                                        type="text"
                                                        value={(headerTextColor || '#FFFFFF').replace('#', '').toUpperCase()}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)
                                                            if (val.length === 6) {
                                                                debouncedHeaderTextColorChange(`#${val}`)
                                                            }
                                                        }}
                                                        className="w-full h-8 pl-7 pr-2 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-mono font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 uppercase"
                                                        maxLength={6}
                                                        spellCheck={false}
                                                    />
                                                </div>
                                            </div>
                                            {/* Preset Colors - simpler for text (white/black focus) */}
                                            <div className="mt-3 flex gap-1.5 flex-wrap">
                                                {['#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8', '#475569', '#1e293b', '#0f172a', '#000000', '#fef3c7', '#fee2e2', '#dbeafe', '#dcfce7'].map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        className={cn(
                                                            "w-5 h-5 rounded-md ring-1 ring-black/10 hover:scale-125 transition-all duration-150 cursor-pointer",
                                                            (headerTextColor || '#ffffff').toLowerCase() === color && "ring-2 ring-indigo-500 ring-offset-1"
                                                        )}
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => debouncedHeaderTextColorChange(color)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
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
