"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function CtaSection() {
    const { t } = useTranslation()

    return (
        <section className="max-w-7xl mx-auto mt-32 mb-20">
            <div className="relative bg-slate-900 rounded-[3rem] overflow-hidden min-h-[400px] flex items-center">
                {/* Background Patterns */}
                <div className={cn(
                    "absolute top-0 right-0 w-[600px] h-[600px]",
                    "bg-sky-500/10 rounded-full blur-[120px]",
                    "-translate-y-1/2 translate-x-1/2 pointer-events-none"
                )} />
                <div className={cn(
                    "absolute bottom-0 left-0 w-[400px] h-[400px]",
                    "bg-blue-500/10 rounded-full blur-[100px]",
                    "translate-y-1/2 -translate-x-1/2 pointer-events-none"
                )} />

                <div className="grid lg:grid-cols-2 gap-12 w-full p-8 md:p-20 relative z-10 items-center">
                    {/* Text Content */}
                    <div className="text-left relative z-20">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            {t('featuresPage.ctaMainTitle')} <br />
                            <span className="text-sky-400">{t('featuresPage.ctaHighlight')}</span>
                        </h2>
                        <p className="text-slate-400 text-base md:text-lg mb-8 max-w-md leading-relaxed">
                            {t('featuresPage.ctaMainDesc')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <Link href="/auth?tab=signup" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className={cn(
                                        "w-full sm:w-auto h-14 md:h-16 px-10",
                                        "rounded-full text-base font-bold",
                                        "bg-white text-slate-900 hover:bg-slate-100",
                                        "hover:scale-105 transition-all shadow-xl"
                                    )}
                                >
                                    {t('featuresPage.ctaButton')}
                                    <ArrowRight className="w-5 h-5 ml-2 text-slate-900" />
                                </Button>
                            </Link>
                            <div className={cn(
                                "flex items-center h-14 md:h-16",
                                "px-0 md:px-4 text-slate-500",
                                "text-xs font-medium tracking-wide"
                            )}>
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                {t('featuresPage.ctaNoCard')}
                            </div>
                        </div>
                    </div>

                    {/* Visual: Catalog Mockup (Responsive) */}
                    <div className={cn(
                        "relative flex h-[280px] md:h-[320px]",
                        "items-center justify-center lg:perspective-[2000px]"
                    )}>
                        <div className={cn(
                            "relative w-full max-w-[300px] lg:w-[500px] h-full",
                            "flex justify-center items-center transform-style-3d",
                            "hover:scale-105 transition-transform duration-700"
                        )}>

                            {/* Left Page (Back Cover) - Hidden on Mobile */}
                            <div className={cn(
                                "hidden lg:flex absolute left-[30px]",
                                "w-[220px] h-[300px] bg-slate-800",
                                "rounded-l-2xl border border-slate-700 shadow-2xl",
                                "transform rotate-y-6 origin-right z-10",
                                "flex-col p-6"
                            )}>
                                <div className="w-full h-32 bg-slate-700/50 rounded-lg mb-4 shimmer"></div>
                                <div className="space-y-2">
                                    <div className="w-full h-2 bg-slate-700/50 rounded"></div>
                                    <div className="w-full h-2 bg-slate-700/50 rounded"></div>
                                    <div className="w-2/3 h-2 bg-slate-700/50 rounded"></div>
                                </div>
                                <div className="mt-auto flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-700/50"></div>
                                    <div className="w-8 h-8 rounded-full bg-slate-700/50"></div>
                                </div>
                            </div>

                            {/* Right Page (Front Cover) - Visible & Styled on Mobile */}
                            <div className={cn(
                                "relative lg:absolute lg:right-[30px]",
                                "w-full max-w-[240px] lg:w-[220px]",
                                "h-[320px] lg:h-[300px]",
                                "bg-gradient-to-br from-slate-700 to-slate-900",
                                "rounded-2xl lg:rounded-r-2xl",
                                "shadow-2xl shadow-slate-900/50",
                                "lg:transform lg:-rotate-y-6 lg:origin-left z-20",
                                "flex flex-col p-8 items-center justify-center",
                                "text-white border border-white/10 group"
                            )}>
                                <Sparkles className="w-12 h-12 lg:w-10 lg:h-10 mb-6 text-sky-200" />
                                <h3 className="font-serif text-4xl lg:text-3xl mb-3 lg:mb-2 tracking-tight">{t('featuresPage.ctaCollection')}</h3>
                                <div className="w-16 lg:w-12 h-1 bg-white/30 rounded-full mb-3 lg:mb-2"></div>
                                <p className="text-xs lg:text-[10px] text-sky-200 tracking-[0.3em] uppercase">2026 / 2027</p>

                                {/* Shine Effect */}
                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-tr",
                                    "from-transparent via-white/10 to-transparent",
                                    "rounded-2xl lg:rounded-r-2xl pointer-events-none"
                                )} />
                            </div>

                            {/* Spine - Hidden on Mobile */}
                            <div className={cn(
                                "hidden lg:block absolute w-[60px] h-[300px]",
                                "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 z-0"
                            )} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
