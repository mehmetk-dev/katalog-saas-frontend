"use client"

import { useTranslation } from "@/lib/i18n-provider"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export function CancellationContent() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-[#1a1a1a]">
            <PublicHeader />

            <main className="flex-1 pt-32 pb-20 px-4 md:px-6">

                {/* Main Card Container - Slightly wider than A4 for a modern web look but constrained */}
                <div className="max-w-[800px] mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">

                    {/* Header Section with Brand Accent */}
                    <div className="bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="text-xs font-bold tracking-[0.3em] text-blue-400 mb-2 uppercase">FogCatalog</div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                                    {t("legal.cancellationPolicy.title")}
                                </h1>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-mono text-slate-400 border border-slate-700 px-3 py-1 rounded inline-block bg-slate-800/50">
                                    {t("legal.cancellationPolicy.ref")}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 md:p-12 space-y-12">

                        {/* 1. Refund Policy Section */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-blue-600 pl-4 mb-6">
                                {t("legal.cancellationPolicy.refundPolicy.title")}
                            </h2>
                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                {t("legal.cancellationPolicy.refundPolicy.desc")}
                            </p>

                            {/* Important Info Box */}
                            <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0 text-amber-500 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                                            {t("legal.cancellationPolicy.warning")}
                                        </h3>
                                        <p className="text-xs text-amber-900/80 leading-relaxed">
                                            {t("legal.cancellationPolicy.refundPolicy.importantInfo")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Cancellation Process Section */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-blue-600 pl-4 mb-6">
                                {t("legal.cancellationPolicy.cancellationProcess.title")}
                            </h2>
                            <p className="text-sm text-slate-600 mb-8">
                                {t("legal.cancellationPolicy.cancellationProcess.desc")}
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Step Cards */}
                                <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 hover:border-blue-100 transition-colors">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" x2="12" y1="2" y2="12" /></svg>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm mb-2">{t("legal.cancellationPolicy.cancellationProcess.howTo.title")}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {t("legal.cancellationPolicy.cancellationProcess.howTo.desc")}
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 hover:border-blue-100 transition-colors">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600 mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm mb-2">{t("legal.cancellationPolicy.cancellationProcess.rights.title")}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {t("legal.cancellationPolicy.cancellationProcess.rights.desc")}
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 hover:border-blue-100 transition-colors">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-600 mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm mb-2">{t("legal.cancellationPolicy.cancellationProcess.expiry.title")}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {t("legal.cancellationPolicy.cancellationProcess.expiry.desc")}
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 hover:border-blue-100 transition-colors">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-600 mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm mb-2">{t("legal.cancellationPolicy.cancellationProcess.data.title")}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {t("legal.cancellationPolicy.cancellationProcess.data.desc")}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 3. Exceptions Section */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-blue-600 pl-4 mb-6">
                                {t("legal.cancellationPolicy.exceptions.title")}
                            </h2>
                            <div className="bg-white border border-dashed border-slate-300 rounded-lg p-6">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {t("legal.cancellationPolicy.exceptions.desc")}
                                </p>
                            </div>
                        </section>

                    </div>

                    {/* Footer Strip */}
                    <div className="bg-slate-50 border-t border-slate-100 p-6 text-center text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                        FOGCATALOG &bull; LEGAL DEPARTMENT
                    </div>

                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
