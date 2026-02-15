import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function FashionCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    productCount = 0,
    primaryColor = '#000000'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-white text-black overflow-hidden font-sans">
            {/* Full Height Image Split */}
            <div className="absolute right-0 top-0 w-full h-full">
                {coverImageUrl ? (
                    <Image src={coverImageUrl} alt="Model" fill className="object-cover object-top filter contrast-110" />
                ) : (
                    <div className="w-full h-full bg-neutral-200" />
                )}
                {/* Gradient Mesh Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent opacity-90 lg:opacity-60" />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-end p-12 lg:p-20 max-w-4xl">
                {/* Vertical Text */}
                <div className="absolute top-12 right-12 text-xs font-bold tracking-[0.5em] uppercase text-black rotate-90 origin-top-right mix-blend-difference text-white">
                    Spring / Summer 2026 Collection
                </div>

                {/* Main Headline */}
                <h1 className="text-[120px] font-black leading-[0.8] tracking-tighter mix-blend-difference text-white mb-8 uppercase break-words">
                    {catalogName}
                </h1>

                <div className="flex gap-12 text-sm font-bold tracking-widest uppercase mix-blend-difference text-white border-t border-white pt-8 w-fit">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full" />
                        <span>Editorial</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full" />
                        <span>{productCount} Looks</span>
                    </div>
                    {coverDescription && (
                        <div className="max-w-xs normal-case tracking-normal font-medium opacity-80">
                            {coverDescription}
                        </div>
                    )}
                </div>
            </div>

            {/* Logo Overlay */}
            <div className="absolute top-12 left-12 z-20 mix-blend-difference text-white">
                {logoUrl ? (
                    <div className="relative w-40 h-12">
                        <Image src={logoUrl} alt="Brand" fill className="object-contain object-left brightness-0 invert" />
                    </div>
                ) : (
                    <span className="text-3xl font-serif italic font-bold">MODE.</span>
                )}
            </div>
        </div>
    )
}
