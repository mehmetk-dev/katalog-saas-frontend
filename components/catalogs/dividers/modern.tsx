import React from 'react'
import type { CategoryDividerProps } from './index'

export function ModernDivider({ categoryName, firstProductImage: _firstProductImage, primaryColor: _primaryColor = '#3b82f6' }: CategoryDividerProps) {
    return (
        <div className="relative w-full h-full bg-slate-50 flex items-center justify-center overflow-hidden">
            {/* Shapes */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />

            <div className="absolute top-20 left-20 w-12 h-12 border-4 border-slate-900/10 rounded-full" />
            <div className="absolute bottom-40 right-20 w-8 h-8 rounded-full bg-slate-900/10" />

            {/* Content */}
            <div className="relative z-10 text-center">
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full mb-6">
                    Category
                </div>
                <h2 className="text-7xl font-black text-slate-900 mb-6 tracking-tight">
                    {categoryName}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full" />
            </div>
        </div>
    )
}
