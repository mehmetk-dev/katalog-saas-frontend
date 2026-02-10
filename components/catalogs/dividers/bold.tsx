import React from 'react'
import type { CategoryDividerProps } from './index'

export function BoldDivider({ categoryName, firstProductImage: _firstProductImage, primaryColor: _primaryColor = '#ffffff' }: CategoryDividerProps) {
    return (
        <div className="relative w-full h-full bg-red-600 flex items-center justify-center overflow-hidden">
            {/* Giant diagonal text BG */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none overflow-hidden">
                <h1 className="text-[400px] font-black leading-none tracking-tighter text-black -rotate-45 whitespace-nowrap">
                    {categoryName}
                </h1>
            </div>

            <div className="bg-black text-white p-12 transform skew-x-12 relative z-10 border-4 border-white shadow-[20px_20px_0px_rgba(0,0,0,0.5)]">
                <div className="transform -skew-x-12 text-center">
                    <h2 className="text-7xl font-black uppercase tracking-tighter mb-2">
                        {categoryName}
                    </h2>
                    <div className="h-2 w-full bg-white mb-2" />
                    <span className="text-xl font-bold uppercase">Bölüm Başlangıcı</span>
                </div>
            </div>
        </div>
    )
}
