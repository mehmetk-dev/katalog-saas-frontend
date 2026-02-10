import React from 'react'
import Image from 'next/image'
import type { CoverPageProps } from './index'

export function CorporateCover({
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor = '#1e293b'
}: CoverPageProps) {
    return (
        <div className="relative w-full h-full bg-slate-50 flex flex-col text-slate-800 overflow-hidden">
            {/* SVG Background Wave */}
            <div className="absolute top-0 left-0 w-full h-[500px] z-0 pointer-events-none">
                <svg viewBox="0 0 1440 320" className="w-full h-full object-cover">
                    <path fill={primaryColor} fillOpacity="0.9" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                </svg>
            </div>

            {/* Geometric Accents */}
            <div className="absolute top-10 right-10 w-32 h-32 rounded-full border-8 border-white/20 z-0" />
            <div className="absolute top-20 right-24 w-16 h-16 rounded-full bg-white/10 z-0" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full p-16">

                {/* Header Info */}
                <div className="flex justify-between items-center text-white mb-20">
                    <div className="text-sm font-semibold tracking-wide opacity-90 uppercase">
                        Yıllık Ürün Genel Bakışı
                    </div>
                    {logoUrl ? (
                        <div className="relative w-32 h-12 bg-white/10 rounded px-2 backdrop-blur">
                            <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                        </div>
                    ) : (
                        <div className="font-bold text-xl tracking-tight">KURUMSAL MARKA.</div>
                    )}
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-2 flex flex-col md:flex-row h-3/5 overflow-hidden">
                    {/* Left Side: Image */}
                    <div className="relative w-full md:w-1/2 h-full rounded-2xl overflow-hidden min-h-[300px]">
                        {coverImageUrl ? (
                            <Image src={coverImageUrl} alt="Corporate" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                <span className="text-slate-400 font-bold">GÖRSEL</span>
                            </div>
                        )}
                        <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-6 py-3 rounded-lg shadow-sm">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mali Yıl 2024</span>
                        </div>
                    </div>

                    {/* Right Side: Text */}
                    <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
                        <div className="w-12 h-2 bg-blue-600 mb-8 rounded-full" style={{ backgroundColor: primaryColor }} />
                        <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
                            {catalogName}
                        </h1>
                        <p className="text-slate-500 text-lg leading-relaxed mb-8">
                            {coverDescription || "Modern işletmeler için yenilikçi çözümler sunuyoruz. Detaylı teknik özellikler ve ürün yol haritası içeride."}
                        </p>

                        <div className="mt-auto pt-8 border-t border-slate-100 flex gap-12">
                            <div>
                                <div className="text-2xl font-bold text-slate-900">100%</div>
                                <div className="text-xs text-slate-500 font-medium uppercase mt-1">Memnuniyet</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">50+</div>
                                <div className="text-xs text-slate-500 font-medium uppercase mt-1">Ülke</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto flex justify-between items-center text-slate-400 text-sm font-medium">
                    <div>www.brandcorp.com</div>
                    <div>Gizli • Sadece Dahili Kullanım İçin</div>
                </div>
            </div>
        </div>
    )
}
