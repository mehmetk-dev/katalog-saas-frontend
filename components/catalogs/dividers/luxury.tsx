import React from 'react'
import Image from 'next/image'
import type { CategoryDividerProps } from './index'

export function LuxuryDivider({ categoryName, firstProductImage, primaryColor }: CategoryDividerProps) {
    return (
        <div className="relative w-full h-full bg-[#050505] text-[#D4AF37] flex items-center justify-center overflow-hidden">
            {/* Pattern BG */}
            <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 0)', backgroundSize: '32px 32px' }}>
            </div>

            <div className="border border-[#D4AF37]/50 p-20 relative">
                {/* Corner Flourishes */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#D4AF37]" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#D4AF37]" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[#D4AF37]" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#D4AF37]" />

                <div className="text-center">
                    <div className="w-1 bg-[#D4AF37]/50 h-12 mx-auto mb-6" />
                    <span className="font-serif italic text-lg opacity-80 mb-2 block">Collection</span>
                    <h2 className="font-serif text-6xl tracking-[0.2em] uppercase mb-6 text-[#F5E6C4]">
                        {categoryName}
                    </h2>
                    <div className="w-1 bg-[#D4AF37]/50 h-12 mx-auto mt-6" />
                </div>
            </div>
        </div>
    )
}
