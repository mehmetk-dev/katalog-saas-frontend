"use client"

import React, { useRef, useState, useEffect } from "react"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
    primaryColor: '#18181b',
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

// FIX: fashion-lookbook uses headerTextColor for ALL body text (not just header bar).
// With white backgroundColor, white headerTextColor = invisible. Override per-template.
const TEMPLATE_PREVIEW_OVERRIDES: Record<string, Partial<typeof STATIC_PREVIEW_PROPS>> = {
    'fashion-lookbook': { headerTextColor: '#1a1a1a' },
    'minimalist': { headerTextColor: '#1a1a1a' },
}

/** FIX(F8): Lazy-render template previews — only render CatalogPreview
 *  when the card is scrolled into the visible area (IntersectionObserver).
 *  Reduces initial render cost from 16× full preview → ~3-4× visible only. */
export const TemplatePreviewCard = React.memo(function TemplatePreviewCard({
    templateId,
    templateName,
    isPro,
    isSelected,
    onSelect,
}: TemplatePreviewCardProps) {
    const cardRef = useRef<HTMLButtonElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    // FIX(F8): IntersectionObserver — render preview only when card is in viewport
    useEffect(() => {
        const el = cardRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    // Once visible, stop observing — preview stays rendered
                    observer.unobserve(el)
                }
            },
            { rootMargin: '200px' } // Start rendering slightly before visible
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // Ürün verilerini bir kez al — only compute when visible
    const products = React.useMemo(
        () => isVisible ? getPreviewProductsByLayout(templateId) : [],
        [templateId, isVisible]
    )

    return (
        <button
            ref={cardRef}
            type="button"
            onClick={onSelect}
            aria-pressed={isSelected}
            aria-label={`${templateName}${isPro ? ' (PRO)' : ''}`}
            className="group flex min-w-0 flex-col gap-1.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className={cn(
                "relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-muted transition-shadow",
                isSelected ? "border-transparent ring-2 ring-primary ring-offset-2 ring-offset-background" : "group-hover:border-ring"
            )}>
                <div className="pointer-events-none h-full w-full">
                    {isVisible ? (
                        <ResponsiveContainer>
                            <CatalogPreview
                                layout={templateId}
                                catalogName={templateName}
                                products={products}
                                {...STATIC_PREVIEW_PROPS}
                                {...(TEMPLATE_PREVIEW_OVERRIDES[templateId] || {})}
                            />
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full animate-pulse bg-muted" />
                    )}
                </div>
                {isSelected && (
                    <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="size-3" strokeWidth={3} />
                    </span>
                )}
            </div>
            <div className="flex min-w-0 items-center gap-1.5 px-0.5">
                <span className="truncate text-xs font-medium text-foreground">{templateName}</span>
                {isPro && <Badge variant="warning" className="px-1 py-0 text-[10px] leading-4">PRO</Badge>}
            </div>
        </button>
    )
}, (prevProps, nextProps) => {
    // Sadece seçim durumu değişirse yeniden render et
    return prevProps.isSelected === nextProps.isSelected &&
        prevProps.templateId === nextProps.templateId &&
        prevProps.templateName === nextProps.templateName &&
        prevProps.isPro === nextProps.isPro &&
        prevProps.onSelect === nextProps.onSelect
})
