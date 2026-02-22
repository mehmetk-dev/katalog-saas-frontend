import { Image as ImageIcon } from "lucide-react"
import NextImage from "next/image"
import { HexColorPicker } from "react-colorful"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Catalog } from "@/lib/actions/catalogs"
import type { BackgroundSectionProps } from "./types"
import { SectionWrapper } from "./section-wrapper"

export function BackgroundSection({
    t,
    openSections,
    toggleSection,
    backgroundColor,
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
    handleUploadClick,
    bgInputRef,
    handleFileUpload,
}: BackgroundSectionProps) {
    return (
        <SectionWrapper
            id="background"
            title={t('builder.backgroundSettings') as string}
            icon={<ImageIcon className="w-4 h-4" />}
            iconBg="bg-blue-50 dark:bg-blue-900/30 text-blue-600"
            isOpen={!!openSections.background}
            onToggle={() => toggleSection('background')}
        >
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
        </SectionWrapper>
    )
}
