import React from 'react'
import type { DividerPageProps } from './index'

export function MagazineDivider({
    categoryName,
    productCount = 0,
    description,
    primaryColor = '#ef4444'
}: DividerPageProps) {
    return (
        <div className="relative w-full h-full bg-[#fdfbf7] text-[#1c1917] font-serif overflow-hidden flex flex-col items-center justify-center p-24 text-center">
            {/* Decorative Top */}
            <div className="mb-16">
                <span className="inline-block border-b-2 border-black pb-2 text-xs font-sans font-bold uppercase tracking-[0.4em] text-gray-400">
                    Feature Story
                </span>
            </div>

            {/* Typography Hero */}
            <div className="max-w-4xl relative">
                <span className="absolute -top-20 -left-20 text-9xl text-stone-200 font-bold -z-10 select-none">“</span>

                <h2 className="text-8xl lg:text-9xl font-light italic leading-none mb-12 text-[#292524]">
                    {categoryName}
                </h2>

                {description && (
                    <p className="text-2xl leading-relaxed text-[#57534e] font-light max-w-2xl mx-auto border-t border-stone-200 pt-12 mt-12">
                        {description}
                    </p>
                )}

                <span className="absolute -bottom-20 -right-20 text-9xl text-stone-200 font-bold -z-10 select-none rotate-180">“</span>
            </div>

            {/* Footer */}
            <div className="mt-24">
                <div className="w-16 h-16 rounded-full border border-stone-300 flex items-center justify-center mx-auto mb-4">
                    <span className="font-sans font-bold text-lg">{productCount}</span>
                </div>
                <span className="font-sans text-[10px] uppercase tracking-widest text-[#a8a29e]">
                    Page {Math.floor(Math.random() * 100)} • Products
                </span>
            </div>
        </div>
    )
}
