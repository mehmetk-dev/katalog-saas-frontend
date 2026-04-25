"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TranslationFn } from "./types"

import { ALL_TEMPLATES } from "@/components/catalogs/templates/registry"
import { getPreviewProductsByLayout } from "@/components/templates/preview-data"

interface HeroSectionProps {
    t: TranslationFn
}

const CAROUSEL_SLIDES = [
    { key: 'classic-catalog', color: '#2b2b5f' },
    { key: 'modern-grid', color: '#3b82f6' },
    { key: 'product-tiles', color: '#10b981' },
    { key: 'minimalist', color: '#171717' },
]

export const HeroSection = React.memo(function HeroSection({ t }: HeroSectionProps) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [scale, setScale] = useState(0.25)
    const [screenDims, setScreenDims] = useState({ w: 0, h: 0 })
    const [isMounted, setIsMounted] = useState(false)
    const screenRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)
        }, 8000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (!screenRef.current) return

        const resizeObserver = new ResizeObserver((entries) => {
            if (entries[0]) {
                const width = entries[0].contentRect.width
                const height = entries[0].contentRect.height
                setScale(width / 800)
                setScreenDims({ w: width, h: height })
            }
        })

        resizeObserver.observe(screenRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    return (
        <section className="relative pt-32 pb-20 md:pt-40 lg:pt-48 md:pb-32 overflow-hidden bg-slate-50 min-h-[calc(100vh-80px)] flex flex-col justify-center">
            <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                {/* Title Centered */}
                <div className="text-center mb-24 lg:mb-32">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-[#2b2b5f] max-w-4xl mx-auto tracking-tight">
                        {t('landing.heroAlternativeTitle')}
                    </h1>
                </div>

                {/* 2 Column Grid */}
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 lg:items-stretch max-w-7xl mx-auto">
                    {/* Left Column - Bullets */}
                    <div className="lg:col-span-5 flex flex-col justify-between h-full animate-in fade-in slide-in-from-left-8 duration-700">
                        <ul className="space-y-8 text-slate-700 text-lg">
                            <li className="flex items-start">
                                <span className="mr-3 mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-800 flex-shrink-0" />
                                <span className="leading-relaxed">
                                    <strong className="font-bold text-slate-900">{t('landing.heroFeature1Start')}</strong>
                                    {t('landing.heroFeature1End')}
                                </span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-3 mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-800 flex-shrink-0" />
                                <span className="leading-relaxed">
                                    <strong className="font-bold text-slate-900">{t('landing.heroFeature2Start')}</strong>
                                    {t('landing.heroFeature2End')}
                                </span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-3 mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-800 flex-shrink-0" />
                                <span className="leading-relaxed">
                                    <strong className="font-bold text-slate-900">{t('landing.heroFeature3Start')}</strong>
                                    {t('landing.heroFeature3End')}
                                </span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-3 mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-800 flex-shrink-0" />
                                <span className="leading-relaxed">
                                    <strong className="font-bold text-slate-900">{t('landing.heroFeature4Start')}</strong>
                                    {t('landing.heroFeature4End')}
                                </span>
                            </li>
                        </ul>

                        <div className="mt-auto pt-10 flex items-end">
                            <Link href="/auth?tab=signup" className="w-full">
                                <Button className="bg-[#f98826] hover:bg-[#e07519] text-white px-8 py-7 rounded-md text-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-orange-500/20">
                                    {t('landing.heroStartCreating')}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Right Column - Laptop Mockup */}
                    <div className="lg:col-span-7 relative animate-in fade-in slide-in-from-right-8 duration-700 delay-200">

                        <div className="relative mx-auto w-full max-w-[800px] flex justify-center items-center">
                            {/* User's Laptop Frame */}
                            <Image
                                src="/laptop-frame.png"
                                alt="Laptop Mockup"
                                className="w-full h-auto relative z-10 drop-shadow-2xl pointer-events-none"
                                width={1000}
                                height={750}
                                priority
                            />

                            {/* Inner Screen Background (Black) placed ON TOP of the laptop image's frame */}
                            <div className="absolute top-[5.3%] bottom-[15.3%] left-[15.5%] right-[15.5%] z-20 bg-black overflow-hidden rounded-sm md:rounded-md lg:rounded-lg">
                                <div ref={screenRef} className="w-full h-full relative">

                                    {CAROUSEL_SLIDES.map((slide, index) => {
                                        const TemplateComponent = ALL_TEMPLATES[slide.key]
                                        if (!TemplateComponent) return null

                                        const products = getPreviewProductsByLayout(slide.key)
                                        const isActive = index === currentSlide

                                        const unscaledScreenHeight = scale > 0 ? screenDims.h / scale : 0
                                        const maxScrollY = Math.max(0, 1131 - unscaledScreenHeight)
                                        const translateY = (isActive && isMounted) ? -maxScrollY : 0

                                        return (
                                            <div
                                                key={slide.key}
                                                className={cn(
                                                    "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                                                    isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                                                )}
                                            >
                                                <div className="w-full h-full relative">
                                                    <div 
                                                        className="origin-top-left absolute top-0 left-0 w-[800px] h-[1131px]"
                                                        style={{ transform: `scale(${scale})` }}
                                                    >
                                                        <div
                                                            className="w-full h-full bg-white antialiased"
                                                            style={{
                                                                transform: `translateY(${translateY}px)`,
                                                                transitionProperty: 'transform',
                                                                transitionDuration: '8000ms',
                                                                transitionTimingFunction: 'ease-in-out',
                                                                textRendering: 'optimizeLegibility',
                                                                WebkitFontSmoothing: 'antialiased',
                                                                backfaceVisibility: 'hidden'
                                                            }}
                                                        >
                                                            <div className="pointer-events-none p-6 h-full w-full">
                                                                <TemplateComponent
                                                                catalogName="FogCatalog"
                                                                products={products.slice(0, 8)} // User requested 8 items
                                                                primaryColor={slide.color}
                                                                showPrices={true}
                                                                showDescriptions={true}
                                                                showAttributes={false}
                                                                showSku={false}
                                                                isFreeUser={false}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        )
                                    })}

                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-center lg:mt-8">
                            <div className="flex justify-center gap-2 mb-3">
                                {CAROUSEL_SLIDES.map((_, idx) => (
                                    <span
                                        key={idx}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-colors duration-500",
                                            idx === currentSlide ? "bg-[#f98826]" : "bg-slate-300"
                                        )}
                                    />
                                ))}
                            </div>
                            <p className="text-sm font-medium text-slate-600">
                                {t('landing.heroMockupCaption')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
})
