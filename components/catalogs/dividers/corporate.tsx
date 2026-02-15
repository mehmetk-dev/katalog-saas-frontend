import React from 'react'
import type { DividerPageProps } from './index'

export function CorporateDivider({
    categoryName,
    productCount = 0,
    description,
    primaryColor = '#2563EB'
}: DividerPageProps) {
    return (
        <div className="relative w-full h-full bg-slate-50 text-slate-900 font-sans overflow-hidden flex flex-col p-24 justify-center">
            {/* Colored Accent Block */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-blue-600" />

            <div className="pl-12 z-10 max-w-4xl">
                <div className="flex items-center gap-4 text-blue-600 font-bold uppercase tracking-widest text-sm mb-8">
                    <span className="w-12 h-px bg-blue-600" />
                    <span>Section {Math.floor(Math.random() * 10) + 1}</span>
                </div>

                <h2 className="text-8xl font-black text-slate-900 leading-tight mb-12 tracking-tight">
                    {categoryName}
                </h2>

                {description && (
                    <div className="border-l-4 border-slate-200 pl-8 py-2 mb-12">
                        <p className="text-2xl text-slate-600 font-light leading-relaxed">
                            {description}
                        </p>
                    </div>
                )}

                <div className="flex gap-12 border-t border-slate-200 pt-12">
                    <div>
                        <span className="block text-6xl font-bold text-blue-600 mb-1">{productCount}</span>
                        <span className="block text-xs font-bold uppercase text-slate-400">Total Items</span>
                    </div>
                    <div>
                        <span className="block text-6xl font-bold text-slate-300 mb-1">{new Date().getFullYear()}</span>
                        <span className="block text-xs font-bold uppercase text-slate-400">Fiscal Year</span>
                    </div>
                </div>
            </div>

            {/* Background Watermark */}
            <div className="absolute right-[-10%] bottom-[-10%] text-[400px] font-black text-slate-200 opacity-50 z-0 select-none pointer-events-none">
                0{Math.floor(Math.random() * 9)}
            </div>
        </div>
    )
}
