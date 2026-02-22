import { Sparkles, Upload, Trash2, Image as ImageIcon, Layout } from "lucide-react"
import NextImage from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { COVER_THEMES } from "@/components/catalogs/covers"
import type { StorytellingSectionProps } from "./types"
import { SectionWrapper } from "./section-wrapper"

export function StorytellingSection({
    t,
    openSections,
    toggleSection,
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

    handleFileUpload,
    coverInputRef,
}: StorytellingSectionProps) {
    return (
        <SectionWrapper
            id="storytelling"
            title="Hikaye Kataloğu"
            icon={<Sparkles className="w-4 h-4" />}
            iconBg="bg-violet-50 dark:bg-violet-900/30 text-violet-600"
            isOpen={!!openSections.storytelling}
            onToggle={() => toggleSection('storytelling')}
        >
            <Card className={cn(
                "bg-white/80 dark:bg-slate-900/40",
                "border-slate-200/50 shadow-sm rounded-[2rem] overflow-hidden"
            )}>
                <CardContent className="p-6 space-y-6">
                    {/* Cover Page Toggle */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className={cn(
                                    "text-[11px] font-black uppercase",
                                    "text-slate-700 dark:text-slate-300 tracking-wide"
                                )}>
                                    Kapak Sayfası
                                </Label>
                                <p className="text-[10px] text-slate-500">Katalogda profesyonel bir kapak sayfası göster</p>
                            </div>
                            <button
                                onClick={() => onEnableCoverPageChange?.(!enableCoverPage)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 shrink-0",
                                    "cursor-pointer rounded-full border-2 border-transparent",
                                    "transition-colors duration-200 ease-in-out",
                                    enableCoverPage ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block h-5 w-5 transform",
                                        "rounded-full bg-white shadow ring-0",
                                        "transition duration-200 ease-in-out",
                                        enableCoverPage ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>

                        {/* Cover Page Options */}
                        {enableCoverPage && (
                            <div className={cn(
                                "space-y-4 pt-4 border-t border-slate-100",
                                "dark:border-slate-800 animate-in fade-in",
                                "slide-in-from-top-2 duration-500"
                            )}>
                                {/* Theme Selector */}
                                <div className="space-y-3">
                                    <Label className={cn(
                                        "text-[11px] font-black uppercase",
                                        "text-slate-500 tracking-[0.1em] pl-1"
                                    )}>
                                        Kapak Tasarımı
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(COVER_THEMES).map(([key, theme]) => {
                                            const isSelected = coverTheme === key || (!coverTheme && key === 'modern');
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => onCoverThemeChange?.(key)}
                                                    className={cn(
                                                        "flex items-center gap-2.5 px-3 py-2.5",
                                                        "rounded-2xl border transition-all duration-300",
                                                        "group relative overflow-hidden",
                                                        isSelected
                                                            ? "border-indigo-600 bg-indigo-50/40 shadow-sm shadow-indigo-100"
                                                            : cn(
                                                                "border-slate-100 dark:border-slate-800",
                                                                "bg-white/50 dark:bg-slate-900/50",
                                                                "hover:border-slate-300 dark:hover:border-slate-600"
                                                            )
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-lg flex items-center",
                                                        "justify-center shrink-0 transition-all duration-300",
                                                        isSelected
                                                            ? cn(
                                                                "bg-indigo-600 text-white",
                                                                "shadow-md shadow-indigo-200 scale-110"
                                                            )
                                                            : cn(
                                                                "bg-slate-100 dark:bg-slate-800",
                                                                "text-slate-400 group-hover:bg-slate-200",
                                                                "dark:group-hover:bg-slate-700"
                                                            )
                                                    )}>
                                                        <Layout className="w-3 h-3" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn(
                                                            "text-[10px] font-bold truncate",
                                                            "leading-tight transition-colors",
                                                            isSelected
                                                                ? "text-indigo-700 dark:text-indigo-400"
                                                                : "text-slate-700 dark:text-slate-300"
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Cover Image Upload */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kapak Görseli</Label>
                                        </div>
                                        <div className="space-y-3">
                                            {coverImageUrl ? (
                                                <div className={cn(
                                                    "group relative w-full h-48 rounded-3xl overflow-hidden",
                                                    "border-2 border-slate-100 dark:border-slate-800",
                                                    "shadow-sm bg-slate-50 dark:bg-slate-900/50",
                                                    "transition-all duration-300 hover:shadow-md"
                                                )}>
                                                    <NextImage
                                                        src={coverImageUrl}
                                                        alt="Cover"
                                                        fill
                                                        className={cn(
                                                            "object-contain transition-transform",
                                                            "duration-500 group-hover:scale-105"
                                                        )}
                                                        unoptimized
                                                    />
                                                    <div className={cn(
                                                        "absolute inset-0 bg-black/40",
                                                        "opacity-0 group-hover:opacity-100",
                                                        "transition-opacity duration-300",
                                                        "flex items-center justify-center gap-2"
                                                    )}>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => coverInputRef.current?.click()}
                                                            className={cn(
                                                                "h-8 rounded-xl bg-white/20 backdrop-blur-md",
                                                                "hover:bg-white/40 text-white border-white/20",
                                                                "text-[10px] font-bold uppercase transition-all"
                                                            )}
                                                        >
                                                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                                                            Değiştir
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => onCoverImageUrlChange?.(null)}
                                                            className={cn(
                                                                "h-8 rounded-xl bg-red-500/80 backdrop-blur-md",
                                                                "hover:bg-red-600 text-white border-none",
                                                                "text-[10px] font-bold uppercase transition-all"
                                                            )}
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
                                                    className={cn(
                                                        "w-full h-32 rounded-3xl border-2 border-dashed",
                                                        "border-slate-200 dark:border-slate-800",
                                                        "bg-slate-50/50 dark:bg-slate-900/30",
                                                        "hover:bg-slate-50 dark:hover:bg-slate-900/50",
                                                        "hover:border-indigo-300 dark:hover:border-indigo-900",
                                                        "transition-all duration-300",
                                                        "flex items-center justify-center gap-4 group"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl bg-white dark:bg-slate-800",
                                                        "shadow-sm border border-slate-100 dark:border-slate-700",
                                                        "flex items-center justify-center",
                                                        "group-hover:scale-110 group-hover:bg-indigo-50",
                                                        "transition-all duration-300"
                                                    )}>
                                                        <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className={cn(
                                                            "block text-[11px] font-black uppercase",
                                                            "tracking-widest text-slate-500",
                                                            "group-hover:text-slate-700"
                                                        )}>
                                                            Görsel Seç
                                                        </span>
                                                        <span className="block text-[9px] text-slate-400 font-bold mt-0.5">PNG, JPG, WEBP</span>
                                                    </div>
                                                </button>
                                            )}
                                            <input
                                                type="file"
                                                ref={coverInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, 'cover')}
                                            />
                                        </div>
                                    </div>

                                    {/* Cover Description */}
                                    <div className="space-y-2 h-full flex flex-col">
                                        <Label className={cn(
                                            "text-[10px] font-black uppercase",
                                            "text-slate-500 tracking-widest px-1"
                                        )}>
                                            Kapak Açıklaması
                                        </Label>
                                        <div className="flex-1 relative">
                                            <textarea
                                                value={coverDescription || ''}
                                                onChange={(e) => onCoverDescriptionChange?.(e.target.value || null)}
                                                placeholder="Katalog hakkında kısa bir açıklama..."
                                                maxLength={500}
                                                className={cn(
                                                    "w-full h-full min-h-[128px] p-4 text-sm",
                                                    "bg-white dark:bg-slate-900",
                                                    "border border-slate-200 dark:border-slate-800",
                                                    "rounded-3xl focus:ring-2 focus:ring-indigo-500/20",
                                                    "focus:border-indigo-500 transition-all",
                                                    "outline-none resize-none"
                                                )}
                                            />
                                            <p className={cn(
                                                "absolute bottom-3 right-3 text-[9px] text-slate-400",
                                                "pointer-events-none bg-white/50 px-1 rounded"
                                            )}>
                                                {(coverDescription || '').length}/500
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>



                    {/* Category Dividers Toggle */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className={cn(
                                    "text-[11px] font-black uppercase",
                                    "text-slate-700 dark:text-slate-300 tracking-wide"
                                )}>
                                    Kategori Geçiş Sayfaları
                                </Label>
                                <p className="text-[10px] text-slate-500">Kategoriler arası geçişlerde görsel ayraç sayfaları göster</p>
                            </div>
                            <button
                                onClick={() => onEnableCategoryDividersChange?.(!enableCategoryDividers)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 shrink-0",
                                    "cursor-pointer rounded-full border-2 border-transparent",
                                    "transition-colors duration-200 ease-in-out",
                                    enableCategoryDividers ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block h-5 w-5 transform",
                                        "rounded-full bg-white shadow ring-0",
                                        "transition duration-200 ease-in-out",
                                        enableCategoryDividers ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </SectionWrapper >
    )
}
