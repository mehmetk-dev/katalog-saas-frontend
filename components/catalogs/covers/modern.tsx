import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'
import { useTranslation } from '@/lib/contexts/i18n-provider'

export const ModernCover = React.memo(function ModernCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl: _logoUrl,
    productCount = 0,
    primaryColor: _primaryColor = '#3b82f6'
}: CoverPageProps) {
    const { t } = useTranslation()
    return (
        <div className="relative w-full h-full bg-slate-50 overflow-hidden flex flex-col">
            {/* Background Graphics */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 flex-1 flex flex-col p-12 lg:p-20">
                {/* 1. TOP SECTION: Typography */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-0.5 w-12 bg-slate-900" />
                        <span className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
                            {new Date().getFullYear()} COLLECTION
                        </span>
                    </div>

                    <h1 className="text-6xl lg:text-8xl font-black text-slate-900 leading-[0.9] mb-8 tracking-tighter">
                        {catalogName}
                    </h1>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        {coverDescription && (
                            <p className="text-lg lg:text-xl text-slate-500 leading-relaxed max-w-2xl font-medium italic">
                                "{coverDescription}"
                            </p>
                        ) || <div />}

                        <div className="flex flex-col items-start lg:items-end shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("coverTexts.catalogContent")}</span>
                            <div className="text-5xl font-black text-slate-900 tabular-nums">
                                {productCount}<span className="text-indigo-600 text-2xl ml-1">+</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. BOTTOM SECTION: Large Image */}
                <div className="flex-1 relative">
                    {coverImageUrl ? (
                        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
                            <Image
                                src={coverImageUrl}
                                alt="Cover"
                                fill
                                sizes="100vw"
                                className="object-cover"
                                priority
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center">
                            <div className="text-slate-300 font-black text-4xl uppercase tracking-tighter opacity-50">{t("coverTexts.noImageSelected")}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
})
