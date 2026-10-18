import React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TranslationFn } from "./types"

interface CtaSectionProps {
    t: TranslationFn
}

export const CtaSection = React.memo(function CtaSection({ t }: CtaSectionProps) {
    return (
        <section className="py-32 relative overflow-hidden bg-slate-50">
            {/* Dot Pattern Background */}
            <div className={cn(
                "absolute inset-0",
                "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]",
                "[background-size:20px_20px]",
                "[mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_40%,transparent_100%)]"
            )} />

            <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8">
                    {t('landing.ctaTitle')}{' '}
                    <span className={cn(
                        "text-transparent bg-clip-text bg-gradient-to-r",
                        "from-violet-600 to-fuchsia-500"
                    )}>
                        {t('landing.ctaHighlight')}
                    </span>
                </h2>

                <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
                    {t('landing.ctaDesc')}
                </p>

                <Link href="/auth?tab=signup">
                    <Button
                        size="lg"
                        className={cn(
                            "h-16 px-12 text-lg rounded-full",
                            "bg-gradient-to-r from-violet-600 to-fuchsia-500",
                            "hover:from-violet-700 hover:to-fuchsia-600",
                            "shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50",
                            "transition-all duration-300 hover:scale-105",
                            "hover:-translate-y-1 font-bold"
                        )}
                    >
                        {t('landing.ctaButton')}
                        <ArrowRight className="ml-3 w-6 h-6" />
                    </Button>
                </Link>
            </div>
        </section>
    )
})
