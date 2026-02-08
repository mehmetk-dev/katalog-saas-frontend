import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function LuxuryCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor: _primaryColor = '#D4AF37'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-[#080808] text-[#e5d5b0] flex flex-col overflow-hidden font-serif">
            {/* Background Texture - Minimalist Luxury Dots */}
            <div className="absolute inset-0 opacity-[0.08]"
                style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #D4AF37 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Elegant Double Frame */}
            <div className="absolute inset-8 border border-[#D4AF37]/20 pointer-events-none z-0" />
            <div className="absolute inset-10 border border-[#D4AF37]/40 pointer-events-none z-0" />

            {/* Flourishes */}
            <div className="absolute top-10 left-10 w-12 h-12 border-t border-l border-[#D4AF37] pointer-events-none" />
            <div className="absolute top-10 right-10 w-12 h-12 border-t border-r border-[#D4AF37] pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-12 h-12 border-b border-l border-[#D4AF37] pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-12 h-12 border-b border-r border-[#D4AF37] pointer-events-none" />

            {/* Side Labels */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[10px] tracking-[0.8em] font-sans text-[#D4AF37]/40 uppercase whitespace-nowrap hidden lg:block">
                Limited Edition Collection
            </div>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-12 text-center">

                {/* Logo Section */}
                {logoUrl ? (
                    <div className="relative w-56 h-28 mb-12">
                        {/* Enhanced readability: No more full invert contrast, use a glow backdrop */}
                        <div className="absolute inset-0 blur-2xl bg-[#D4AF37]/10 rounded-full" />
                        <Image
                            src={logoUrl}
                            alt="Logo"
                            fill
                            className="object-contain"
                            style={{
                                filter: 'brightness(1.5) contrast(1.1) drop-shadow(0 0 8px rgba(212,175,55,0.3))'
                            }}
                        />
                    </div>
                ) : (
                    <div className="text-sm font-sans font-black tracking-[0.5em] mb-12 text-[#D4AF37] uppercase">
                        — Private Select —
                    </div>
                )}

                {/* Main Title - Responsive sizing */}
                <h1 className="text-[clamp(40px,8vw,100px)] font-serif italic tracking-widest text-white leading-tight mb-8 drop-shadow-2xl">
                    {catalogName}
                </h1>

                <div className="flex items-center gap-8 mb-16 px-4">
                    <div className="h-[1px] flex-1 min-w-[40px] bg-[#D4AF37]/40" />
                    <span className="text-xs font-sans font-bold tracking-[0.4em] text-[#D4AF37] uppercase shrink-0">Est. {new Date().getFullYear()}</span>
                    <div className="h-[1px] flex-1 min-w-[40px] bg-[#D4AF37]/40" />
                </div>

                {/* Center Image - Portal style */}
                {coverImageUrl && (
                    <div className="mb-12 relative">
                        <div className="w-64 h-80 rounded-[120px] overflow-hidden border border-[#D4AF37]/30 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-slate-900 group">
                            <Image
                                src={coverImageUrl}
                                alt="Luxury Heritage"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-[4s]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                        </div>
                        {/* Decorative Badge */}
                        <div className="absolute -bottom-4 -right-4 bg-[#D4AF37] text-black w-14 h-14 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xl">
                            ORIGIN
                        </div>
                    </div>
                )}

                {/* Description - Increased readability */}
                {coverDescription && (
                    <p className="max-w-xl text-lg font-serif italic leading-relaxed text-[#e5d5b0]/90 tracking-wide">
                        "{coverDescription}"
                    </p>
                )}

            </main>

            {/* Elegant Year Background Detail */}
            <div className="absolute -bottom-8 -left-8 text-[clamp(100px,20vw,240px)] leading-none font-serif font-black text-white/[0.03] select-none pointer-events-none italic">
                {new Date().getFullYear()}
            </div>

            {/* Subtle light leak */}
            <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />
        </div>
    )
}
