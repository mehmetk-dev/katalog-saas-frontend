import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function MagazineCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor = '#ef4444' // Red-500 default
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-white flex flex-col pt-4">
            {/* Top Header Strip */}
            <div className="px-8 flex justify-between items-end border-b-4 border-black pb-2 mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Monthly Issue • No. 42
                </div>
                <div className="font-serif italic text-2xl font-bold flex items-center gap-2">
                    WEEKLY <span className="bg-red-600 text-white text-xs not-italic px-1 font-sans py-0.5">PRO</span>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 relative flex flex-col px-8 pb-8">

                {/* Massive Magazine Header */}
                <h1 className="text-[140px] leading-[0.85] font-black tracking-tighter text-black uppercase mb-4 w-full text-center relative z-10 mix-blend-exclusion text-white">
                    {catalogName.substring(0, 10)}
                    {catalogName.length > 10 && <span className="text-4xl block tracking-normal mt-2">{catalogName.substring(10)}</span>}
                </h1>

                {/* Main Image Layer */}
                <div className="absolute inset-0 top-32 z-0 mx-4">
                    {coverImageUrl ? (
                        <div className="w-full h-[85%] relative shadow-2xl">
                            <Image src={coverImageUrl} alt="Main" fill className="object-cover" />
                            {/* Gradient for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                        </div>
                    ) : (
                        <div className="w-full h-[85%] bg-neutral-200 flex items-center justify-center">
                            <span className="text-6xl font-black text-neutral-300">COVER IMAGE</span>
                        </div>
                    )}
                </div>

                {/* Floating "Teaser" texts on left and right */}
                <div className="relative z-20 flex-1 flex flex-col justify-end pb-12">
                    <div className="flex justify-between items-end">
                        {/* Left Teaser Box */}
                        <div className="bg-white/90 p-6 max-w-xs shadow-lg backdrop-blur border-l-4 border-red-600">
                            <h3 className="font-black text-xl uppercase mb-2">Inside This Issue</h3>
                            <p className="text-sm font-serif leading-tight">
                                Explore our latest collection features, exclusive interviews, and product deep dives.
                            </p>
                        </div>

                        {/* Right Main Description */}
                        {coverDescription && (
                            <div className="bg-black/80 text-white p-8 max-w-sm backdrop-blur shadow-2xl">
                                <h3 className="text-red-500 font-bold uppercase tracking-widest text-xs mb-3">Cover Story</h3>
                                <p className="text-xl font-bold leading-tight">
                                    {coverDescription}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Barcode */}
                <div className="absolute bottom-4 right-8 z-20 bg-white p-2">
                    <div className="h-8 w-32 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAABCAYAAAD5g7RNAAAAAXNSR0IArs4c6QAAABJJREFUGFdj/P///38GKgI0jAAApM4PwRyt7QoAAAAASUVORK5CYII=')] bg-repeat-x" />
                    <div className="flex justify-between text-[8px] font-mono mt-1">
                        <span>$12.99</span>
                        <span>0 71486 01234 5</span>
                    </div>
                </div>

                {/* Logo on top of image */}
                {logoUrl && (
                    <div className="absolute top-40 left-1/2 -translate-x-1/2 z-20 drop-shadow-2xl">
                        <div className="relative w-48 h-24">
                            <Image src={logoUrl} alt="Logo" fill className="object-contain" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
