import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function IndustrialCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor = '#facc15' // Yellow-400
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-[#1a1a1a] text-white font-sans overflow-hidden">
            {/* Blueprint Grid Background */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Hazard Stripes - Top and Bottom */}
            <div className="absolute top-0 w-full h-4 bg-yellow-400"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #facc15 10px, #facc15 20px)' }} />
            <div className="absolute bottom-0 w-full h-12 bg-yellow-400 flex items-center px-4 font-black text-black tracking-tighter"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 20px, #facc15 20px, #facc15 40px)' }}>
                <div className="bg-yellow-400 px-4 py-1 z-10 border-2 border-black shadow-[4px_4px_0px_#000]">
                    HEAVY DUTY CATALOG // 2024 SERIES
                </div>
            </div>

            {/* Main Layout - Split with diagonal cut */}
            <div className="absolute inset-0 z-10 p-12 flex flex-col">

                {/* Header Block */}
                <div className="flex justify-between items-start mb-12">
                    <div className="border-l-4 border-yellow-400 pl-4">
                        <div className="text-xs text-yellow-400 font-bold tracking-[0.2em] mb-1">SPECIFICATION DOC</div>
                        <div className="text-xs text-gray-400">REF: {Math.floor(Math.random() * 10000)}</div>
                    </div>
                    {logoUrl && (
                        <div className="relative w-40 h-16 bg-white/10 p-2 border border-white/20">
                            <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                        </div>
                    )}
                </div>

                {/* Main Title - Stencil Style */}
                <h1 className="text-6xl font-black uppercase tracking-tighter text-transparent stroke-white stroke-2 mb-2"
                    style={{ WebkitTextStroke: '2px white' }}>
                    {catalogName}
                </h1>
                <h1 className="text-6xl font-black uppercase tracking-tighter text-yellow-400 mb-8 -mt-12 ml-1">
                    {catalogName}
                </h1>

                {/* Image Area with "Technical Drawing" overlay */}
                <div className="relative flex-1 border-2 border-white/20 bg-[#2a2a2a] p-2">
                    {/* Corner Marks */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-400" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-400" />

                    {coverImageUrl ? (
                        <div className="relative w-full h-full grayscale hover:grayscale-0 transition-all duration-500">
                            <Image src={coverImageUrl} alt="Industrial" fill className="object-cover" />
                            {/* Measurement Lines Overlay */}
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/30" />
                            <div className="absolute left-1/2 top-0 h-full w-[1px] bg-white/30" />
                            <div className="absolute top-1/2 left-1/2 text-[9px] text-yellow-400 bg-black p-1 -translate-y-1/2 -translate-x-1/2 border border-yellow-400">
                                1200mm
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/50">
                            <span className="text-yellow-400 font-mono">NO SCHEMATIC LOADED</span>
                        </div>
                    )}
                </div>

                {/* Description Box */}
                <div className="mt-8 grid grid-cols-2 gap-8">
                    <div className="bg-[#262626] p-4 border-t-2 border-yellow-400">
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Description</h3>
                        <p className="text-sm text-gray-300 leading-relaxed font-mono">
                            {coverDescription || "No description available for this unit."}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 justify-end items-end">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">APPROVED BY</span>
                            <div className="h-px w-24 bg-gray-600" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">DATE</span>
                            <span className="text-xs font-mono text-yellow-400">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
