import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function LuxuryCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    productCount = 0,
    primaryColor = '#D4AF37'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-[#0a0a0a] text-[#C5A059] overflow-hidden font-serif">
            {/* Subtle Gradient Spotlights */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#C5A059] rounded-full filter blur-[150px] opacity-10" />

            <div className="relative z-10 h-full flex flex-col items-center justify-between py-24 px-12 border-[12px] border-[#111]">
                {/* Top Logo */}
                <div className="mb-12">
                    {logoUrl ? (
                        <div className="relative w-48 h-12">
                            <Image src={logoUrl} alt="Logo" fill className="object-contain filter sepia brightness-50 contrast-150" style={{ color: '#C5A059' }} />
                        </div>
                    ) : (
                        <div className="text-xl tracking-[0.5em] text-[#C5A059] border-b border-[#C5A059] pb-2 uppercase font-light">
                            Maison De Luxe
                        </div>
                    )}
                </div>

                {/* Centerpiece */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-12">
                    <span className="text-xs uppercase tracking-[0.4em] text-white/40">Established 2026</span>

                    <h1 className="text-7xl lg:text-8xl font-medium text-transparent bg-clip-text bg-gradient-to-br from-[#FDFCF5] via-[#C5A059] to-[#8C6D36] text-center italic leading-tight drop-shadow-lg">
                        {catalogName}
                    </h1>

                    {coverImageUrl && (
                        <div className="relative w-72 h-96 border border-[#C5A059]/30 p-2 transform rotate-2 transition duration-1000 hover:rotate-0">
                            <div className="w-full h-full relative overflow-hidden grayscale contrast-125">
                                <Image src={coverImageUrl} alt="Luxury Item" fill className="object-cover" />
                                <div className="absolute inset-0 bg-[#0a0a0a]/20" />
                            </div>
                        </div>
                    )}

                    {coverDescription && (
                        <div className="max-w-md text-center">
                            <p className="text-lg text-white/60 font-light italic leading-relaxed">
                                &quot;{coverDescription}&quot;
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom Signature */}
                <div className="mt-12 text-[10px] uppercase tracking-[0.3em] text-[#C5A059]/50">
                    Exquisite Collection • {productCount} Pieces
                </div>
            </div>
        </div>
    )
}
