import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Sparkles, Eye, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TranslationFn } from "./types"

interface HeroSectionProps {
    t: TranslationFn
}

export const HeroSection = React.memo(function HeroSection({ t }: HeroSectionProps) {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
            {/* Modern Background */}
            <div className={cn(
                "absolute inset-0 -z-20",
                "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))]",
                "from-violet-100/40 via-slate-50 to-white"
            )} />

            {/* Animated Gradient Orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] -z-10 opacity-60 pointer-events-none overflow-hidden">
                <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                    "w-[800px] h-[800px] bg-gradient-to-tr",
                    "from-violet-400/30 to-fuchsia-300/30",
                    "rounded-full blur-[120px] animate-pulse"
                )} />
                <div className={cn(
                    "absolute top-0 right-0 w-[500px] h-[500px]",
                    "bg-sky-300/20 rounded-full blur-[100px]",
                    "mix-blend-multiply animate-pulse animation-delay-2000"
                )} />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Animated Badge */}
                    <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                        "bg-white/80 border border-violet-100 text-violet-700",
                        "shadow-sm shadow-violet-100/50 mb-8 backdrop-blur-md",
                        "animate-in fade-in slide-in-from-bottom-4 duration-700"
                    )}>
                        <span className="relative flex h-2 w-2">
                            <span className={cn(
                                "animate-ping absolute inline-flex h-full w-full",
                                "rounded-full bg-violet-400 opacity-75"
                            )} />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider">{t('landing.badge')}</span>
                    </div>

                    {/* Massive Headline */}
                    <h1 className={cn(
                        "text-5xl sm:text-7xl md:text-8xl font-black tracking-tight",
                        "mb-8 leading-[0.95] text-slate-900",
                        "animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100"
                    )}>
                        {t('landing.heroTitle')}{' '}
                        <br className="hidden md:block" />
                        <span className={cn(
                            "text-transparent bg-clip-text bg-gradient-to-r",
                            "from-violet-600 via-fuchsia-600 to-sky-600 animate-gradient-x"
                        )}>
                            {t('landing.heroTitleHighlight')}
                        </span>{' '}
                        {t('landing.heroTitleEnd')}
                    </h1>

                    {/* Subtext */}
                    <p className={cn(
                        "text-lg md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto",
                        "leading-relaxed font-light",
                        "animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200"
                    )}>
                        {t('landing.heroSubtitle')}
                    </p>

                    {/* Call to Actions */}
                    <div className={cn(
                        "flex flex-col sm:flex-row items-center justify-center gap-4",
                        "animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300"
                    )}>
                        <Link href="/auth?tab=signup">
                            <Button
                                size="lg"
                                className={cn(
                                    "h-16 px-10 text-lg rounded-full bg-slate-900",
                                    "hover:bg-slate-800 shadow-xl shadow-slate-900/20",
                                    "transition-all duration-300 hover:scale-105",
                                    "hover:-translate-y-1 font-bold group"
                                )}
                            >
                                {t('landing.startNow')}
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/create-demo">
                            <Button
                                variant="outline"
                                size="lg"
                                className={cn(
                                    "h-16 px-10 text-lg rounded-full border-slate-200",
                                    "bg-white/50 hover:bg-white hover:border-violet-200",
                                    "hover:text-violet-600 transition-all duration-300",
                                    "hover:scale-105 backdrop-blur-sm font-semibold"
                                )}
                            >
                                {t('landing.seeExamples')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Hero Visual - Glassmorphism & 3D */}
                <div className={cn(
                    "mt-24 relative max-w-6xl mx-auto",
                    "perspective-[2000px] group",
                    "animate-in fade-in zoom-in duration-1000 delay-500"
                )}>
                    {/* Glow Effect */}
                    <div className={cn(
                        "absolute inset-0 -z-10 bg-gradient-to-t",
                        "from-violet-500/20 via-transparent to-transparent",
                        "blur-3xl opacity-50 group-hover:opacity-75",
                        "transition-opacity duration-700"
                    )} />

                    {/* Laptop Mockup Image Functionality */}
                    <div className={cn(
                        "relative transform transition-all duration-700",
                        "group-hover:rotate-x-2 group-hover:-translate-y-4"
                    )}>
                        {/* Reflection/Shine */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-tr",
                            "from-white/20 via-transparent to-transparent",
                            "z-20 rounded-2xl pointer-events-none"
                        )} />

                        <Image
                            src="/hero-catalog.png"
                            alt="FogCatalog Dashboard"
                            className="w-full rounded-2xl shadow-2xl ring-1 ring-white/20"
                            priority
                            width={1200}
                            height={675}
                        />

                        {/* Floating Cards */}
                        <div className={cn(
                            "absolute -left-12 top-1/4 p-4 pl-5",
                            "bg-white/80 backdrop-blur-xl rounded-2xl",
                            "shadow-2xl shadow-slate-900/10 border border-white/50",
                            "hidden lg:flex items-center gap-4 animate-float z-30",
                            "transform hover:scale-110 transition-transform duration-300"
                        )}>
                            <div className={cn(
                                "w-12 h-12 rounded-xl bg-gradient-to-br",
                                "from-emerald-400 to-green-500",
                                "flex items-center justify-center",
                                "shadow-lg shadow-emerald-200"
                            )}>
                                <Eye className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('landing.newView')}</p>
                                <p className="text-xl font-black text-slate-900">{t('landing.today')}</p>
                            </div>
                        </div>

                        <div className={cn(
                            "absolute -right-8 top-1/3 p-4 pl-5",
                            "bg-white/80 backdrop-blur-xl rounded-2xl",
                            "shadow-2xl shadow-slate-900/10 border border-white/50",
                            "hidden lg:flex items-center gap-4",
                            "animate-float animation-delay-1000 z-30",
                            "transform hover:scale-110 transition-transform duration-300"
                        )}>
                            <div className={cn(
                                "w-12 h-12 rounded-xl bg-gradient-to-br",
                                "from-violet-500 to-fuchsia-500",
                                "flex items-center justify-center",
                                "shadow-lg shadow-fuchsia-200"
                            )}>
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('landing.catalogViewed')}</p>
                                <p className="text-xl font-black text-slate-900">{t('landing.summerCollection')}</p>
                            </div>
                        </div>

                        {/* Bottom Label */}
                        <div className={cn(
                            "absolute -bottom-6 left-1/2 -translate-x-1/2",
                            "px-6 py-3 bg-slate-900/90 backdrop-blur-md rounded-full",
                            "text-white text-sm font-medium shadow-2xl",
                            "flex items-center gap-2 border border-white/10",
                            "opacity-0 group-hover:opacity-100",
                            "transition-opacity duration-500 delay-100",
                            "transform translate-y-4 group-hover:translate-y-0"
                        )}>
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            <span>Dashboard Preview v2.0</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
})
