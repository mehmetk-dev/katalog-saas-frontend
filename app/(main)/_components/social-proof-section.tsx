import React from "react"
import { FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import type { TranslationFn } from "./types"

const BRAND_NAMES = ['Moda Butik', 'Tech Store', 'Home Decor', 'Auto Parts', 'Organic Market', 'Beauty Shop'] as const

interface SocialProofSectionProps {
    t: TranslationFn
}

export const SocialProofSection = React.memo(function SocialProofSection({ t }: SocialProofSectionProps) {
    return (
        <section className="py-10 border-b border-slate-200/60 bg-white/50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-xs font-bold text-slate-400 mb-8 uppercase tracking-[0.2em]">
                    {t('landing.trustedBy')}
                </p>
                <div className="relative overflow-hidden">
                    <div className={cn(
                        "flex flex-wrap items-center justify-center gap-x-12 gap-y-8",
                        "opacity-60 grayscale hover:grayscale-0 hover:opacity-100",
                        "transition-all duration-700"
                    )}>
                        {BRAND_NAMES.map((brand, i) => (
                            <div key={i} className={cn(
                                "group flex items-center gap-2.5 text-slate-700",
                                "font-black text-xl tracking-tight cursor-default",
                                "select-none hover:scale-105 transition-transform"
                            )}>
                                <div className={cn(
                                    "w-10 h-10 rounded-xl bg-gradient-to-br",
                                    "from-slate-100 to-slate-200 border border-slate-300/50",
                                    "flex items-center justify-center shadow-sm",
                                    "group-hover:shadow-md transition-all"
                                )}>
                                    <FileText className="w-5 h-5 text-slate-500 group-hover:text-violet-600 transition-colors" />
                                </div>
                                <span>{brand}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
})
