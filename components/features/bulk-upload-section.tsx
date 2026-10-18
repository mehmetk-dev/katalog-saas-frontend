"use client"

import { MousePointerClick, Image as ImageIcon } from "lucide-react"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
import { CheckItem, FloatingProductBadge } from "./shared"

export function BulkUploadSection() {
    const { t } = useTranslation()

    return (
        <section className="max-w-7xl mx-auto mb-32 md:mb-48">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="relative group">
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-tr from-sky-500 to-blue-600",
                        "rounded-[2rem] blur-2xl opacity-20",
                        "group-hover:opacity-30 transition-opacity"
                    )} />
                    <div className={cn(
                        "relative bg-white border border-slate-200 rounded-[2.5rem]",
                        "p-8 md:p-12 shadow-2xl shadow-sky-100/50 overflow-hidden",
                        "min-h-[400px] flex flex-col items-center justify-center"
                    )}>
                        <div className={cn(
                            "absolute inset-0 bg-slate-50/50",
                            "[mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
                        )} />
                        <div className={cn(
                            "w-full max-w-sm border-2 border-dashed border-sky-200",
                            "bg-sky-50/50 rounded-3xl p-10 text-center relative z-10",
                            "group-hover:scale-105 transition-transform duration-500"
                        )}>
                            <div className={cn(
                                "w-20 h-20 bg-white rounded-full shadow-lg mx-auto",
                                "flex items-center justify-center mb-6"
                            )}>
                                <ImageIcon className="w-10 h-10 text-sky-600" />
                            </div>
                            <p className="font-bold text-slate-900 text-lg mb-2">{t('featuresPage.bulkDropTitle')}</p>
                            <p className="text-sm text-slate-500">{t('featuresPage.bulkDropDesc')}</p>

                            <FloatingProductBadge
                                position="right"
                                imageUrl="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100"
                            />
                            <FloatingProductBadge
                                position="left"
                                imageUrl="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100"
                                className="delay-150"
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-8">
                        <MousePointerClick className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 whitespace-pre-line">{t('featuresPage.bulkTitle')}</h2>
                    <p className="text-xl text-slate-500 leading-relaxed mb-8">
                        {t('featuresPage.bulkDesc')}
                    </p>
                    <ul className="space-y-4">
                        <CheckItem>{t('featuresPage.bulkList1')}</CheckItem>
                        <CheckItem>{t('featuresPage.bulkList2')}</CheckItem>
                        <CheckItem>{t('featuresPage.bulkList3')}</CheckItem>
                    </ul>
                </div>
            </div>
        </section>
    )
}
