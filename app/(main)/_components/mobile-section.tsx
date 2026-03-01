import React from "react"
import Image from "next/image"
import { Smartphone, Zap, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TranslationFn } from "./types"

interface MobileSectionProps {
    t: TranslationFn
}

export const MobileSection = React.memo(function MobileSection({ t }: MobileSectionProps) {
    return (
        <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
            {/* Background Gradient */}
            <div className={cn(
                "absolute top-0 left-0 w-full h-full",
                "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]",
                "from-violet-900/20 via-slate-900 to-slate-900"
            )} />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Phone Mockup */}
                    <div className="w-full lg:w-1/2 relative">
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-r",
                            "from-violet-600/30 to-fuchsia-600/30",
                            "rounded-full blur-[100px] scale-75"
                        )} />
                        <div className="relative mx-auto w-[280px]">
                            <div className={cn(
                                "relative bg-slate-800 rounded-[3rem] p-3",
                                "shadow-2xl shadow-black/50 border border-slate-700"
                            )}>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-2xl" />
                                <div className="rounded-[2.2rem] overflow-hidden bg-white aspect-[9/19]">
                                    <Image
                                        src="/hero-dashboard.webp"
                                        alt="FogCatalog mobil uyumlu katalog görünümü - Akıllı telefon üzerinde ürün kataloğu"
                                        className="w-full h-full object-cover"
                                        width={280}
                                        height={592}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="w-full lg:w-1/2 space-y-8">
                        <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full",
                            "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        )}>
                            <Smartphone className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('landing.mobileBadge')}</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                            {t('landing.mobileTitle')}{' '}
                            <span className={cn(
                                "text-transparent bg-clip-text bg-gradient-to-r",
                                "from-cyan-400 to-violet-400"
                            )}>
                                {t('landing.mobileScore')}
                            </span>
                        </h2>

                        <p className="text-xl text-slate-400 leading-relaxed">
                            {t('landing.mobileDesc')}
                        </p>

                        <ul className="space-y-5">
                            {[
                                t('landing.mobileFeature1'),
                                t('landing.mobileFeature2'),
                                t('landing.mobileFeature3')
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                                        <Zap className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <span className="text-slate-300">{item}</span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            size="lg"
                            className={cn(
                                "h-12 px-6 bg-white text-slate-900",
                                "hover:bg-slate-100 rounded-full font-semibold",
                                "shadow-xl shadow-white/10"
                            )}
                        >
                            {t('landing.mobileButton')}
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
})
