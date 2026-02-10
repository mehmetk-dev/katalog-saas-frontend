import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function BoldCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor = '#e11d48' // rose-600
}: CoverPageProps) {
    const currentYear = new Date().getFullYear();

    return (
        <div className="relative w-full h-full bg-slate-950 text-white flex flex-col font-sans overflow-hidden group">

            {/* Main Visual Section (70%) */}
            <section className="relative h-[65%] w-full overflow-hidden bg-slate-900">
                {coverImageUrl ? (
                    <div className="w-full h-full relative">
                        <Image
                            src={coverImageUrl}
                            alt="Visual"
                            fill
                            className="object-cover grayscale hover:grayscale-0 transition-all duration-[2s] scale-105 group-hover:scale-110"
                        />
                        {/* Dynamic Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                        <div
                            className="absolute inset-0 opacity-40 mix-blend-multiply"
                            style={{ backgroundColor: primaryColor }}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <div className="text-white/5 font-black text-[12vw] tracking-tighter italic">GALERİ.OBJ</div>
                    </div>
                )}

                {/* LOGO - Top Left (floating) */}
                {logoUrl && (
                    <div className="absolute top-10 left-10 z-30">
                        <div className="bg-white p-4 shadow-2xl relative">
                            <div className="relative w-24 h-10 lg:w-32 lg:h-12">
                                <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ISSUE BADGE - Top Right */}
                <div className="absolute top-10 right-10 z-30">
                    <div
                        className="text-white px-4 py-2 font-black text-xl lg:text-2xl uppercase border-4 border-white shadow-[10px_10px_0px_rgba(0,0,0,0.3)] bg-slate-950 -rotate-3"
                    >
                        YENİ BAS.
                    </div>
                </div>

                {/* MASSIVE RESPONSIVE TITLE */}
                <div className="absolute bottom-0 left-0 w-full p-10 lg:p-16 z-20">
                    <h1
                        className="text-[clamp(48px,9vw,160px)] font-black italic tracking-tighter leading-[0.85] text-white uppercase drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                    >
                        {catalogName}
                    </h1>
                </div>
            </section>

            {/* Content & Details Section (35%) */}
            <section className="flex-1 bg-white text-slate-950 p-10 lg:p-16 flex flex-col justify-between relative overflow-hidden">

                {/* Visual Flair: Giant Arrow */}
                <div className="absolute -right-8 -bottom-8 w-48 h-48 lg:w-72 lg:h-72 bg-slate-950 rounded-full flex items-start justify-start p-10 z-0">
                    <svg className="w-24 h-24 lg:w-32 lg:h-32 text-white -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col gap-2 mb-8">
                        <h2 className="text-4xl lg:text-6xl font-black italic uppercase leading-none tracking-tight">
                            Yeni<br />Perspektif.
                        </h2>
                        <div className="h-4 w-32" style={{ backgroundColor: primaryColor }} />
                    </div>

                    {coverDescription && (
                        <p className="max-w-2xl text-xl lg:text-2xl font-bold leading-tight uppercase tracking-tight text-slate-700">
                            {coverDescription}
                        </p>
                    )}
                </div>

                {/* Small Prints */}
                <div className="relative z-10 flex justify-between items-end border-t border-slate-200 pt-6">
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>KUR. {currentYear}</span>
                        <span>TASARIM.SIS v3</span>
                    </div>
                    <div className="font-mono text-[10px] font-bold text-slate-400">
                        KAT-REF // {currentYear}-ALPHA
                    </div>
                </div>
            </section>
        </div>
    )
}
