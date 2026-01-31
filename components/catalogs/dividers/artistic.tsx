import React from 'react'
import Image from 'next/image'
import type { CategoryDividerProps } from './index'

export function ArtisticDivider({ categoryName, firstProductImage, primaryColor = '#e11d48' }: CategoryDividerProps) {
    return (
        <div className="relative w-full h-full bg-[#f8f5f2] flex items-center justify-center overflow-hidden">
            {/* Texture */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] mix-blend-multiply" />

            {/* Paint Splashes */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-rose-300/30 rounded-full blur-3xl mix-blend-multiply" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-300/30 rounded-full blur-3xl mix-blend-multiply" />

            <div className="relative z-10 text-center transform -rotate-3">
                <h2 className="text-8xl font-black text-slate-800 leading-none mix-blend-hard-light mb-4 text-balanced px-6">
                    {categoryName}
                </h2>
                <div className="inline-block bg-white px-6 py-2 shadow-lg transform rotate-2">
                    <span className="font-serif italic text-2xl text-rose-500">Curated Selection</span>
                </div>
            </div>
        </div>
    )
}
