import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function BoldCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    productCount = 0,
    primaryColor = '#000000'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-[#E5E5E5] text-black overflow-hidden font-sans selection:bg-black selection:text-white">
            {/* Massive Swiss Typography Background */}
            <div className="absolute top-[-10%] left-[-10%] text-[400px] font-black leading-none opacity-[0.03] select-none pointer-events-none rotate-12">
                BOLD
            </div>

            <div className="relative z-10 w-full h-full grid grid-cols-12 grid-rows-12 p-8 gap-4">
                {/* Header */}
                <div className="col-span-12 row-span-2 flex justify-between items-start border-b-4 border-black pb-4">
                    {logoUrl ? (
                        <div className="relative w-48 h-16">
                            <Image src={logoUrl} alt="Logo" fill className="object-contain object-left grayscale contrast-125" />
                        </div>
                    ) : (
                        <h1 className="text-6xl font-black tracking-tighter uppercase">HELVETIC</h1>
                    )}
                    <div className="flex flex-col items-end">
                        <span className="bg-black text-white px-4 py-1 text-xl font-bold uppercase">Vol. {new Date().getFullYear()}</span>
                        <span className="text-xs font-bold mt-1 tracking-widest uppercase">International Edition</span>
                    </div>
                </div>

                {/* Main Content Block */}
                <div className="col-span-8 row-span-8 relative flex flex-col justify-center pr-12 z-20">
                    <div className="w-24 h-24 bg-[#FF4400] rounded-full absolute -top-12 -left-12 mix-blend-multiply opacity-80 animate-pulse-slow" />

                    <h2 className="text-[100px] leading-[0.85] font-black uppercase tracking-[-0.05em] break-words z-10">
                        {catalogName}
                    </h2>

                    {coverDescription && (
                        <p className="mt-8 text-2xl font-bold leading-tight max-w-lg border-l-8 border-black pl-6">
                            {coverDescription}
                        </p>
                    )}
                </div>

                {/* Image Composition */}
                <div className="col-span-4 row-span-10 relative">
                    {coverImageUrl ? (
                        <div className="w-full h-full relative">
                            {/* Main Image */}
                            <div className="absolute inset-4 z-10 border-4 border-black bg-white">
                                <Image src={coverImageUrl} alt="Cover" fill className="object-cover grayscale contrast-125 transition-all duration-500 hover:grayscale-0" />
                            </div>
                            {/* Offset Decor */}
                            <div className="absolute inset-0 bg-black z-0 transform translate-x-4 translate-y-4" />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center p-8">
                            <span className="text-white font-black text-8xl -rotate-90">VISUAL</span>
                        </div>
                    )}
                </div>

                {/* Footer Big Stats */}
                <div className="col-span-8 row-span-2 flex items-end gap-12 border-t-4 border-black pt-4">
                    <div>
                        <span className="block text-sm font-bold uppercase tracking-widest text-gray-500">Total SKU</span>
                        <span className="text-8xl font-black leading-none tracking-tighter">{productCount}</span>
                    </div>
                    <div className="flex-1 bg-black text-white p-4 flex items-center justify-between">
                        <span className="font-bold text-xl uppercase">Design System</span>
                        <span className="text-4xl">→</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
