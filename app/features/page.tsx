"use client"

import Link from "next/link"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-provider"
import {
    ArrowRight,
    MousePointerClick,
    QrCode,
    BarChart3,
    Layers,
    Share2,
    Download,
    FileText,
    Palette,
    Smartphone
} from "lucide-react"

export default function FeaturesPage() {
    const { t } = useTranslation()

    const features = [
        {
            icon: MousePointerClick,
            title: t('featuresPage.dragDropTitle'),
            description: t('featuresPage.dragDropDesc')
        },
        {
            icon: Layers,
            title: t('featuresPage.templatesTitle'),
            description: t('featuresPage.templatesDesc')
        },
        {
            icon: QrCode,
            title: t('featuresPage.qrTitle'),
            description: t('featuresPage.qrDesc')
        },
        {
            icon: BarChart3,
            title: t('featuresPage.analyticsTitle'),
            description: t('featuresPage.analyticsDesc')
        },
        {
            icon: Share2,
            title: t('featuresPage.shareTitle'),
            description: t('featuresPage.shareDesc')
        },
        {
            icon: Download,
            title: t('featuresPage.pdfTitle'),
            description: t('featuresPage.pdfDesc')
        },
        {
            icon: FileText,
            title: t('featuresPage.excelTitle'),
            description: t('featuresPage.excelDesc')
        },
        {
            icon: Palette,
            title: t('featuresPage.brandTitle'),
            description: t('featuresPage.brandDesc')
        },
        {
            icon: Smartphone,
            title: t('featuresPage.mobileTitle'),
            description: t('featuresPage.mobileDesc')
        }
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            <PublicHeader />

            <main className="pt-32 pb-20">
                {/* Hero */}
                <div className="max-w-4xl mx-auto px-6 text-center mb-20">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
                        {t('featuresPage.title')}
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        {t('featuresPage.subtitle')}
                    </p>
                </div>

                {/* Features Grid */}
                <div className="max-w-6xl mx-auto px-6 mb-20">
                    <div className="grid md:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
                                    <feature.icon className="w-6 h-6 text-slate-500 group-hover:text-violet-600 transition-colors" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                                <p className="text-slate-500">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="bg-white rounded-2xl border border-slate-200 p-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">{t('featuresPage.ctaTitle')}</h2>
                        <p className="text-slate-500 mb-8">{t('featuresPage.ctaDesc')}</p>
                        <Link href="/auth?tab=signup">
                            <Button className="bg-violet-600 hover:bg-violet-700 h-11 px-6">
                                {t('featuresPage.ctaButton')}
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
