import React from 'react'
import type { CategoryDividerProps } from './index'

export function IndustrialDivider({ categoryName, firstProductImage: _firstProductImage, primaryColor: _primaryColor = '#facc15' }: CategoryDividerProps) {
    return (
        <div className="relative w-full h-full bg-[#1a1a1a] text-white font-sans overflow-hidden flex flex-col justify-center items-center">
            {/* Grid BG */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Diagonal Stripes */}
            <div className="absolute top-0 right-0 w-64 h-full bg-yellow-400/10 skew-x-12 border-l border-yellow-400" />

            <div className="relative z-10 border-2 border-yellow-400 p-8 bg-black/80 backdrop-blur-sm max-w-lg text-center transform -rotate-1">
                {/* Corner Screws */}
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-400" />

                <div className="text-xs text-yellow-400 font-mono mb-2">BÖLÜM BAŞLIĞI</div>
                <h2 className="text-6xl font-black uppercase tracking-tighter text-white mb-4">
                    {categoryName}
                </h2>
                <div className="h-1 w-full bg-yellow-400/50 flex gap-2">
                    <div className="h-full w-1/3 bg-yellow-400" />
                    <div className="h-full w-1/6 bg-yellow-400/50" />
                </div>
            </div>
        </div>
    )
}
