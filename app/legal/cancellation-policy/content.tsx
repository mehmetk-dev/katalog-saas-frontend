"use client"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { FileText } from "lucide-react"

export function CancellationContent() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
            <PublicHeader />

            <main className="flex-1 pt-32 pb-20 px-4 md:px-6">
                <div className="max-w-[794px] mx-auto bg-white shadow-2xl min-h-[1123px] relative flex flex-col transform transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">

                    {/* Header */}
                    <div className="h-[80px] px-8 md:px-12 border-b border-[#f0f0f0] flex items-center justify-between shrink-0 bg-white">
                        <div className="text-[10px] tracking-[0.4em] text-[#a0a0a0] uppercase font-medium">
                            FOGCATALOG
                        </div>
                        <div className="text-[10px] font-mono text-[#d0d0d0]">
                            {t("legal.cancellationPolicy.ref")}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 px-8 md:px-12 py-12 md:py-16">

                        {/* Title */}
                        <div className="text-center mb-16">
                            <h1 className="text-xl md:text-2xl font-light tracking-[0.3em] text-black uppercase mb-6">
                                {t("legal.cancellationPolicy.title")}
                            </h1>
                            <div className="w-12 h-[1px] bg-black mx-auto mb-6"></div>
                            <p className="text-[10px] tracking-widest text-[#888] uppercase">
                                YÜRÜRLÜK TARİHİ: 25.01.2026
                            </p>
                        </div>

                        {/* Text */}
                        <div className="space-y-12 text-[#333] text-[13px] leading-relaxed font-light text-justify">

                            {/* Summary */}
                            <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-7 not-italic font-normal text-left">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="w-5 h-5 text-slate-600" />
                                    <h2 className="text-base font-bold text-slate-900">{t("legal.cancellationPolicy.summary.title")}</h2>
                                </div>
                                <ul className="space-y-2.5">
                                    {(t("legal.cancellationPolicy.summary.items", { returnObjects: true }) as string[]).map((item, i) => (
                                        <li key={i} className="flex gap-3 items-start">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 shrink-0" />
                                            <span className="text-slate-700 text-sm leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* 1. Refund Policy */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-black">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.cancellationPolicy.refundPolicy.title")}
                                </h2>
                                <p className="text-[#555] pl-7 mb-4">
                                    {t("legal.cancellationPolicy.refundPolicy.desc")}
                                </p>
                                <div className="pl-7">
                                    <div className="p-4 bg-[#fafafa] border border-[#f0f0f0] border-l-2 border-l-black">
                                        <strong className="block text-xs uppercase mb-2 text-black">{t("legal.cancellationPolicy.warning")}</strong>
                                        <p className="text-xs text-[#666]">{t("legal.cancellationPolicy.refundPolicy.importantInfo")}</p>
                                    </div>
                                </div>
                            </section>

                            {/* 2. Cancellation Process */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-black">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.cancellationPolicy.cancellationProcess.title")}
                                </h2>
                                <p className="text-[#555] pl-7 mb-6">
                                    {t("legal.cancellationPolicy.cancellationProcess.desc")}
                                </p>

                                <div className="grid md:grid-cols-2 gap-4 pl-7">
                                    <div className="bg-white p-4 border border-[#f0f0f0]">
                                        <span className="block text-[10px] uppercase text-[#bbb] mb-2 font-bold tracking-widest">
                                            {t("legal.cancellationPolicy.cancellationProcess.howTo.title")}
                                        </span>
                                        <p className="text-[#333]">
                                            {t("legal.cancellationPolicy.cancellationProcess.howTo.desc")}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 border border-[#f0f0f0]">
                                        <span className="block text-[10px] uppercase text-[#bbb] mb-2 font-bold tracking-widest">
                                            {t("legal.cancellationPolicy.cancellationProcess.rights.title")}
                                        </span>
                                        <p className="text-[#333]">
                                            {t("legal.cancellationPolicy.cancellationProcess.rights.desc")}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 border border-[#f0f0f0]">
                                        <span className="block text-[10px] uppercase text-[#bbb] mb-2 font-bold tracking-widest">
                                            {t("legal.cancellationPolicy.cancellationProcess.expiry.title")}
                                        </span>
                                        <p className="text-[#333]">
                                            {t("legal.cancellationPolicy.cancellationProcess.expiry.desc")}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 border border-[#f0f0f0]">
                                        <span className="block text-[10px] uppercase text-[#bbb] mb-2 font-bold tracking-widest">
                                            {t("legal.cancellationPolicy.cancellationProcess.data.title")}
                                        </span>
                                        <p className="text-[#333]">
                                            {t("legal.cancellationPolicy.cancellationProcess.data.desc")}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* 3. Exceptions */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-black">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.cancellationPolicy.exceptions.title")}
                                </h2>
                                <p className="text-[#555] pl-7">
                                    {t("legal.cancellationPolicy.exceptions.desc")}
                                </p>
                            </section>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="h-[48px] border-t border-[#f0f0f0] flex items-center justify-center shrink-0 bg-white mt-auto">
                        <div className="flex items-center gap-8">
                            <div className="w-8 h-[1px] bg-[#f0f0f0]" />
                            <span className="text-[9px] tracking-[0.5em] text-[#d0d0d0] uppercase">
                                SAYFA 01 / 01
                            </span>
                            <div className="w-8 h-[1px] bg-[#f0f0f0]" />
                        </div>
                    </div>

                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
