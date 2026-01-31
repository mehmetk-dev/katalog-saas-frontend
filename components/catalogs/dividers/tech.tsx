import React from 'react'
import Image from 'next/image'
import type { CategoryDividerProps } from './index'

export function TechDivider({ categoryName, firstProductImage, primaryColor = '#0ea5e9' }: CategoryDividerProps) {
    return (
        <div className="relative w-full h-full bg-[#020617] font-mono text-sky-400 flex items-center justify-center overflow-hidden">
            {/* Grid */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `linear-gradient(${primaryColor}22 1px, transparent 1px), linear-gradient(90deg, ${primaryColor}22 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Scanning Line */}
            <div className="absolute top-0 w-full h-1 bg-sky-500/50 shadow-[0_0_15px_#0ea5e9] animate-[scan_3s_linear_infinite]" />

            <div className="relative z-10 bg-[#020617]/90 border border-sky-500 p-12 backdrop-blur-sm max-w-2xl w-full text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#020617] px-4 text-xs text-sky-500 border border-sky-500/50">
                    SYSTEM PARTITION
                </div>

                <div className="flex items-center justify-center gap-4 mb-6 opacity-70">
                    <span>001</span>
                    <div className="h-px w-20 bg-sky-500" />
                    <span>002</span>
                </div>

                <h2 className="text-6xl font-black text-white mb-2 tracking-tighter shadow-sky-500 drop-shadow-[0_0_5px_rgba(14,165,233,0.8)]">
                    {categoryName}
                </h2>

                <div className="mt-8 flex justify-center gap-2">
                    <span className="w-2 h-2 bg-sky-500 animate-pulse" />
                    <span className="w-2 h-2 bg-sky-500 animate-pulse delay-75" />
                    <span className="w-2 h-2 bg-sky-500 animate-pulse delay-150" />
                </div>
            </div>
        </div>
    )
}
