import React from 'react'
import type { DividerPageProps } from './index'

export const LuxuryDivider = React.memo(function LuxuryDivider({
    categoryName,
    productCount = 0,
    description,
    primaryColor: _primaryColor = '#D4AF37'
}: DividerPageProps) {
    return (
        <div className="relative w-full h-full bg-[#0F0F0F] text-[#D4AF37] font-serif overflow-hidden flex flex-col items-center justify-center p-24">
            {/* Ornate Border */}
            <div className="absolute inset-8 border border-[#D4AF37]/30">
                <div className="absolute inset-1 border border-[#D4AF37]/10" />
                {/* Corner Diamonds */}
                <div className="absolute top-0 left-0 w-4 h-4 bg-[#D4AF37] transform -translate-x-2 -translate-y-2 rotate-45" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-[#D4AF37] transform translate-x-2 -translate-y-2 rotate-45" />
                <div className="absolute bottom-0 left-0 w-4 h-4 bg-[#D4AF37] transform -translate-x-2 translate-y-2 rotate-45" />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#D4AF37] transform translate-x-2 translate-y-2 rotate-45" />
            </div>

            <div className="text-center max-w-3xl z-10 space-y-12">
                <span className="text-xs uppercase tracking-[0.4em] text-white/40">
                    Collection &#8470; 12
                </span>

                <h2 className="text-8xl font-light italic text-[#FDFCF5] leading-tight">
                    {categoryName}
                </h2>

                <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto" />

                {description && (
                    <p className="text-xl text-[#D4AF37]/80 font-light italic leading-relaxed">
                        {description}
                    </p>
                )}

                <div className="mt-12 inline-block border border-[#D4AF37]/50 px-8 py-3 transform rotate-45">
                    <span className="block transform -rotate-45 text-sm font-sans uppercase tracking-widest text-white">
                        {productCount} Items
                    </span>
                </div>
            </div>
        </div>
    )
})
