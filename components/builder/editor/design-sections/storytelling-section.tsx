import { Sparkles, Upload, Trash2, Image as ImageIcon, Layout, GripVertical } from "lucide-react"
import NextImage from "next/image"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { COVER_THEMES } from "@/components/catalogs/covers"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { StorytellingSectionProps } from "./types"
import { SectionWrapper } from "./section-wrapper"

export function StorytellingSection({
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
    categoryOrder,
    onCategoryOrderChange,
    products,
    handleFileUpload,
    coverInputRef,
}: StorytellingSectionProps) {
    const { t } = useTranslation()
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
    const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null)

    // Eşsiz kategorileri alıyoruz
    const uniqueCategories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category || 'Kategorisiz'))) as string[]

        // Mevcut categoryOrder'a göre sırala, sıralamada olmayanları sona ekle
        if (categoryOrder && categoryOrder.length > 0) {
            const orderIndex = new Map<string, number>()
            for (let i = 0; i < categoryOrder.length; i++) orderIndex.set(categoryOrder[i], i)
            cats.sort((a, b) => {
                const idxA = orderIndex.get(a) ?? -1
                const idxB = orderIndex.get(b) ?? -1
                if (idxA === -1 && idxB === -1) return 0
                if (idxA === -1) return 1
                if (idxB === -1) return -1
                return idxA - idxB
            })
        }
        return cats
    }, [products, categoryOrder])

    // Sürükle-bırak işlemleri
    const handleDragStart = (idx: number) => {
        setDraggedIdx(idx)
    }

    // PERF(P5): Only track visual drop target — no state/callback spam per frame
    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault()
        if (draggedIdx === null || draggedIdx === idx) return
        setDropTargetIdx(idx)
    }

    const handleDrop = (e: React.DragEvent, idx: number) => {
        e.preventDefault()
        if (draggedIdx === null || draggedIdx === idx) return

        const newOrder = [...uniqueCategories]
        const draggedItem = newOrder[draggedIdx]
        newOrder.splice(draggedIdx, 1)
        newOrder.splice(idx, 0, draggedItem)

        if (onCategoryOrderChange) {
            onCategoryOrderChange(newOrder)
        }
        setDraggedIdx(null)
        setDropTargetIdx(null)
    }

    const handleDragEnd = () => {
        setDraggedIdx(null)
        setDropTargetIdx(null)
    }

    const moveCategory = (idx: number, direction: -1 | 1) => {
        const targetIdx = idx + direction
        if (targetIdx < 0 || targetIdx >= uniqueCategories.length) return
        const newOrder = [...uniqueCategories]
        const [moved] = newOrder.splice(idx, 1)
        newOrder.splice(targetIdx, 0, moved)
        onCategoryOrderChange?.(newOrder)
    }
    return (
        <SectionWrapper
            id="storytelling"
            title={t('builder.storyCatalog') as string}
            icon={<Sparkles className="w-4 h-4" />}
            iconBg="bg-accent text-primary"
            isOpen={!!openSections.storytelling}
            onToggle={() => toggleSection('storytelling')}
        >
            <Card className={cn(
                "bg-background/80",
                "border-border/50 shadow-sm rounded-[2rem] overflow-hidden"
            )}>
                <CardContent className="p-6 space-y-6">
                    {/* Cover Page Toggle */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className={cn(
                                    "text-[11px] font-bold uppercase",
                                    "text-foreground tracking-wide"
                                )}>
                                    {t('builder.coverPage') as string}
                                </Label>
                                <p className="text-[10px] text-muted-foreground">{t('builder.coverPageDesc') as string}</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={enableCoverPage}
                                aria-label={t('builder.coverPage') as string}
                                onClick={() => onEnableCoverPageChange?.(!enableCoverPage)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 shrink-0",
                                    "cursor-pointer rounded-full border-2 border-transparent",
                                    "transition-colors duration-200 ease-in-out",
                                    enableCoverPage ? "bg-primary" : "bg-accent"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block h-5 w-5 transform",
                                        "rounded-full bg-card shadow ring-0",
                                        "transition duration-200 ease-in-out",
                                        enableCoverPage ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>

                        {/* Cover Page Options */}
                        {enableCoverPage && (
                            <div className={cn(
                                "space-y-4 pt-4 border-t border-border",
                                "animate-in fade-in",
                                "slide-in-from-top-2 duration-500"
                            )}>
                                {/* Theme Selector */}
                                <div className="space-y-3">
                                    <Label className={cn(
                                        "text-[11px] font-bold uppercase",
                                        "text-muted-foreground tracking-[0.1em] pl-1"
                                    )}>
                                        {t('builder.coverDesign') as string}
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(COVER_THEMES).map(([key, theme]) => {
                                            const isSelected = coverTheme === key || (!coverTheme && key === 'modern');
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    aria-pressed={isSelected}
                                                    aria-label={t(`coverThemes.${key}`) as string || theme.name}
                                                    onClick={() => onCoverThemeChange?.(key)}
                                                    className={cn(
                                                        "flex items-center gap-2.5 px-3 py-2.5",
                                                        "rounded-2xl border transition-all duration-300",
                                                        "group relative overflow-hidden",
                                                        isSelected
                                                            ? "border-primary bg-accent/40 shadow-sm shadow-black/10"
                                                            : cn(
                                                                "border-border",
                                                                "bg-background/50",
                                                                "hover:border-border"
                                                            )
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-lg flex items-center",
                                                        "justify-center shrink-0 transition-all duration-300",
                                                        isSelected
                                                            ? cn(
                                                                "bg-primary text-primary-foreground",
                                                                "shadow-md shadow-black/10 scale-110"
                                                            )
                                                            : cn(
                                                                "bg-muted",
                                                                "text-muted-foreground group-hover:bg-accent",
                                                                ""
                                                            )
                                                    )}>
                                                        <Layout className="w-3 h-3" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn(
                                                            "text-[10px] font-bold truncate",
                                                            "leading-tight transition-colors",
                                                            isSelected
                                                                ? "text-primary"
                                                                : "text-foreground"
                                                        )}>
                                                            {t(`coverThemes.${key}`) || theme.name}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute right-0 top-0 h-full w-1 bg-primary" />
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
                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('builder.coverImage') as string}</Label>
                                        </div>
                                        <div className="space-y-3">
                                            {coverImageUrl ? (
                                                <div className={cn(
                                                    "group relative w-full h-48 rounded-3xl overflow-hidden",
                                                    "border-2 border-border",
                                                    "shadow-sm bg-muted/50",
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
                                                                "h-8 rounded-xl bg-background/20 backdrop-blur-md",
                                                                "hover:bg-background/40 text-white border-white/20",
                                                                "text-[10px] font-bold uppercase transition-all"
                                                            )}
                                                        >
                                                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                                                            {t('builder.changeBtn') as string}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => onCoverImageUrlChange?.(null)}
                                                            className={cn(
                                                                "h-8 rounded-xl bg-destructive/80 backdrop-blur-md",
                                                                "hover:bg-destructive/90 text-white border-none",
                                                                "text-[10px] font-bold uppercase transition-all"
                                                            )}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                                            {t('builder.removeBtn') as string}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => coverInputRef.current?.click()}
                                                    className={cn(
                                                        "w-full h-32 rounded-3xl border-2 border-dashed",
                                                        "border-border",
                                                        "bg-muted/50",
                                                        "hover:bg-muted/50",
                                                        "hover:border-border",
                                                        "transition-all duration-300",
                                                        "flex items-center justify-center gap-4 group"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl bg-card",
                                                        "shadow-sm border border-border",
                                                        "flex items-center justify-center",
                                                        "group-hover:scale-110 group-hover:bg-accent",
                                                        "transition-all duration-300"
                                                    )}>
                                                        <ImageIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className={cn(
                                                            "block text-[11px] font-bold uppercase",
                                                            "tracking-widest text-muted-foreground",
                                                            "group-hover:text-foreground"
                                                        )}>
                                                            {t('builder.selectImage') as string}
                                                        </span>
                                                        <span className="block text-[9px] text-muted-foreground font-bold mt-0.5">PNG, JPG, WEBP</span>
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
                                            "text-[10px] font-bold uppercase",
                                            "text-muted-foreground tracking-widest px-1"
                                        )}>
                                            {t('builder.coverDesc') as string}
                                        </Label>
                                        <div className="flex-1 relative">
                                            <textarea
                                                value={coverDescription || ''}
                                                onChange={(e) => onCoverDescriptionChange?.(e.target.value || null)}
                                                placeholder={t('builder.coverDescPlaceholder') as string}
                                                maxLength={500}
                                                className={cn(
                                                    "w-full h-full min-h-[128px] p-4 text-sm",
                                                    "bg-card",
                                                    "border border-border",
                                                    "rounded-3xl focus:ring-2 focus:ring-primary/20",
                                                    "focus:border-primary transition-all",
                                                    "outline-none resize-none"
                                                )}
                                            />
                                            <p className={cn(
                                                "absolute bottom-3 right-3 text-[9px] text-muted-foreground",
                                                "pointer-events-none bg-background/50 px-1 rounded"
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
                    <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className={cn(
                                    "text-[11px] font-bold uppercase",
                                    "text-foreground tracking-wide"
                                )}>
                                    {t('builder.categoryDividers') as string}
                                </Label>
                                <p className="text-[10px] text-muted-foreground">{t('builder.categoryDividersDesc') as string}</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={enableCategoryDividers}
                                aria-label={t('builder.categoryDividers') as string}
                                onClick={() => onEnableCategoryDividersChange?.(!enableCategoryDividers)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 shrink-0",
                                    "cursor-pointer rounded-full border-2 border-transparent",
                                    "transition-colors duration-200 ease-in-out",
                                    enableCategoryDividers ? "bg-primary" : "bg-accent"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block h-5 w-5 transform",
                                        "rounded-full bg-card shadow ring-0",
                                        "transition duration-200 ease-in-out",
                                        enableCategoryDividers ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>

                        {enableCategoryDividers && uniqueCategories.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1 block mb-3">
                                    {t('builder.categoryOrder') as string}
                                </Label>
                                <div className="space-y-1.5">
                                    {uniqueCategories.map((category, idx) => (
                                        <div
                                            key={category}
                                            draggable
                                            onDragStart={() => handleDragStart(idx)}
                                            onDragOver={(e) => handleDragOver(e, idx)}
                                            onDrop={(e) => handleDrop(e, idx)}
                                            onDragEnd={handleDragEnd}
                                            role="listitem"
                                            tabIndex={0}
                                            aria-label={`${category}. ${t('builder.keyboardReorder') as string}`}
                                            onKeyDown={(event) => {
                                                if (event.key === 'ArrowUp') {
                                                    event.preventDefault()
                                                    moveCategory(idx, -1)
                                                } else if (event.key === 'ArrowDown') {
                                                    event.preventDefault()
                                                    moveCategory(idx, 1)
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl cursor-grab active:cursor-grabbing border border-transparent transition-all",
                                                draggedIdx === idx ? "opacity-50 border-primary scale-[0.98]" : dropTargetIdx === idx ? "border-border bg-accent/50" : "hover:border-border hover:shadow-sm"
                                            )}
                                        >
                                            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <span className="text-xs font-semibold text-foreground truncate">
                                                {category}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </SectionWrapper >
    )
}
