import React from 'react'
import type { DividerPageProps } from './index'

export function FashionDivider({
    categoryName,
    productCount = 0,
    description,
    primaryColor = '#000000'
}: DividerPageProps) {
    return (
        <div className="relative w-full h-full bg-white text-black font-serif overflow-hidden flex flex-col justify-center items-center p-24">
            {/* Center Line */}
            <div className="absolute inset-y-12 inset-x-1/2 border-l border-black/10" />

            {/* Content */}
            <div className="z-10 text-center max-w-4xl space-y-16 bg-white/90 p-12 backdrop-blur-sm">
                <span className="block text-xs font-sans font-bold uppercase tracking-[0.5em] text-gray-400">
                    Editorial Section
                </span>

                <h2 className="text-9xl font-light italic leading-[0.8] mix-blend-difference mb-8">
                    {categoryName}
                </h2>

                {description && (
                    <div className="border-t border-b border-black py-8 max-w-lg mx-auto">
                        <p className="text-2xl font-light leading-relaxed font-sans">
                            {description}
                        </p>
                    </div>
                )}

                <div className="flex justify-center flex-col items-center gap-4">
                    <span className="text-6xl font-sans font-black">{productCount}</span>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                        New Looks Inside
                    </span>
                </div>
            </div>

            {/* Corner Year */}
            <div className="absolute bottom-12 right-12 text-[200px] leading-none text-gray-50 font-black -z-10 select-none">
                {new Date().getFullYear()}
            </div>
        </div>
    )
}
