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
            iconBg="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
            isOpen={!!openSections.appearance}
            onToggle={() => toggleSection('appearance')}
        >
            <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200/50 shadow-sm rounded-[1.5rem] overflow-hidden">
                <CardContent className="p-5 space-y-6">
                    {/* Premium Toggles List */}
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
        </SectionWrapper>
    )
}
