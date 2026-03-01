"use client"

import {
    BarChart3,
    Globe,
    ShieldCheck,
    Layers,
    Zap,
} from "lucide-react"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

export function BentoGridSection() {
    const { t } = useTranslation()

    return (
        <section className="max-w-7xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-center mb-16">{t('featuresPage.bentoHeader')}</h2>
            <div className="grid md:grid-cols-4 gap-4 md:gap-6 auto-rows-[280px]">

                {/* Card 1: Advanced Analytics (Wide) */}
                <div className={cn(
                    "md:col-span-2 bg-white rounded-3xl p-8",
                    "border border-slate-200 hover:border-slate-300",
                    "hover:shadow-xl hover:shadow-slate-200/50",
                    "transition-all duration-300 flex flex-col justify-between",
                    "group overflow-hidden relative"
                )}>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t('featuresPage.analyticsTitle')}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{t('featuresPage.analyticsDesc')}</p>
                    </div>

                    {/* Chart Visual */}
                    <div className={cn(
                        "absolute right-0 bottom-0 w-1/2 h-2/3",
                        "flex items-end gap-2 px-6 pb-6",
                        "opacity-30 group-hover:opacity-100 transition-opacity duration-500"
                    )}>
                        <div className="w-full bg-blue-100 h-[40%] rounded-t-sm group-hover:h-[60%] transition-all duration-700 delay-100"></div>
                        <div className="w-full bg-blue-200 h-[70%] rounded-t-sm group-hover:h-[85%] transition-all duration-700 delay-200"></div>
                        <div className="w-full bg-blue-600 h-[50%] rounded-t-sm group-hover:h-[100%] transition-all duration-700 delay-300"></div>
                        <div className="w-full bg-blue-400 h-[30%] rounded-t-sm group-hover:h-[50%] transition-all duration-700 delay-100"></div>
                    </div>
                </div>

                {/* Card 2: Secure Infrastructure */}
                <div className={cn(
                    "bg-slate-50 rounded-3xl p-6 border border-slate-200",
                    "overflow-hidden relative group",
                    "hover:bg-white hover:shadow-lg transition-all duration-500"
                )}>
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity duration-500">
                        <ShieldCheck className={cn(
                            "w-24 h-24 text-emerald-100 rotate-12 transform",
                            "group-hover:text-emerald-500 transition-colors"
                        )} />
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className={cn(
                                "w-10 h-10 bg-emerald-100/80 backdrop-blur-sm",
                                "text-emerald-600 rounded-lg",
                                "flex items-center justify-center mb-4"
                            )}>
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-900 leading-tight whitespace-pre-line">{t('featuresPage.securityTitle')}</h3>
                        </div>

                        <div className="bg-white/80 backdrop-blur-md border border-emerald-100 rounded-xl p-3 mt-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">{t('featuresPage.securityStatus')}</span>
                            </div>
                            <div className="space-y-1.5">
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full w-[98%] bg-emerald-400 rounded-full"></div>
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                                    <span>SSL: Active</span>
                                    <span>256-bit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Global Access */}
                <div className={cn(
                    "bg-white rounded-3xl p-6 border border-slate-200",
                    "hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100/50",
                    "transition-all duration-500 relative overflow-hidden group"
                )}>
                    {/* Map Background */}
                    <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 grayscale inverted">
                        <div className={cn(
                            "absolute inset-0",
                            "bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.1),transparent)]"
                        )} />
                        <svg viewBox="0 0 200 100" className="w-full h-full text-slate-900 fill-current">
                            <path d="M20,50 Q50,20 80,50 T140,50 T200,50" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                            <circle cx="20" cy="50" r="2" className="animate-ping text-sky-500" />
                            <circle cx="80" cy="50" r="2" className="animate-ping delay-300 text-sky-500" />
                            <circle cx="140" cy="50" r="2" className="animate-ping delay-700 text-sky-500" />
                        </svg>
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className={cn(
                            "w-10 h-10 bg-sky-50 text-sky-600 rounded-lg",
                            "flex items-center justify-center",
                            "border border-sky-100 mb-4"
                        )}>
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg mb-1 leading-tight">Dünyaya<br />Açılın</h3>
                            <p className="text-slate-500 text-[10px] leading-relaxed mb-3">
                                Müşterileriniz nerede olursa olsun, ürünlerinize anında ulaşsın.
                            </p>
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "px-2 py-0.5 rounded-full bg-emerald-50",
                                    "border border-emerald-100 text-emerald-600",
                                    "text-[9px] font-bold tracking-wide",
                                    "flex items-center gap-1.5"
                                )}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    7/24 KESİNTİSİZ
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 4: Smart Categories */}
                <div className={cn(
                    "bg-white rounded-3xl p-6 border border-slate-200",
                    "flex flex-col justify-between",
                    "hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50",
                    "transition-all duration-500 group relative overflow-hidden"
                )}>
                    <div className={cn(
                        "absolute -right-8 -top-8 w-32 h-32 bg-amber-50",
                        "rounded-full blur-2xl group-hover:bg-amber-100 transition-colors"
                    )} />

                    <div>
                        <div className={cn(
                            "w-10 h-10 bg-amber-50 text-amber-600 rounded-lg",
                            "flex items-center justify-center mb-4"
                        )}>
                            <Layers className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 leading-tight mb-1">Akıllı<br />Kategoriler</h3>
                    </div>

                    <div className="mt-4 relative h-12">
                        {/* Stacked Tags Animation */}
                        <div className={cn(
                            "absolute left-0 bottom-0 bg-white border border-slate-200",
                            "text-[10px] font-medium text-slate-500 px-3 py-1.5",
                            "rounded-lg shadow-sm w-3/4 transform",
                            "group-hover:-translate-y-8 group-hover:scale-95",
                            "transition-all duration-500 z-10"
                        )}>
                            #Aksesuar
                        </div>
                        <div className={cn(
                            "absolute left-2 bottom-1 bg-white border border-slate-200",
                            "text-[10px] font-medium text-slate-500 px-3 py-1.5",
                            "rounded-lg shadow-sm w-3/4 transform",
                            "group-hover:-translate-y-4 group-hover:scale-100",
                            "transition-all duration-500 z-20"
                        )}>
                            #Giyim
                        </div>
                        <div className={cn(
                            "absolute left-4 bottom-2 bg-amber-500",
                            "border border-amber-500 text-[10px] font-bold text-white",
                            "px-3 py-1.5 rounded-lg shadow-md w-3/4",
                            "flex items-center justify-between transform",
                            "group-hover:translate-y-0 group-hover:scale-105",
                            "transition-all duration-500 z-30"
                        )}>
                            <span>#Yeni Sezon</span>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Card 5: Unlimited Variations (Wide) */}
                <div className={cn(
                    "md:col-span-2 bg-slate-50 rounded-3xl p-8",
                    "border border-slate-200 relative overflow-hidden",
                    "group hover:border-slate-300 transition-colors"
                )}>
                    <div className={cn(
                        "absolute top-0 right-0 w-64 h-64 bg-slate-200/50",
                        "rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"
                    )} />

                    <div className="relative z-10 flex flex-col h-full justify-center">
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Sınırsız Varyasyon</h3>
                        <p className="text-slate-600 mb-8 max-w-sm">
                            Renk, beden, materyal... Ürünlerinizin tüm seçeneklerini en ince detayına kadar listeleyin.
                        </p>

                        <div className="flex gap-4">
                            {[
                                { color: "bg-rose-500", delay: "delay-0" },
                                { color: "bg-blue-500", delay: "delay-75" },
                                { color: "bg-amber-500", delay: "delay-150" },
                                { color: "bg-emerald-500", delay: "delay-200" },
                            ].map(({ color, delay }) => (
                                <div
                                    key={color}
                                    className={cn(
                                        "w-8 h-8 rounded-full ring-4 ring-white shadow-lg",
                                        "group-hover:-translate-y-2 transition-transform duration-300",
                                        color, delay
                                    )}
                                />
                            ))}
                            <div className={cn(
                                "w-8 h-8 rounded-full bg-slate-900 ring-4 ring-white shadow-lg",
                                "group-hover:-translate-y-2 transition-transform duration-300 delay-300",
                                "flex items-center justify-center text-[10px] text-white font-bold"
                            )}>
                                +99
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 6: Fast Setup */}
                <div className={cn(
                    "bg-white rounded-3xl p-6 border border-slate-200",
                    "flex flex-col justify-between",
                    "hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50",
                    "transition-all duration-500 group relative"
                )}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap className="w-20 h-20 text-amber-500 -rotate-12" />
                    </div>

                    <div>
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-4">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 leading-tight mb-1 whitespace-pre-line">{t('featuresPage.fastSetupTitle')}</h3>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">
                            <span>{t('featuresPage.fastSetupLoading')}</span>
                            <span className="text-amber-600">100%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn(
                                "h-full bg-amber-500 w-0 rounded-full",
                                "group-hover:w-full transition-all duration-1000 ease-out"
                            )} />
                        </div>
                        <div className={cn(
                            "mt-2 text-[10px] text-emerald-600 font-medium",
                            "opacity-0 group-hover:opacity-100",
                            "transition-opacity delay-700 flex items-center gap-1"
                        )}>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            {t('featuresPage.fastSetupLive')}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
