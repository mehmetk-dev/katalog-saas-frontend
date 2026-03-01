import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export const MagazineCover = React.memo(function MagazineCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    productCount = 0,
    primaryColor: _primaryColor = '#ef4444'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-[#FAFAF9] text-[#1c1917] overflow-hidden font-serif">
            {/* Masthead */}
            <div className="absolute top-12 w-full text-center z-20">
                {logoUrl ? (
                    <div className="relative w-64 h-24 mx-auto mb-2 mix-blend-multiply">
                        <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                    </div>
                ) : (
                    <h1 className="text-9xl font-medium tracking-tighter text-black mix-blend-multiply opacity-90">
                        KINFOLK
                    </h1>
                )}

                <div className="flex justify-center gap-8 text-xs font-sans font-medium tracking-widest uppercase border-t border-black/10 mt-4 pt-4 w-fit mx-auto px-12">
                    <span>Vol. {new Date().getFullYear()}</span>
                    <span>•</span>
                    <span>The {productCount} Issue</span>
                    <span>•</span>
                    <span>Spring</span>
                </div>
            </div>

            {/* Main Image */}
            <div className="absolute inset-x-12 inset-y-32 z-10">
                {coverImageUrl ? (
                    <div className="w-full h-full relative shadow-sm">
                        <Image src={coverImageUrl} alt="Cover" fill className="object-cover grayscale-[0.2] contrast-[.95] brightness-105" />
                    </div>
                ) : (
                    <div className="w-full h-full bg-[#E5E5E5] flex items-center justify-center text-4xl text-gray-400 italic">
                        Visual
                    </div>
                )}
            </div>

            {/* Headlines */}
            <div className="absolute bottom-40 left-20 z-20 max-w-sm">
                <h2 className="text-5xl font-light italic leading-tight text-white drop-shadow-md mb-4 mix-blend-hard-light">
                    {catalogName}
                </h2>
            </div>

            <div className="absolute bottom-40 right-20 z-20 max-w-xs text-right text-black">
                {coverDescription && (
                    <div className="bg-white/90 p-6 backdrop-blur-sm shadow-sm">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-widest mb-2 block text-gray-500">
                            Featured Story
                        </span>
                        <p className="text-lg leading-relaxed font-light">
                            {coverDescription}
                        </p>
                    </div>
                )}
            </div>

            {/* Barcode Footer */}
            <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t border-black/10 pt-4">
                <div className="flex flex-col text-[10px] font-sans font-bold uppercase tracking-widest text-gray-500">
                    <span>Design & Lifestyle</span>
                    <span>Printed in Istanbul</span>
                </div>

                <div className="flex flex-col items-end">
                    <div className="h-8 w-32 flex justify-end gap-[2px]">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div key={i} className="bg-black w-[1px] h-full" style={{ width: i % 2 === 0 ? '2px' : '1px' }} />
                        ))}
                    </div>
                    <span className="text-[8px] font-mono mt-1">9 771234 567003</span>
                </div>
            </div>
        </div>
    )
})
