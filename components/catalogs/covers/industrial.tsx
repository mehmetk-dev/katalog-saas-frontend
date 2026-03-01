import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export const IndustrialCover = React.memo(function IndustrialCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    productCount = 0,
    primaryColor: _primaryColor = '#FACC15'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-[#1F2937] text-white overflow-hidden font-mono">
            {/* Grid Texture */}
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Left Info Panel */}
            <div className="absolute left-0 top-0 w-[40%] h-full bg-[#111827] border-r border-white/20 p-12 flex flex-col justify-between z-20">
                <div className="space-y-8">
                    {logoUrl ? (
                        <div className="relative w-40 h-16">
                            <Image src={logoUrl} alt="Logo" fill className="object-contain object-left grayscale brightness-200" />
                        </div>
                    ) : (
                        <div className="border-2 border-white/40 p-2 w-fit">
                            <h1 className="text-2xl font-bold tracking-tighter">IND.SPEC</h1>
                        </div>
                    )}

                    <div className="pt-12">
                        <span className="text-xs text-[#FACC15] block mb-2 tracking-[0.2em] uppercase">Project Name</span>
                        <h2 className="text-6xl font-bold uppercase leading-none break-words text-white">
                            {catalogName}
                        </h2>
                    </div>

                    {coverDescription && (
                        <div className="border-l-2 border-[#FACC15] pl-4 py-2 bg-white/5">
                            <p className="text-xs text-slate-300 leading-relaxed uppercase tracking-wide">
                                {coverDescription}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/20 pb-2">
                        <span className="text-[10px] uppercase text-slate-500">Status</span>
                        <span className="text-sm font-bold text-[#FACC15]">APPROVED FOR PROD</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/20 pb-2">
                        <span className="text-[10px] uppercase text-slate-500">Unit Count</span>
                        <span className="text-sm font-bold">{productCount}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/20 pb-2">
                        <span className="text-[10px] uppercase text-slate-500">Ref No</span>
                        <span className="text-sm font-bold">XJ-2026-A1</span>
                    </div>
                </div>
            </div>

            {/* Right Image Panel */}
            <div className="absolute right-0 top-0 w-[60%] h-full bg-[#374151]">
                {coverImageUrl ? (
                    <div className="w-full h-full relative">
                        <Image src={coverImageUrl} alt="Industrial" fill className="object-cover grayscale hover:grayscale-0 transition duration-500" />
                        <div className="absolute inset-0 bg-[#FACC15]/10 mix-blend-color" />

                        {/* Centered Crosshair */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-px bg-white/20" />
                            <div className="h-full w-px bg-white/20 absolute" />
                            <div className="w-20 h-20 border border-white/50 rounded-full" />
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                        <div className="w-64 h-64 border border-dashed border-white/30 rounded-full flex items-center justify-center">
                            <span className="text-xs tracking-widest uppercase">No Schematic Loaded</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
})
