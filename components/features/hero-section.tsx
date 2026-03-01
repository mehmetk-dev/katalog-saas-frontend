"use client"

import { Rocket } from "lucide-react"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

export function HeroSection() {
    const { t } = useTranslation()

    return (
        <div className="max-w-5xl mx-auto text-center mb-32 relative">
            <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                "border border-slate-200 bg-white shadow-sm mb-8",
                "animate-in fade-in zoom-in duration-700"
            )}>
                <Rocket className="w-4 h-4 text-sky-600" />
                <span className={cn(
                    "text-xs font-bold uppercase tracking-widest text-slate-700"
                )}>
                    {t('featuresPage.heroBadge')}
                </span>
            </div>

            <h1 className={cn(
                "text-5xl md:text-7xl lg:text-8xl font-black text-slate-900",
                "mb-8 leading-[0.95] tracking-tight"
            )}>
                {t('featuresPage.heroTitle')} <br />
                <span className={cn(
                    "text-transparent bg-clip-text bg-gradient-to-r",
                    "from-sky-600 via-blue-600 to-sky-600 animate-gradient-x"
                )}>
                    {t('featuresPage.heroTitleHighlight')}
                </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light">
                {t('featuresPage.heroDesc')}
            </p>
        </div>
    )
}
