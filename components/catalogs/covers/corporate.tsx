import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export const CorporateCover = React.memo(function CorporateCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    productCount = 0,
    primaryColor: _primaryColor = '#2563EB'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-white text-slate-800 overflow-hidden font-sans">
            {/* Swiss Grid Background */}
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '100px 100px' }}
            />

            <div className="relative z-10 w-full h-full grid grid-cols-2 p-12 gap-8">
                {/* Left: Typography */}
                <div className="flex flex-col justify-between border-r border-black pr-8">
                    <div>
                        {logoUrl ? (
                            <div className="relative w-48 h-12 mb-12">
                                <Image src={logoUrl} alt="Logo" fill className="object-contain object-left" />
                            </div>
                        ) : (
                            <h1 className="text-3xl font-bold tracking-tight mb-12">COMPANY<span className="font-light">INC.</span></h1>
                        )}

                        <div className="bg-blue-600 text-white w-24 h-2 mb-8" />

                        <h2 className="text-6xl font-bold leading-tight tracking-tight text-slate-900 mb-8">
                            {catalogName}
                        </h2>

                        <span className="block text-sm font-medium text-slate-500 uppercase tracking-widest">
                            Annual Product Report
                            <br />
                            Fiscal Year {new Date().getFullYear()}
                        </span>
                    </div>

                    <div className="space-y-6">
                        {coverDescription && (
                            <p className="text-xl font-light leading-relaxed text-slate-600">
                                {coverDescription}
                            </p>
                        )}

                        <div className="flex gap-8 border-t border-slate-200 pt-8">
                            <div>
                                <span className="block text-4xl font-bold text-blue-600">{productCount}</span>
                                <span className="text-xs font-bold uppercase text-slate-400">Products</span>
                            </div>
                            <div>
                                <span className="block text-4xl font-bold text-blue-600">Global</span>
                                <span className="text-xs font-bold uppercase text-slate-400">Reach</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Architectural Image */}
                <div className="relative h-full flex flex-col gap-4">
                    <div className="flex-1 relative bg-slate-100 overflow-hidden">
                        {coverImageUrl ? (
                            <Image src={coverImageUrl} alt="Corporate" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-4xl">
                                IMG_01
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 bg-blue-600 text-white px-6 py-3 font-bold text-xs uppercase tracking-widest">
                            Innovation Center
                        </div>
                    </div>
                    <div className="h-1/3 relative bg-slate-900 border border-slate-200">
                        {/* Abstract secondary visual */}
                        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,white_0,white_1px,transparent_1px,transparent_10px)]" />
                        <div className="absolute bottom-4 right-4 text-white text-[10px] font-mono">
                            ID: K9L2M5
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Bar */}
            <div className="absolute bottom-0 w-full h-4 bg-blue-600" />
        </div>
    )
})
