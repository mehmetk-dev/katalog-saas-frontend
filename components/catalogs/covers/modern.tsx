import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function ModernCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor: _primaryColor = '#3b82f6'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-slate-50 overflow-hidden flex flex-col">
            {/* Background Graphics */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            {/* Geometric Shapes */}
            <div className="absolute top-20 left-20 w-16 h-16 border-4 border-slate-900/10 rounded-full" />
            <div className="absolute bottom-40 right-20 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-xl rotate-12" />
            <div className="absolute top-1/3 right-12 w-4 h-4 bg-slate-900/20 rounded-full" />

            {/* Content Container */}
            <div className="relative z-10 flex-1 flex flex-col p-16">

                {/* Header Section */}
                <div className="flex justify-between items-start mb-16">
                    <div className="h-1 w-32 bg-slate-900" />
                    <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                        {new Date().getFullYear()} Collection
                    </span>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 grid grid-cols-12 gap-8">
                    {/* Left Typography */}
                    <div className="col-span-12 lg:col-span-7 flex flex-col justify-center">
                        <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full self-start mb-8">
                            New Arrival
                        </div>
                        <h1 className="text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
                            {catalogName}
                        </h1>
                        <div className="w-20 h-2 bg-gradient-to-r from-blue-500 to-purple-600 mb-8" />
                        {coverDescription && (
                            <p className="text-xl text-slate-600 leading-relaxed max-w-lg font-light">
                                {coverDescription}
                            </p>
                        )}
                    </div>

                    {/* Right Image/Visual */}
                    <div className="col-span-12 lg:col-span-5 relative mt-8 lg:mt-0">
                        {coverImageUrl ? (
                            <div className="relative w-full h-full min-h-[400px] rounded-[2rem] overflow-hidden shadow-2xl rotate-3 transition-transform hover:rotate-0">
                                <Image src={coverImageUrl} alt="Cover" fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                            </div>
                        ) : (
                            <div className="relative w-full h-full min-h-[400px] rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center rotate-3">
                                <div className="text-slate-300 font-black text-4xl uppercase opacity-50">Visual Area</div>
                            </div>
                        )}

                        {/* Floating elements over image */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl z-20 max-w-[200px]">
                            <div className="text-xs text-slate-500 font-bold uppercase mb-1">Total Items</div>
                            <div className="text-3xl font-black text-slate-900">124+</div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-end">
                    {logoUrl ? (
                        <div className="relative w-40 h-16">
                            <Image src={logoUrl} alt="Logo" fill sizes="(max-width: 768px) 100vw, 200px" className="object-contain object-left" />
                        </div>
                    ) : (
                        <div className="text-2xl font-bold tracking-tighter text-slate-900">BRAND.</div>
                    )}

                    <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Designed by</div>
                        <div className="text-sm font-semibold text-slate-700">Katalog Studio</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
