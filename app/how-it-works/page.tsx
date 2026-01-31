"use client"

import { useCallback } from "react"
import Link from "next/link"
import { ArrowRight, Layout, CheckCircle2, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { useTranslation } from "@/lib/i18n-provider"

export default function HowItWorksPage() {
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, any>) => baseT(key, params) as string, [baseT])

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
                        {/* Step 1 */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-6">
                                <Layout className="w-6 h-6 text-violet-600" />
                            </div>
                            <div className="text-sm font-medium text-violet-600 mb-2">{t('howItWorksPage.step1Badge')}</div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">{t('howItWorksPage.step1Title')}</h3>
                            <p className="text-slate-500">
                                {t('howItWorksPage.step1Desc')}
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 rounded-xl bg-fuchsia-100 flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-6 h-6 text-fuchsia-600" />
                            </div>
                            <div className="text-sm font-medium text-fuchsia-600 mb-2">{t('howItWorksPage.step2Badge')}</div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">{t('howItWorksPage.step2Title')}</h3>
                            <p className="text-slate-500">
                                {t('howItWorksPage.step2Desc')}
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                                <Share2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="text-sm font-medium text-emerald-600 mb-2">{t('howItWorksPage.step3Badge')}</div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">{t('howItWorksPage.step3Title')}</h3>
                            <p className="text-slate-500">
                                {t('howItWorksPage.step3Desc')}
                            </p>
                        </div>
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
