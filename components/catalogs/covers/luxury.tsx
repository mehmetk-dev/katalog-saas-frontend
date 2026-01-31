import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function LuxuryCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-[#050505] text-[#D4AF37] flex flex-col overflow-hidden">
            {/* Background Texture - Pattern */}
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 0)', backgroundSize: '32px 32px' }}>
            </div>

            {/* Elegant Border Frame */}
            <div className="absolute inset-6 border border-[#D4AF37]/30 pointer-events-none" />
            <div className="absolute inset-8 border border-[#D4AF37]/60 pointer-events-none" />

            {/* Corner Flourishes (Simulated with simple shapes for now) */}
            <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-[#D4AF37] pointer-events-none" />
            <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-[#D4AF37] pointer-events-none" />
            <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-[#D4AF37] pointer-events-none" />
            <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-[#D4AF37] pointer-events-none" />

            {/* Main Content Area */}
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center p-20 text-center">

                {/* Top Ornament */}
                <div className="w-1 bg-[#D4AF37]/50 h-24 mb-12" />

                {logoUrl ? (
                    <div className="relative w-48 h-24 invert mb-12">
                        {/* Gold filter effect */}
                        <Image
                            src={logoUrl}
                            alt="Logo"
                            fill
                            className="object-contain"
                            style={{ filter: 'brightness(0) sepia(100%) hue-rotate(5deg) saturate(500%) contrast(0.8)' }}
                        />
                    </div>
                ) : (
                    <div className="text-3xl font-serif italic mb-12 tracking-widest text-[#D4AF37]">LUXE</div>
                )}

                <h1 className="font-serif text-7xl md:text-8xl tracking-widest text-[#F5E6C4] mb-4 uppercase scale-y-90">
                    {catalogName}
                </h1>

                <div className="flex items-center gap-6 mb-12 opacity-80">
                    <div className="h-[1px] w-12 bg-[#D4AF37]" />
                    <span className="font-serif italic text-xl text-[#D4AF37]">Premium Collection</span>
                    <div className="h-[1px] w-12 bg-[#D4AF37]" />
                </div>

                {coverImageUrl && (
                    <div className="relative w-64 h-80 mb-12 rounded-t-full overflow-hidden border-4 border-[#D4AF37]/20 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                        <Image src={coverImageUrl} alt="Luxury" fill className="object-cover" />
                        <div className="absolute inset-0 bg-[#D4AF37]/10 mix-blend-overlay" />
                    </div>
                )}


                {coverDescription && (
                    <p className="text-[#F5E6C4]/70 font-serif leading-loose max-w-xl text-lg tracking-wide">
                        {coverDescription}
                    </p>
                )}

                {/* Bottom Ornament */}
                <div className="w-1 bg-[#D4AF37]/50 h-24 mt-auto" />
            </div>

            {/* Year Label */}
            <div className="absolute bottom-12 text-[#D4AF37]/30 font-serif text-[100px] leading-none opacity-20 select-none pointer-events-none">
                {new Date().getFullYear()}
            </div>
        </div>
    )
}
