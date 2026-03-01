import React from 'react'
import type { DividerPageProps } from './index'

export const IndustrialDivider = React.memo(function IndustrialDivider({
    categoryName,
    productCount = 0,
    description,
    primaryColor: _primaryColor = '#FACC15'
}: DividerPageProps) {
    return (
        <div className="relative w-full h-full bg-[#1F2937] text-white font-mono overflow-hidden p-16 flex flex-col justify-between">
            {/* Technical Grid Background */}
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}
            />

            {/* Top Bar */}
            <div className="w-full border-b-2 border-white/20 pb-4 flex justify-between items-end">
                <div className="flex gap-4">
                    <div className="w-4 h-4 bg-[#FACC15]" />
                    <span className="text-xs tracking-[0.2em] font-bold">SECTION ID: X7A9K2</span>
                </div>
                <span className="text-4xl font-bold text-[#FACC15]">items: {productCount}</span>
            </div>

            {/* Main Center */}
            <div className="flex-1 flex flex-col justify-center relative">
                {/* Diagonal Stripe */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)] pointer-events-none" />

                <div className="relative z-10 bg-[#1F2937]/90 border border-white/20 p-12 max-w-4xl">
                    <span className="text-[#FACC15] font-bold text-sm tracking-widest uppercase block mb-4">
                         // Technical Specification
                    </span>
                    <h2 className="text-8xl font-bold uppercase leading-none tracking-tighter mb-8">
                        {categoryName}
                    </h2>
                    {description && (
                        <p className="text-lg text-gray-400 font-light border-l-2 border-[#FACC15] pl-6 py-2">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Warning Bar */}
            <div className="w-full h-12 bg-[#FACC15] text-black flex items-center justify-between px-8 font-bold uppercase tracking-wider">
                <span>Authorized Personnel Only</span>
                <span>Production Line A</span>
            </div>
        </div>
    )
})
