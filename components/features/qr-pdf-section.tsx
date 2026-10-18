"use client"

import { QrCode, FileText } from "lucide-react"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

export function QrPdfSection() {
    const { t } = useTranslation()

    return (
        <section className="max-w-7xl mx-auto mb-32">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Card 1: QR Code */}
                <div className="bg-slate-950 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden group">
                    <div className={cn(
                        "absolute top-0 right-0 w-64 h-64 bg-emerald-500/20",
                        "rounded-full blur-[80px]",
                        "group-hover:bg-emerald-500/30 transition-colors duration-500"
                    )} />

                    <div className="relative z-10">
                        <QrCode className="w-12 h-12 text-emerald-400 mb-6" />
                        <h3 className="text-3xl font-bold mb-4">{t('featuresPage.qrTitle')}</h3>
                        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                            {t('featuresPage.qrDesc')}
                        </p>
                        <div className={cn(
                            "w-full max-w-[200px] aspect-square bg-white p-4",
                            "rounded-xl mx-auto shadow-2xl rotate-3",
                            "group-hover:rotate-0 transition-transform duration-500"
                        )}>
                            <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
                                <QrCode className="w-24 h-24 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: PDF Generation */}
                <div className={cn(
                    "bg-slate-50 border border-slate-200 rounded-[3rem]",
                    "p-10 md:p-14 text-slate-900 relative overflow-hidden group"
                )}>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-200/30 rounded-full blur-[80px]"></div>

                    <div className="relative z-10 h-full flex flex-col">
                        <div className="mb-auto">
                            <FileText className="w-12 h-12 text-rose-500 mb-6" />
                            <h3 className="text-3xl font-bold mb-4">{t('featuresPage.pdfTitle')}</h3>
                            <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                                {t('featuresPage.pdfDesc')}
                            </p>
                        </div>

                        <div className="relative h-48 mt-8 perspective-[1000px]">
                            <div className={cn(
                                "absolute left-1/2 -translate-x-1/2 top-0",
                                "w-40 h-56 bg-white shadow-xl shadow-slate-200",
                                "border border-slate-200 rounded-lg",
                                "rotate-x-12 group-hover:rotate-x-0",
                                "group-hover:-translate-y-4 transition-all duration-500",
                                "flex flex-col p-4 items-center"
                            )}>
                                <div className="w-full h-24 bg-slate-100 rounded mb-2 overflow-hidden">
                                    <div
                                        className="w-full h-full bg-cover opacity-50"
                                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200')" }}
                                    />
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded mb-1"></div>
                                <div className="w-2/3 h-2 bg-slate-100 rounded mb-4"></div>
                                <div className="mt-auto flex items-center gap-2">
                                    <div className={cn(
                                        "w-6 h-6 bg-red-100 rounded flex items-center",
                                        "justify-center text-[8px] font-bold text-red-600"
                                    )}>
                                        PDF
                                    </div>
                                    <span className="text-[8px] text-slate-400">catalog.pdf</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
