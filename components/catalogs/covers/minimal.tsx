import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function MinimalCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor: _primaryColor = '#000000'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-[#f3f4f6] text-black font-sans p-16 flex flex-col">
            {/* The "Minimal" rich aesthetic: Bauhaus structure */}

            {/* Grid Guidelines (Decorative) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-black/5" />
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/5" />
            <div className="absolute right-24 top-0 bottom-0 w-[1px] bg-black/5" />
            <div className="absolute left-24 top-0 bottom-0 w-[1px] bg-black/5" />

            {/* Header */}
            <div className="flex justify-between items-start mb-24 relative z-10">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Sayı</span>
                    <span className="text-4xl font-light font-serif">01</span>
                </div>
                {logoUrl ? (
                    <div className="relative w-40 h-12 grayscale opacity-80">
                        <Image src={logoUrl} alt="Logo" fill className="object-contain object-right" />
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                        <span className="font-bold tracking-widest text-sm">MİNİMALİST.</span>
                    </div>
                )}
            </div>

            {/* Main Content - Asymmetric Balance */}
            <div className="flex-1 grid grid-cols-2 gap-20 relative z-10 px-8">
                {/* Left: Typography */}
                <div className="flex flex-col justify-center text-right border-r border-black/10 pr-12">
                    <div className="mb-8 flex justify-end">
                        <div className="w-12 h-1 bg-black" />
                    </div>
                    <h1 className="text-7xl font-medium tracking-tight leading-none mb-12">
                        {catalogName}
                        <span className="text-red-600">.</span>
                    </h1>
                    {coverDescription && (
                        <p className="text-gray-500 font-light text-xl leading-relaxed ml-auto max-w-sm">
                            {coverDescription}
                        </p>
                    )}
                </div>

                {/* Right: Image - Structured */}
                <div className="relative h-full flex items-center justify-start pl-4">
                    <div className="relative w-3/4 aspect-[3/4] shadow-[30px_30px_0px_rgba(0,0,0,0.05)] border border-white/50 bg-white p-2">
                        {coverImageUrl ? (
                            <div className="relative w-full h-full grayscale hover:grayscale-0 transition-all duration-700">
                                <Image src={coverImageUrl} alt="Minimal" fill className="object-cover" />
                            </div>
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-dashed border-gray-300">
                                <span className="text-xs font-mono text-gray-400">ŞEKİL 1.0</span>
                            </div>
                        )}

                        {/* Red Accent Square - Bauhaus Element */}
                        <div className="absolute -top-4 -left-4 w-16 h-16 bg-red-600 mix-blend-multiply z-20 opacity-80" />
                        <div className="absolute -bottom-4 -right-4 w-16 h-16 border-2 border-black z-20" />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-12 border-t border-black/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                <div className="flex items-center gap-8">
                    <span>İndeks</span>
                    <span className="text-black">Önsöz</span>
                    <span>Katalog</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>Tasarım Sistemi</span>
                    <div className="w-4 h-[1px] bg-gray-400" />
                    <span>2024</span>
                </div>
            </div>
        </div>
    )
}
