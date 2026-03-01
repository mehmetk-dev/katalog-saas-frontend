"use client"

import { useCallback } from "react"
import Link from "next/link"
import { ArrowRight, Layout, CheckCircle2, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { useTranslation } from "@/lib/contexts/i18n-provider"

const colorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: "bg-violet-100", text: "text-violet-600" },
    fuchsia: { bg: "bg-fuchsia-100", text: "text-fuchsia-600" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
}

interface StepCardProps {
    icon: React.ElementType
    color: string
    badge: string
    title: string
    description: string
}

function StepCard({ icon: Icon, color, badge, title, description }: StepCardProps) {
    const colors = colorMap[color] ?? colorMap.violet
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-all">
            <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-6`}>
                <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div className={`text-sm font-medium ${colors.text} mb-2`}>{badge}</div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
            <p className="text-slate-500">{description}</p>
        </div>
    )
}

export default function HowItWorksPage() {
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

    const steps = [
        { icon: Layout, color: "violet", badgeKey: "step1Badge", titleKey: "step1Title", descKey: "step1Desc" },
        { icon: CheckCircle2, color: "fuchsia", badgeKey: "step2Badge", titleKey: "step2Title", descKey: "step2Desc" },
        { icon: Share2, color: "emerald", badgeKey: "step3Badge", titleKey: "step3Title", descKey: "step3Desc" },
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="pt-32 pb-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 text-slate-900">
                            {t('howItWorksPage.title')}
                        </h1>
                        <p className="text-xl text-slate-500">
                            {t('howItWorksPage.subtitle')}
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
                        {steps.map((step) => (
                            <StepCard
                                key={step.badgeKey}
                                icon={step.icon}
                                color={step.color}
                                badge={t(`howItWorksPage.${step.badgeKey}`)}
                                title={t(`howItWorksPage.${step.titleKey}`)}
                                description={t(`howItWorksPage.${step.descKey}`)}
                            />
                        ))}
                    </div>

                    <div className="mt-20 text-center">
                        <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-xl mx-auto">
                            <h3 className="text-2xl font-bold mb-4 text-slate-900">{t('howItWorksPage.ctaTitle')}</h3>
                            <p className="mb-8 text-slate-500">{t('howItWorksPage.ctaDesc')}</p>
                            <Link href="/auth?tab=signup">
                                <Button size="lg" className="bg-violet-600 hover:bg-violet-700 h-11 px-8">
                                    {t('howItWorksPage.ctaButton')}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
