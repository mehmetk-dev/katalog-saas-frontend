import React from "react"
import { Users, FileText, Share2, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TranslationFn } from "./types"

interface TimelineStep {
    step: string
    titleKey: string
    descKey: string
    icon: LucideIcon
}

const TIMELINE_STEPS: TimelineStep[] = [
    { step: '01', titleKey: 'landing.step1Title', descKey: 'landing.step1Desc', icon: Users },
    { step: '02', titleKey: 'landing.step2Title', descKey: 'landing.step2Desc', icon: FileText },
    { step: '03', titleKey: 'landing.step3Title', descKey: 'landing.step3Desc', icon: Share2 },
]

interface HowItWorksSectionProps {
    t: TranslationFn
}

export const HowItWorksSection = React.memo(function HowItWorksSection({ t }: HowItWorksSectionProps) {
    return (
        <section id="nasıl-çalışır" className="py-32 bg-white relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-20">
                    {/* Left - Dashboard Mockup */}
                    <div className="w-full lg:w-1/2 lg:sticky lg:top-32 lg:self-start">
                        <DashboardMockup />
                    </div>

                    {/* Right - Timeline */}
                    <div className="w-full lg:w-1/2">
                        <Badge className="mb-6 bg-violet-100 text-violet-700 hover:bg-violet-200 border-0">
                            {t('landing.howItWorksBadge')}
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tight">
                            {t('landing.howItWorksTitle')}
                        </h2>

                        {/* Timeline */}
                        <div className="relative">
                            {/* Vertical Line */}
                            <div className={cn(
                                "absolute left-6 top-0 bottom-0 w-0.5",
                                "bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500"
                            )} />

                            <div className="space-y-16">
                                {TIMELINE_STEPS.map((item, i) => (
                                    <div key={i} className="relative flex gap-8 group">
                                        {/* Step Circle */}
                                        <div className={cn(
                                            "relative z-10 w-12 h-12 rounded-full",
                                            "bg-gradient-to-br from-violet-600 to-fuchsia-500",
                                            "flex items-center justify-center text-white font-bold",
                                            "shadow-lg shadow-violet-500/30 shrink-0",
                                            "group-hover:scale-110 transition-transform"
                                        )}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        {/* Content */}
                                        <div className="pt-2">
                                            <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                                                {t('landing.step')} {item.step}
                                            </span>
                                            <h3 className="text-xl font-bold mt-1 mb-2">{t(item.titleKey)}</h3>
                                            <p className="text-slate-600 leading-relaxed">{t(item.descKey)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
})

/* ------------------------------------------------------------------ */
/*  Dashboard mockup (pure visual, no translation needed)              */
/* ------------------------------------------------------------------ */

function DashboardMockup() {
    return (
        <div className={cn(
            "relative rounded-2xl shadow-2xl shadow-violet-500/10",
            "border border-slate-200 overflow-hidden bg-white"
        )}>
            {/* Browser Chrome */}
            <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
            </div>
            {/* Dashboard Content */}
            <div className="p-6 bg-slate-50/50 aspect-[4/3]">
                <div className="grid grid-cols-12 gap-4 h-full">
                    {/* Sidebar */}
                    <div className={cn(
                        "col-span-3 bg-white rounded-xl shadow-sm",
                        "border border-slate-100 p-3 space-y-2"
                    )}>
                        <div className="h-8 bg-violet-100 rounded-lg" />
                        <div className="h-6 bg-slate-100 rounded w-3/4" />
                        <div className="h-6 bg-slate-100 rounded w-1/2" />
                    </div>
                    {/* Main Content */}
                    <div className="col-span-9 space-y-4">
                        <div className="h-24 bg-white rounded-xl shadow-sm border border-slate-100" />
                        <div className="grid grid-cols-3 gap-3">
                            <div className="h-20 bg-white rounded-xl shadow-sm border border-slate-100" />
                            <div className="h-20 bg-white rounded-xl shadow-sm border border-slate-100" />
                            <div className="h-20 bg-white rounded-xl shadow-sm border border-slate-100" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
