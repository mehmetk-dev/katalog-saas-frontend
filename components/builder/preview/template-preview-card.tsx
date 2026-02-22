"use client"

import React from "react"
import { CheckSquare } from "lucide-react"

import { cn } from "@/lib/utils"
import { CatalogPreview } from "./catalog-preview"
import { getPreviewProductsByLayout } from "@/components/templates/preview-data"
import { ResponsiveContainer } from "@/components/ui/responsive-container"

interface TemplatePreviewCardProps {
    templateId: string
    templateName: string
    isPro: boolean
    isSelected: boolean
    onSelect: () => void
}

// Statik preview değerleri - template seçiminde kullanıcı ayarlarını göstermeye gerek yok
const STATIC_PREVIEW_PROPS = {
    primaryColor: '#4f46e5',
    headerTextColor: '#ffffff',
    showPrices: true,
    showDescriptions: true,
    showAttributes: true,
    showSku: true,
    showUrls: true,
    productImageFit: 'cover' as const,
    backgroundColor: '#ffffff',
    backgroundImage: undefined,
    backgroundImageFit: 'cover' as const,
    backgroundGradient: undefined,
    logoUrl: undefined,
    logoPosition: 'header-left' as const,
    logoSize: 'medium' as const,
    titlePosition: 'left' as const,
    enableCoverPage: false,
    coverImageUrl: undefined,
    coverDescription: undefined,
    enableCategoryDividers: false,
    showControls: false,
}

// Template preview kartını tamamen memoize et - sadece isSelected değiştiğinde güncelle
export const TemplatePreviewCard = React.memo(function TemplatePreviewCard({
    templateId,
    templateName,
    isPro,
    isSelected,
    onSelect,
}: TemplatePreviewCardProps) {
    // Ürün verilerini bir kez al
    const products = React.useMemo(
        () => getPreviewProductsByLayout(templateId),
        [templateId]
    )

    return (
        <div
            onClick={onSelect}
            className={cn(
                "group relative aspect-[3/4.5] rounded-none transition-all duration-500 cursor-pointer overflow-hidden bg-white",
                isSelected
                    ? "ring-8 ring-indigo-600 ring-offset-0 scale-95 shadow-2xl"
                    : "shadow-lg border border-slate-200 hover:shadow-2xl hover:scale-[1.02]"
            )}
        >
            {/* Preview Container - Takes most of the space */}
            <div className="absolute inset-0 pb-14">
                <div className="w-full h-full catalog-light pointer-events-none">
                    <ResponsiveContainer>
                        <CatalogPreview
                            layout={templateId}
                            catalogName={templateName}
                            products={products}
                            {...STATIC_PREVIEW_PROPS}
                        />
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Clean Bottom Bar - High Contrast */}
            <div className={cn(
                "absolute inset-x-0 bottom-0 h-10 px-3 transition-all duration-300 z-20 flex items-center justify-between border-t",
                isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-100 text-slate-900 group-hover:bg-slate-50"
            )}>
                <p className="text-[9px] font-black uppercase tracking-tight truncate flex-1 leading-none">
                    {templateName}
                </p>
                {isPro && (
                    <span className={cn(
                        "ml-2 text-[9px] font-black px-1.5 py-1 rounded shadow-sm shrink-0 leading-none",
                        isSelected ? "bg-white text-indigo-600" : "bg-amber-400 text-slate-900"
                    )}>PRO</span>
                )}
            </div>

            {/* Selection Checkmark */}
            {isSelected && (
                <div className="absolute top-4 right-4 bg-white text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center shadow-xl z-30 animate-in zoom-in-50">
                    <CheckSquare className="w-5 h-5" />
                </div>
            )}
        </div>
    )
}, (prevProps, nextProps) => {
    // Sadece seçim durumu değişirse yeniden render et
    return prevProps.isSelected === nextProps.isSelected &&
        prevProps.templateId === nextProps.templateId
})
