import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function ArtisticCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor = '#e11d48'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-[#f8f5f2] overflow-hidden">
            {/* Paper Texture Effect */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none mix-blend-multiply" />

            {/* Abstract Paint Blobs (CSS Shapes) */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-300/30 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
            <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-orange-300/30 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />

            {/* Main Content Area - Asymmetric Grid */}
            <div className="relative z-10 w-full h-full p-12 flex flex-col">

                {/* Top Navigation / Brand */}
                <div className="flex justify-between items-center mb-16">
                    {logoUrl ? (
                        <div className="relative w-24 h-24">
                            <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold italic text-xl">A.</div>
                    )}
                    <span className="font-serif italic text-slate-400 text-lg rotate-3 decoration-wavy underline">The Art of Living</span>
                </div>

                {/* Central Composition */}
                <div className="flex-1 relative">
                    {/* Main Image with Blob Mask */}
                    {coverImageUrl && (
                        <div className="absolute top-0 right-0 w-2/3 h-3/4 z-0">
                            <div className="relative w-full h-full shadow-[20px_20px_0px_#0000000d]">
                                <Image
                                    src={coverImageUrl}
                                    alt="Art"
                                    fill
                                    className="object-cover"
                                    style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
                                />
                                {/* Brush Stroke Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-transparent mix-blend-overlay pointer-events-none"
                                    style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }} />
                            </div>
                        </div>
                    )}

                    {/* Typography Overlapping */}
                    <div className="absolute top-1/4 left-0 z-10 max-w-xl">
                        <h1 className="text-8xl font-black text-slate-900 leading-[0.85] tracking-tight mix-blend-hard-light">
                            {catalogName.split(' ').map((word, i) => (
                                <span key={i} className="block" style={{ marginLeft: `${i * 40}px`, transform: `rotate(${i % 2 === 0 ? '-2deg' : '2deg'})` }}>
                                    {word}
                                </span>
                            ))}
                        </h1>
                    </div>

                    {/* Floating Detail Card */}
                    {coverDescription && (
                        <div className="absolute bottom-20 left-10 bg-white p-8 max-w-sm shadow-xl z-20 transform -rotate-2" style={{ borderRadius: '4px 20px 4px 20px' }}>
                            <div className="w-8 h-8 rounded-full bg-rose-500 mb-4" />
                            <p className="font-serif text-lg leading-relaxed text-slate-700">
                                {coverDescription}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Signature */}
                <div className="text-right mt-8">
                    <span className="font-serif italic text-4xl text-slate-300">Curated 2024</span>
                </div>
            </div>
        </div>
    )
}
