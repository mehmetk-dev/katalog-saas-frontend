"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"

import { PageHero, SecondaryButton, SignupButton } from "@/components/marketing"
import { cn } from "@/lib/utils"
import type { TranslationFn } from "./types"

import { ALL_TEMPLATES } from "@/components/catalogs/templates/registry"
import { getPreviewProductsByLayout } from "@/components/templates/preview-data"

interface HeroSectionProps {
    t: TranslationFn
}

/** Önizlemede dönen gerçek katalog şablonları (katalog çıktısı kendi renklerini taşır) */
const CAROUSEL_SLIDES = [
    { key: "modern-grid", color: "#18181b" },
    { key: "classic-catalog", color: "#2b2b5f" },
    { key: "product-tiles", color: "#0f766e" },
    { key: "minimalist", color: "#171717" },
]

const TEMPLATE_WIDTH = 800
const TEMPLATE_HEIGHT = 1131
const SLIDE_INTERVAL_MS = 7000
const PAGE_GAP = 24

export const HeroSection = React.memo(function HeroSection({ t }: HeroSectionProps) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [layout, setLayout] = useState({ scale: 0, pages: 1 })
    const screenRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)
        }, SLIDE_INTERVAL_MS)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const node = screenRef.current
        if (!node) return
        const observer = new ResizeObserver(([entry]) => {
            if (!entry) return
            const { width, height } = entry.contentRect
            const pages = width >= 840 ? 3 : width >= 560 ? 2 : 1
            const byHeight = (height - PAGE_GAP * 2) / TEMPLATE_HEIGHT
            const byWidth = (width - PAGE_GAP * (pages + 1)) / (pages * TEMPLATE_WIDTH)
            setLayout({ scale: Math.min(byHeight, byWidth), pages })
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    // Aktif şablon ortada, yanında sıradaki şablonlar (geniş ekranda) tam sayfa görünür
    const visibleSlides = useMemo(
        () => Array.from({ length: layout.pages }, (_, offset) => CAROUSEL_SLIDES[(currentSlide + offset) % CAROUSEL_SLIDES.length]),
        [currentSlide, layout.pages],
    )

    return (
        <PageHero
            eyebrow={t("landing.badge")}
            title={t("landing.heroAlternativeTitle")}
            description={t("landing.heroSubtitle")}
            actions={
                <>
                    <SignupButton>{t("landing.heroStartCreating")}</SignupButton>
                    <SecondaryButton href="/create-demo">{t("header.demo")}</SecondaryButton>
                </>
            }
        >
            <p className="mt-4 text-sm text-muted-foreground">{t("landing.heroNote")}</p>

            {/* Gerçek şablonlarla canlı önizleme */}
            <div className="mt-12 w-full max-w-4xl sm:mt-16">
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex h-9 items-center gap-1.5 border-b border-border bg-muted/60 px-4" aria-hidden>
                        <span className="size-2.5 rounded-full bg-border" />
                        <span className="size-2.5 rounded-full bg-border" />
                        <span className="size-2.5 rounded-full bg-border" />
                        <span className="ml-3 h-5 w-48 max-w-[50%] rounded-md bg-background" />
                    </div>
                    <div ref={screenRef} className="relative h-[340px] overflow-hidden bg-muted sm:h-[460px]">
                        <div className="flex h-full items-center justify-center" style={{ gap: PAGE_GAP }}>
                            {layout.scale > 0
                                ? visibleSlides.map((slide, index) => (
                                    <TemplatePage
                                        key={`${slide.key}-${index}`}
                                        templateKey={slide.key}
                                        color={slide.color}
                                        name={t("landing.summerCollection")}
                                        scale={layout.scale}
                                    />
                                ))
                                : null}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-center gap-2">
                    {CAROUSEL_SLIDES.map((slide, idx) => (
                        <button
                            key={slide.key}
                            type="button"
                            onClick={() => setCurrentSlide(idx)}
                            className="flex size-6 items-center justify-center"
                            aria-label={`${t("landing.heroMockupCaption")} ${idx + 1}`}
                            aria-current={idx === currentSlide}
                        >
                            <span
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    idx === currentSlide ? "w-5 bg-foreground" : "w-1.5 bg-border",
                                )}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </PageHero>
    )
})

interface TemplatePageProps {
    templateKey: string
    color: string
    name: string
    scale: number
    className?: string
}

function TemplatePage({ templateKey, color, name, scale, className }: TemplatePageProps) {
    const Template = ALL_TEMPLATES[templateKey]
    const products = useMemo(() => getPreviewProductsByLayout(templateKey).slice(0, 8), [templateKey])
    if (!Template) return null

    return (
        <div
            className={cn("relative shrink-0 overflow-hidden rounded-sm shadow-md ring-1 ring-border animate-in fade-in duration-700", className)}
            style={{ width: TEMPLATE_WIDTH * scale, height: TEMPLATE_HEIGHT * scale }}
            aria-hidden
        >
            <div
                className="catalog-light pointer-events-none absolute left-0 top-0 origin-top-left"
                style={{ width: TEMPLATE_WIDTH, height: TEMPLATE_HEIGHT, transform: `scale(${scale})` }}
            >
                <div className="h-full w-full p-6">
                    <Template
                        catalogName={name}
                        products={products}
                        primaryColor={color}
                        showPrices
                        showDescriptions
                        showAttributes={false}
                        showSku={false}
                        isFreeUser={false}
                    />
                </div>
            </div>
        </div>
    )
}
