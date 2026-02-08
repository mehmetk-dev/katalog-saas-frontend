import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function IndustrialCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor: _primaryColor = '#facc15'
}: CoverPageProps) {
    const currentYear = new Date().getFullYear();

    return (
        <div className="relative w-full h-full bg-[#0a0a0a] text-white font-mono overflow-hidden flex flex-col">
            {/* Technical Engineering Grid */}
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
                    backgroundSize: '10px 10px'
                }}
            />

            {/* Heavy Duty Hazard Strip - Top */}
            <div className="relative w-full h-8 bg-yellow-400 flex overflow-hidden shrink-0 z-20">
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 20px, transparent 20px, transparent 40px)'
                    }}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative z-10 flex flex-col p-12 lg:p-16">

                {/* Header: Project Badge & Logo */}
                <div className="flex justify-between items-start mb-16">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <span className="bg-yellow-400 text-black px-2 py-0.5 text-[10px] font-black tracking-tighter">AUTHENTIC IND.</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">SERIES v2.4</span>
                        </div>
                        <div className="text-2xl font-black text-white tracking-widest mt-1">
                            SPECIFICATION <span className="text-yellow-400">DOC</span>
                        </div>
                    </div>

                    {logoUrl && (
                        <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl flex items-center justify-center transform hover:rotate-3 transition-transform">
                            <Image src={logoUrl} alt="Logo" fill className="object-contain p-4" />
                        </div>
                    )}
                </div>

                {/* Massive Industrial Heading */}
                <div className="mb-12 relative">
                    <h1 className="text-[clamp(4rem,10vw,8rem)] font-black uppercase leading-[0.85] tracking-tighter text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        {catalogName}
                    </h1>
                    <div className="mt-6 flex items-center gap-4">
                        <div className="h-0.5 w-24 bg-yellow-400" />
                        <span className="text-xs font-black tracking-[0.4em] text-yellow-400/80 uppercase">Structural Overview // {currentYear}</span>
                    </div>
                </div>

                {/* Main Component Visualization */}
                <div className="flex-1 relative flex gap-8">
                    {/* Visual Card */}
                    <div className="flex-1 relative border border-white/10 bg-white/[0.02] p-2 rounded-sm overflow-hidden group">
                        {/* Internal Borders */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-400 z-20" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-yellow-400 z-20" />

                        <div className="w-full h-full relative bg-[#111] overflow-hidden">
                            {coverImageUrl ? (
                                <>
                                    <Image src={coverImageUrl} alt="Asset" fill className="object-cover opacity-70 group-hover:scale-105 group-hover:opacity-100 transition-all duration-[5s]" />
                                    {/* Tech Overlay */}
                                    <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5" />
                                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-yellow-400/10" />
                                    <div className="absolute left-1/2 top-0 h-full w-[1px] bg-yellow-400/10" />
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/10">
                                    <div className="text-white/5 text-[100px] font-black rotate-[-15deg]">IND-TECH</div>
                                    <span className="text-[10px] text-yellow-400/30 uppercase tracking-[0.5em] mt-8">Schematic Area</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Technical Side Details - Vertical Layout */}
                    <div className="hidden lg:flex w-64 flex-col gap-6">
                        <div className="p-4 border-l-2 border-yellow-400 bg-white/5">
                            <h4 className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">Status</h4>
                            <p className="text-xs font-bold text-slate-300">PRODUCTION READY</p>
                        </div>
                        <div className="p-4 border-l-2 border-white/10 bg-white/5">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Verification</h4>
                            <p className="text-xs font-bold text-slate-300 italic">ISO-9001 CERTIFIED</p>
                        </div>
                        <div className="mt-auto">
                            <div className="text-[40px] font-black text-white/10 tracking-widest transform rotate-90 origin-right translate-x-12 translate-y-12 select-none">
                                Q1.REPORT
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Description */}
                <div className="mt-12 max-w-2xl bg-white/[0.03] p-8 border-t border-white/10 backdrop-blur-md">
                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.5em] mb-4 block italic">Technical Summary</span>
                    <p className="text-lg font-bold leading-relaxed text-slate-300 uppercase italic tracking-wide">
                        {coverDescription || "Complete systems documentation defining architectural standards and modular component selections for large scale industrial implementations."}
                    </p>
                </div>
            </div>

            {/* Bottom Hazard Bar */}
            <div className="relative w-full h-12 bg-yellow-400 flex items-center px-12 overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 30px, transparent 30px, transparent 60px)'
                    }}
                />
                <div className="relative flex justify-between w-full text-black text-xs font-black italic tracking-tighter uppercase px-4 py-1 bg-yellow-400 border-2 border-black shadow-[4px_4px_0px_#000]">
                    <span>SYSTEM IDENTIFICATION: CLASS-III CORE</span>
                    <span>TIMESTAMP: {new Date().toISOString().split('T')[0]}</span>
                </div>
            </div>
        </div>
    )
}
