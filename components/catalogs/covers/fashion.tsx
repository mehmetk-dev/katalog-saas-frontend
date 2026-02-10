import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function FashionCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor: _primaryColor = '#000000'
}: CoverPageProps) {
    const currentYear = new Date().getFullYear();
    const season = new Date().getMonth() > 8 ? 'SONBAHAR / KIŞ' : 'İLKBAHAR / YAZ';

    return (
        <div className="relative w-full h-full bg-white flex flex-col group overflow-hidden">
            {/* Full Screen Background Image */}
            {coverImageUrl ? (
                <div className="absolute inset-0 z-0">
                    <Image src={coverImageUrl} alt="Fashion Cover" fill className="object-cover transition-transform duration-[2s] group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                </div>
            ) : (
                <div className="absolute inset-0 z-0 bg-neutral-200 flex items-center justify-center">
                    <span className="text-9xl text-neutral-300 font-serif italic opacity-40">MODA İKONU</span>
                </div>
            )}

            {/* Top Frame - Magazine Header */}
            <div className="relative z-10 w-full pt-12 text-center">
                {/* Logo Centered or Brand Name */}
                {logoUrl ? (
                    <div className="relative w-64 h-24 mx-auto mb-4 invert drop-shadow-md">
                        <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                    </div>
                ) : (
                    <h2 className="text-white text-xs font-bold tracking-[0.5em] uppercase drop-shadow-md mb-2">Resmi Koleksiyon</h2>
                )}

                {/* Giant Title Overlapping Image */}
                <h1 className="font-serif text-[120px] leading-[0.8] text-white mix-blend-overlay opacity-90 tracking-tighter w-full px-8 break-words text-center drop-shadow-2xl">
                    {catalogName}
                </h1>
            </div>

            {/* Floating Elements on Sides */}
            <div className="absolute left-8 top-1/3 flex flex-col gap-8 z-10">
                <div className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center text-white/80 text-[10px] backdrop-blur-md">
                    YENİ
                </div>
                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold shadow-lg transform -rotate-12">
                    {currentYear}
                </div>
            </div>

            <div className="absolute right-0 top-1/4 h-64 w-12 bg-black/80 backdrop-blur text-white flex items-center justify-center z-10">
                <span className="writing-vertical rotate-180 text-xs font-bold tracking-widest whitespace-nowrap px-2">
                    {season} KOLEKSİYONU
                </span>
            </div>

            {/* Bottom Content Area */}
            <div className="mt-auto relative z-10 p-12 flex justify-between items-end bg-gradient-to-t from-black/90 to-transparent pt-32">
                <div className="max-w-md">
                    <div className="w-12 h-1 bg-white mb-6" />
                    {coverDescription && (
                        <p className="text-white text-xl font-serif italic leading-relaxed drop-shadow-md">
                            "{coverDescription}"
                        </p>
                    )}
                </div>

                {/* Simulated Barcode area */}
                <div className="bg-white p-3 rotate-90 origin-bottom-right translate-x-4">
                    <div className="flex flex-col items-center gap-1">
                        <div className="h-8 w-24 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAABCAYAAAD5g7RNAAAAAXNSR0IArs4c6QAAABJJREFUGFdj/P///38GKgI0jAAApM4PwRyt7QoAAAAASUVORK5CYII=')] bg-repeat-x opacity-80" />
                        <span className="text-[8px] font-mono tracking-[0.3em]">0 12345 67890</span>
                    </div>
                </div>
            </div>

            {/* Thin framing border */}
            <div className="absolute inset-4 border border-white/30 z-20 pointer-events-none" />
        </div>
    )
}
