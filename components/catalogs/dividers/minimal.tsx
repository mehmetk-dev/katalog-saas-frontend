import React from 'react'
import type { CategoryDividerProps } from './index'
import { useTranslation } from '@/lib/contexts/i18n-provider'

export const MinimalDivider = React.memo(function MinimalDivider({ categoryName, firstProductImage: _firstProductImage, primaryColor: _primaryColor }: CategoryDividerProps) {
    const { t } = useTranslation()
    return (
        <div className="relative w-full h-full bg-[#f3f4f6] text-black font-sans p-16 flex flex-col justify-center overflow-hidden">
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-black/5" />
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/5" />

            <div className="relative z-10 flex items-center gap-12">
                <div className="text-right flex-1">
                    <span className="text-xs font-bold uppercase tracking-[0.3em] block mb-2 text-gray-400">{t("dividerTexts.section")}</span>
                    <h2 className="text-6xl font-medium tracking-tight">
                        {categoryName}
                        <span className="text-red-500">.</span>
                    </h2>
                </div>

                <div className="w-1 h-32 bg-black" />

                <div className="flex-1">
                    <div className="w-16 h-16 bg-red-600 mix-blend-multiply opacity-80" />
                </div>
            </div>

            {/* Page Number Placeholder */}
            <div className="absolute bottom-12 right-12 text-[10px] uppercase tracking-widest text-gray-400">
                İndeks / {categoryName.substring(0, 3).toUpperCase()}
            </div>
        </div>
    )
})
