import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function MagazineCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor = '#ef4444'
}: CoverPageProps) {
    const currentYear = new Date().getFullYear();

    return (
        <div className="relative w-full h-full bg-[#fcfcfc] flex flex-col overflow-hidden font-sans text-slate-900">
            {/* Top Magazine Header - High End Label */}
            <header className="px-10 pt-8 pb-4 flex justify-between items-baseline border-b border-black/10 z-20">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Monthly Issue</span>
                    <div className="h-[1px] w-12 bg-black/10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Vol. {currentYear % 100} — No. 04</span>
                </div>

                {/* Brand Logo Integration */}
                {logoUrl ? (
                    <div className="relative h-8 w-24">
                        <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                    </div>
                ) : (
                    <div className="font-serif italic text-xl font-black tracking-tighter">
                        LIFESTYLE <span className="not-italic text-sm font-light tracking-widest ml-1 text-slate-400">PRO</span>
                    </div>
                )}
            </header>

            <main className="flex-1 relative flex flex-col p-10">
                {/* Background Image Container */}
                <div className="absolute inset-0 z-0">
                    {coverImageUrl ? (
                        <div className="w-full h-full relative">
                            <Image
                                src={coverImageUrl}
                                alt="Cover"
                                fill
                                className="object-cover"
                                priority
                            />
                            {/* Sophisticated Gradients */}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white via-white/80 to-transparent" />
                            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/20 to-transparent opacity-40" />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <div className="text-slate-200 font-serif italic text-8xl -rotate-12 opacity-50">LIFESTYLE</div>
                        </div>
                    )}
                </div>

                {/* Main Heading - Modern Magazine Style */}
                <div className="relative z-10 flex-1 flex flex-col justify-between">
                    <div className="pt-4">
                        <h1
                            className="text-[clamp(60px,12vh,110px)] font-black leading-[0.85] tracking-[-0.05em] uppercase text-slate-900 max-w-2xl"
                            style={{
                                textShadow: '0 10px 30px rgba(255,255,255,0.5)',
                                mixBlendMode: coverImageUrl ? 'normal' : 'normal'
                            }}
                        >
                            {catalogName}
                        </h1>
                        <div className="h-2 w-24 mt-6" style={{ backgroundColor: primaryColor }} />
                    </div>

                    {/* Secondary Headlines - Typical Magazine Covers */}
                    <div className="flex justify-between items-end gap-12">
                        {/* Left Side: Headlines */}
                        <div className="flex flex-col gap-6 max-w-xs">
                            <article className="border-l-2 pl-4 py-1" style={{ borderColor: primaryColor }}>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Trends</h4>
                                <h3 className="text-xl font-bold leading-tight uppercase tracking-tight">The Future of Modern Design</h3>
                            </article>
                            <article className="border-l-2 pl-4 py-1 border-slate-300">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Exclusive</h4>
                                <h3 className="text-xl font-bold leading-tight uppercase tracking-tight">Behind the Curated Collection</h3>
                            </article>
                        </div>

                        {/* Right Side: Cover Description Box */}
                        <div className="flex flex-col items-end text-right">
                            {coverDescription && (
                                <div className="bg-white p-8 shadow-[20px_20px_60px_-15px_rgba(0,0,0,0.1)] border-t-8 border-slate-900 max-w-sm">
                                    <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] mb-4 py-1 px-2 bg-slate-100 italic">Feature Story</span>
                                    <p className="text-2xl font-serif italic leading-[1.1] text-slate-900">
                                        "{coverDescription}"
                                    </p>
                                    <div className="mt-6 flex justify-end gap-2 text-[10px] font-bold uppercase tracking-widest">
                                        <span>Read More</span>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Bar */}
            <footer className="px-10 py-6 bg-white border-t border-black/5 flex justify-between items-center z-20">
                <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-widest">
                    <span>Premium Edition</span>
                    <span className="text-slate-300">/</span>
                    <span style={{ color: primaryColor }}>Interiors</span>
                    <span className="text-slate-300">/</span>
                    <span>Style</span>
                </div>

                {/* Price & Barcode Area */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold">$12.99 USD</span>
                        <span className="text-[10px] font-bold">14.00 EUR</span>
                    </div>
                    <div className="bg-white p-2 border border-slate-100">
                        <div className="h-6 w-24 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAABCAYAAAD5g7RNAAAAAXNSR0IArs4c6QAAABJJREFUGFdj/P///38GKgI0jAAApM4PwRyt7QoAAAAASUVORK5CYII=')] bg-repeat-x opacity-60" />
                        <div className="flex justify-between text-[7px] font-mono mt-0.5 tracking-tighter">
                            <span>071486</span>
                            <span>012345</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
