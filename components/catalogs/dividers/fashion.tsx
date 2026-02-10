import React from 'react'
import Image from 'next/image'
import type { CategoryDividerProps } from './index'

export function FashionDivider({ categoryName, firstProductImage, primaryColor: _primaryColor }: CategoryDividerProps) {
    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
            {firstProductImage ? (
                <div className="absolute inset-0 opacity-40">
                    <Image src={firstProductImage} alt="Background" fill className="object-cover blur-sm scale-110" />
                    <div className="absolute inset-0 bg-black/30 mix-blend-multiply" />
                </div>
            ) : (
                <div className="absolute inset-0 bg-neutral-900" />
            )}

            <div className="relative z-10 w-full px-8 text-center border-y border-white/30 py-12 backdrop-blur-sm bg-black/20">
                <span className="text-white/80 text-[10px] tracking-[0.5em] uppercase block mb-4">Koleksiyon</span>
                <h2 className="font-serif text-8xl text-white italic tracking-tighter mix-blend-overlay opacity-90 break-words">
                    {categoryName}
                </h2>
            </div>
        </div>
    )
}
