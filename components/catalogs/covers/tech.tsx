import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function TechCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor = '#0ea5e9' // Sky-500
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-[#020617] font-mono text-sky-400 overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: `linear-gradient(${primaryColor}22 1px, transparent 1px), linear-gradient(90deg, ${primaryColor}22 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)'
                }}
            />

            {/* Glowing Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

            {/* Code/Data Rain Effect - Static Decoration */}
            <div className="absolute top-0 right-10 w-48 h-full opacity-20 flex flex-col text-[10px] items-end pt-20 leading-tight select-none">
                {Array.from({ length: 40 }).map((_, i) => (
                    <span key={i} style={{ opacity: 0.1 + (i % 5) * 0.1 }}>01001010 1101 ({i})</span>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="absolute inset-0 z-10 flex flex-col p-16">
                {/* Header Status Bar */}
                <div className="w-full h-12 border-b border-sky-500/30 flex items-center justify-between mb-20 bg-[#020617]/50 backdrop-blur">
                    <div className="flex items-center gap-4">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                        <span className="text-xs tracking-widest text-sky-500">SİSTEM_HAZIR</span>
                    </div>
                    <span className="text-xs text-slate-600">V.2.0.24</span>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-4xl relative">
                    {/* Bracket Decorations */}
                    <div className="absolute -left-8 -top-8 w-16 h-16 border-t-2 border-l-2 border-sky-500/50" />
                    <div className="absolute -right-8 -bottom-8 w-16 h-16 border-b-2 border-r-2 border-sky-500/50" />

                    <h1 className="text-8xl font-black text-white mb-6 tracking-tighter mix-blend-screen drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                        {catalogName}
                    </h1>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-2/3 h-full bg-gradient-to-r from-sky-500 to-purple-500" />
                        </div>
                        <span className="text-xs text-sky-500">VERİ YÜKLENİYOR...</span>
                    </div>

                    {coverDescription && (
                        <div className="bg-sky-500/5 border-l-4 border-sky-500 p-6 backdrop-blur-sm max-w-2xl">
                            <p className="text-sky-200/80 text-lg leading-relaxed">
                                <span className="text-sky-500 mr-2">{`>`}</span>
                                {coverDescription}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Image & Logo */}
                <div className="mt-auto flex items-end justify-between">
                    {coverImageUrl && (
                        <div className="relative w-64 h-40 border border-sky-500/30 p-1 bg-[#020617]/80">
                            {/* Scanning line animation */}
                            <div className="absolute inset-0 z-20 border-b border-sky-400/50 animate-[scan_3s_linear_infinite]" style={{ height: '0%' }} />
                            <Image src={coverImageUrl} alt="Tech" fill className="object-cover opacity-60 grayscale hover:grayscale-0 transition-all" />
                            <div className="absolute bottom-1 right-1 bg-sky-500 text-[#020617] text-[10px] font-bold px-1">GÖRSEL_01</div>
                        </div>
                    )}

                    {logoUrl && (
                        <div className="relative w-40 h-20 opacity-80 grayscale hover:grayscale-0 transition-all">
                            <Image src={logoUrl} alt="Logo" fill className="object-contain object-right" />
                        </div>
                    )}
                </div>
            </div>

            {/* Background Image overlay if exists for texture */}
            {coverImageUrl && (
                <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
                    <Image src={coverImageUrl} alt="Texture" fill className="object-cover" />
                </div>
            )}
        </div>
    )
}
