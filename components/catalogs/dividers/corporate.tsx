import React from 'react'
import type { CategoryDividerProps } from './index'

export function CorporateDivider({ categoryName, firstProductImage: _firstProductImage, primaryColor = '#1e293b' }: CategoryDividerProps) {
    return (
        <div className="relative w-full h-full bg-slate-50 flex items-center overflow-hidden">
            {/* Side Wave */}
            <div className="absolute top-0 left-0 w-1/3 h-full bg-slate-900 skew-x-12 -translate-x-20" style={{ backgroundColor: primaryColor }} />

            <div className="relative w-full px-20 flex items-center justify-between z-10">
                <div className="text-white font-bold opacity-20 text-9xl absolute left-0 rotate-90 origin-bottom-left translate-x-20">
                    BÖLÜM
                </div>

                <div className="ml-auto w-2/3">
                    <div className="h-1 w-20 bg-blue-600 mb-6" style={{ backgroundColor: primaryColor }} />
                    <h2 className="text-6xl font-bold text-slate-800 leading-tight mb-4">
                        {categoryName}
                    </h2>
                    <p className="text-slate-500 text-lg">
                        {categoryName} için kapsamlı ürün listesi.
                    </p>
                </div>
            </div>
        </div>
    )
}
