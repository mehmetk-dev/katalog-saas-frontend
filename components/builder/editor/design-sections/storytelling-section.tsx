import { BookOpen, Check, GripVertical } from "lucide-react"
import { useState, useMemo } from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { COVER_THEMES } from "@/components/catalogs/covers"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useDesignProps } from "./design-context"
import { Field, ImageField, SectionWrapper, ToggleRow } from "./section-wrapper"

export function StorytellingSection() {
    const {
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
    } = useDesignProps()
    const { t } = useTranslation()
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
    const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null)

    // Eşsiz kategorileri alıyoruz
    const uniqueCategories = useMemo(() => {
        // 'Kategorisiz' bir veri anahtarı (category_order'da saklanır; PDF export ve public
        // katalog da bunu kullanır) — çeviriyle değiştirilmemeli.
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
            icon={<BookOpen />}
            isOpen={!!openSections.storytelling}
            onToggle={() => toggleSection('storytelling')}
        >
            {/* Kapak sayfası */}
            <div className="space-y-4">
                <ToggleRow
                    label={t('builder.coverPage') as string}
                    description={t('builder.coverPageDesc') as string}
                    checked={enableCoverPage}
                    onCheckedChange={onEnableCoverPageChange}
                />

                {enableCoverPage && (
                    <div className="space-y-4 rounded-lg bg-muted/40 p-3">
                        <Field label={t('builder.coverDesign') as string}>
                            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                                {Object.entries(COVER_THEMES).map(([key, theme]) => {
                                    const isSelected = coverTheme === key || (!coverTheme && key === 'modern')
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            aria-pressed={isSelected}
                                            onClick={() => onCoverThemeChange?.(key)}
                                            className={cn(
                                                "flex h-9 items-center justify-between gap-2 rounded-md border bg-background px-2.5 text-left text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                                                isSelected ? "border-primary text-foreground" : "text-muted-foreground hover:border-ring hover:text-foreground"
                                            )}
                                        >
                                            <span className="truncate">{(t(`coverThemes.${key}`) as string) || theme.name}</span>
                                            {isSelected && <Check className="size-3.5 shrink-0" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <ImageField
                                label={t('builder.coverImage') as string}
                                imageUrl={coverImageUrl}
                                onPick={() => coverInputRef.current?.click()}
                                onRemove={onCoverImageUrlChange ? () => onCoverImageUrlChange(null) : undefined}
                                hint="PNG, JPG, WEBP"
                                pickLabel={t('builder.selectImage') as string}
                                changeLabel={t('builder.changeBtn') as string}
                                removeLabel={t('builder.removeBtn') as string}
                                previewClassName="h-32"
                            />
                            <input
                                type="file"
                                ref={coverInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'cover')}
                            />

                            <Field
                                label={t('builder.coverDesc') as string}
                                htmlFor="cover-description"
                                hint={<span className="tabular-nums">{(coverDescription || '').length}/500</span>}
                            >
                                <Textarea
                                    id="cover-description"
                                    value={coverDescription || ''}
                                    onChange={(e) => onCoverDescriptionChange?.(e.target.value || null)}
                                    placeholder={t('builder.coverDescPlaceholder') as string}
                                    maxLength={500}
                                    rows={5}
                                    className="resize-none bg-background"
                                />
                            </Field>
                        </div>
                    </div>
                )}
            </div>

            {/* Kategori ayraçları */}
            <div className="space-y-4 border-t pt-4">
                <ToggleRow
                    label={t('builder.categoryDividers') as string}
                    description={t('builder.categoryDividersDesc') as string}
                    checked={enableCategoryDividers}
                    onCheckedChange={onEnableCategoryDividersChange}
                />

                {enableCategoryDividers && uniqueCategories.length > 0 && (
                    <Field label={t('builder.categoryOrder') as string}>
                        <div role="list" className="divide-y overflow-hidden rounded-lg border">
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
                                        "flex h-10 cursor-grab items-center gap-2 bg-background px-2 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted active:cursor-grabbing",
                                        draggedIdx === idx && "opacity-40",
                                        dropTargetIdx === idx && "shadow-[inset_0_2px_0_0_var(--primary)]"
                                    )}
                                >
                                    <GripVertical className="size-4 shrink-0 text-muted-foreground/60" />
                                    <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">{idx + 1}</span>
                                    <span className="truncate text-sm text-foreground">{category}</span>
                                </div>
                            ))}
                        </div>
                    </Field>
                )}
            </div>
        </SectionWrapper>
    )
}
