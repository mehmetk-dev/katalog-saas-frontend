import React from 'react'
import type { CategoryDividerProps } from './index'

export function MagazineDivider({ categoryName, firstProductImage: _firstProductImage, primaryColor: _primaryColor = '#ef4444' }: CategoryDividerProps) {
    return (
        <div className="relative w-full h-full bg-white flex flex-col justify-between p-8 overflow-hidden">
            {/* Top Strip */}
            <div className="w-full border-t-4 border-black" />

            <div className="flex-1 flex flex-col justify-center items-center relative z-10">
                <div className="text-red-600 font-bold uppercase tracking-widest text-sm mb-4 bg-black text-white px-2 py-1 transform -rotate-2">
                    Category Focus
                </div>
                <h2 className="text-9xl font-black text-center leading-[0.8] uppercase tracking-tighter mb-8 break-words w-full">
                    {categoryName}
                </h2>
                <p className="font-serif italic text-xl text-gray-500 max-w-md text-center">
                    Discover the latest items in this section.
                </p>
            </div>

            {/* Background Text Element */}
            <div className="absolute top-1/2 left-0 w-full text-center pointer-events-none opacity-5 -translate-y-1/2 z-0">
                <span className="text-[300px] font-black leading-none uppercase truncate block">
                    {categoryName}
                </span>
            </div>

            {/* Bottom Strip */}
            <div className="w-full border-b-4 border-black flex justify-between pt-2">
                <span className="text-[10px] font-mono">ISSUE 42</span>
                <span className="text-[10px] font-mono">PAGE 05</span>
            </div>
        </div>
    )
}
