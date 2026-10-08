import { Sparkles, Layout } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { AppearanceSectionProps } from "./types"
import { SectionWrapper } from "./section-wrapper"

export function AppearanceSection({
    t,
    openSections,
    toggleSection,
    layout,
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
}: AppearanceSectionProps) {
    return (
        <SectionWrapper
            id="appearance"
            title={t('builder.designSettings')}
            icon={<Layout className="w-4 h-4" />}
            iconBg="bg-accent text-primary"
            isOpen={!!openSections.appearance}
            onToggle={() => toggleSection('appearance')}
        >
            <Card className="bg-background/80 border-border/50 shadow-sm rounded-[1.5rem] overflow-hidden">
                <CardContent className="p-5 space-y-6">
                    {/* Premium Toggles List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                            { label: t('builder.showPrices'), value: showPrices, onChange: onShowPricesChange, icon: <Sparkles className="w-3.5 h-3.5" /> },
                            { label: t('builder.showDescriptions'), value: showDescriptions, onChange: onShowDescriptionsChange },
                            { label: t('builder.showAttributes'), value: showAttributes, onChange: onShowAttributesChange, disabled: layout === 'magazine' },
                            { label: t('builder.showSku'), value: showSku, onChange: onShowSkuChange },
                            { label: t('builder.showUrls'), value: showUrls, onChange: onShowUrlsChange },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                role="switch"
                                tabIndex={item.disabled ? -1 : 0}
                                aria-checked={!!item.value}
                                aria-label={item.label as string}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-2xl transition-all duration-300 border border-border/50",
                                    item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-card hover:shadow-sm group",
                                    item.label === t('builder.showUrls') && "col-span-2 sm:col-span-1"
                                )}
                                onClick={() => !item.disabled && item.onChange?.(!item.value)}
                                onKeyDown={(e) => { if (!item.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); item.onChange?.(!item.value) } }}
                            >
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-tight transition-colors leading-tight",
                                        item.disabled ? "text-muted-foreground" : "text-muted-foreground"
                                    )}>
                                        {item.label as string}
                                    </span>
                                    {item.disabled && <span className="text-[8px] font-medium italic opacity-60">{t('builder.notInMagazine')}</span>}
                                </div>
                                <div className={cn(
                                    "w-9 h-[18px] rounded-full relative transition-all duration-500 shrink-0",
                                    item.value && !item.disabled ? "bg-primary shadow-sm" : "bg-accent"
                                )}>
                                    <div className={cn(
                                        "absolute top-0.5 left-0.5 w-[14px] h-[14px] rounded-full bg-card transition-all duration-500 shadow-sm",
                                        item.value && !item.disabled && "translate-x-[18px]"
                                    )} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Product Image & Layout Settings Grid */}
                    <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Image Alignment Pill */}
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground block tracking-widest text-center">{(t('builder.productImages') || "Ürün Fotoğrafları") as string}</Label>
                            <div className="flex bg-muted/80 p-1 rounded-2xl gap-1">
                                {[
                                    { value: 'cover' as const, label: t('builder.productImageFit.crop') },
                                    { value: 'contain' as const, label: t('builder.productImageFit.fit') },
                                    { value: 'fill' as const, label: t('builder.productImageFit.fill') }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => onProductImageFitChange?.(option.value)}
                                        className={cn(
                                            "flex-1 py-1.5 text-[9px] font-bold uppercase rounded-xl transition-all duration-300",
                                            productImageFit === option.value
                                                ? "bg-card text-primary shadow-md scale-[1.02]"
                                                : "text-muted-foreground hover:text-foreground"
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
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground block tracking-widest text-center">{t('builder.layoutView')}</Label>
                                <div className="flex bg-muted/80 p-1 rounded-2xl gap-1">
                                    {availableColumns.map((num: number) => (
                                        <button
                                            key={num}
                                            onClick={() => onColumnsPerRowChange?.(num)}
                                            className={cn(
                                                "flex-1 py-1.5 text-[9px] font-bold uppercase rounded-xl transition-all duration-300",
                                                columnsPerRow === num
                                                    ? "bg-card text-primary shadow-md scale-[1.02]"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {num} {t('builder.column')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center text-[10px] text-muted-foreground font-bold italic pt-4 leading-tight text-center">
                                {t('builder.layoutFixed')}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </SectionWrapper>
    )
}
