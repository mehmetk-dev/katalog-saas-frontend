import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function BoldCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor = '#000000'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-black text-white flex flex-col font-sans">

            {/* Split Background Layout */}
            <div className="absolute inset-0 flex flex-col">
                {/* Upper 2/3 Image Area */}
                <div className="h-[70%] relative bg-neutral-900 overflow-hidden">
                    {coverImageUrl ? (
                        <div className="w-full h-full relative">
                            <Image src={coverImageUrl} alt="Bold" fill className="object-cover grayscale contrast-125" />
                            {/* Red Overlay Effect */}
                            <div className="absolute inset-0 bg-red-600/40 mix-blend-multiply" />
                            {/* Grain Texture */}
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/noise.png')]" />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                            <span className="text-[150px] font-black opacity-10 uppercase">IMAGE</span>
                        </div>
                    )}

                    {/* OVERSIZED TITLE - Clipping out of bounds */}
                    <div className="absolute bottom-[-60px] left-[-20px] w-[120%] overflow-hidden leading-none z-10 pointer-events-none">
                        <h1 className="text-[160px] font-black tracking-tighter text-white mix-blend-difference whitespace-nowrap"
                            style={{ WebkitTextStroke: '2px white', color: 'transparent' }}>
                            {catalogName.toUpperCase()}
                        </h1>
                        <h1 className="text-[160px] font-black tracking-tighter text-white absolute top-0 left-0 whitespace-nowrap mix-blend-overlay opacity-50">
                            {catalogName.toUpperCase()}
                        </h1>
                    </div>
                </div>

                {/* Lower 1/3 Content Area */}
                <div className="h-[30%] bg-white text-black p-12 flex justify-between items-start relative overflow-hidden">
                    {/* Decorative Big Arrow */}
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-black rounded-full flex items-center justify-center z-0">
                        <div className="text-white text-8xl -rotate-45 mb-4 mr-4">→</div>
                    </div>

                    <div className="flex flex-col justify-between h-full max-w-2xl z-10 relative">
                        <div>
                            <h2 className="text-5xl font-bold leading-none uppercase tracking-tight mb-4">
                                The New<br />Standard.
                            </h2>
                            <div className="w-24 h-4 bg-red-600 mb-6" />
                        </div>

                        {coverDescription && (
                            <p className="font-bold text-xl leading-tight max-w-lg">
                                {coverDescription}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Badges */}
            {logoUrl && (
                <div className="absolute top-0 left-0 bg-white p-6 z-20">
                    <div className="relative w-32 h-12">
                        <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                    </div>
                </div>
            )}

            <div className="absolute top-12 right-12 z-20">
                <div className="bg-red-600 text-white px-4 py-2 text-2xl font-black uppercase -rotate-3 border-4 border-white shadow-[8px_8px_0px_#000]">
                    Vol. 1
                </div>
            </div>
        </div>
    )
}
