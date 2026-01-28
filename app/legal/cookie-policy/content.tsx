"use client"

import { useTranslation } from "@/lib/i18n-provider"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export function CookiePolicyContent() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900">
            <PublicHeader />

            <main className="pt-40 pb-32 px-4 md:px-6">
                <div className="max-w-6xl mx-auto">

                    {/* Catalog-style Header */}
                    <div className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px w-12 bg-indigo-600"></div>
                                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-indigo-600">{t("footer.legal")}</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">
                                COOKIE <br />
                                <span className="text-indigo-600">{t("legal.cookiePolicy.ui.policy")}</span>
                            </h1>
                            <p className="text-slate-400 font-mono text-xs mb-2">{t("legal.cookiePolicy.lastUpdated")}</p>
                            <p className="text-slate-500 text-lg leading-relaxed max-w-md">
                                {t("legal.cookiePolicy.intro")}
                            </p>
                        </div>
                        <div className="hidden lg:flex justify-end">
                            <div className="relative w-80 h-80">
                                <div className="absolute inset-0 bg-indigo-50 rounded-[3rem] rotate-6 border-2 border-dashed border-indigo-200"></div>
                                <div className="absolute inset-0 bg-white rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-8 text-center -rotate-3 border border-slate-100">
                                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-indigo-200 shadow-xl">
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    </div>
                                    <h3 className="font-bold text-xl mb-2">{t("legal.cookiePolicy.ui.userFocused")}</h3>
                                    <p className="text-xs text-slate-400">{t("legal.cookiePolicy.ui.securityDesc")}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bento Grid Features - "Product Cards" Style */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">

                        {/* 1. What is a Cookie? */}
                        <div className="md:col-span-3 lg:col-span-1 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-10">01. {t("legal.cookiePolicy.ui.definition")}</div>
                            <h2 className="text-3xl font-bold mb-6 tracking-tight group-hover:text-indigo-600 transition-colors">{t("legal.cookiePolicy.whatIsCookie.title")}</h2>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                {t("legal.cookiePolicy.whatIsCookie.desc")}
                            </p>
                        </div>

                        {/* 2. Types Of Cookies - The Catalog Section */}
                        <div className="md:col-span-3 lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
                            <div className="relative z-10">
                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-10">02. {t("legal.cookiePolicy.ui.catalog")}</div>
                                <h2 className="text-4xl font-bold mb-12 tracking-tight">{t("legal.cookiePolicy.types.title")}</h2>

                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="space-y-4">
                                        <div className="w-8 h-8 bg-indigo-500/20 rounded flex items-center justify-center text-indigo-400 font-bold text-xs">M</div>
                                        <h4 className="font-bold text-sm tracking-wide">{t("legal.cookiePolicy.types.mandatory.label")}</h4>
                                        <p className="text-indigo-100/50 text-xs leading-relaxed">{t("legal.cookiePolicy.types.mandatory.desc")}</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400 font-bold text-xs">A</div>
                                        <h4 className="font-bold text-sm tracking-wide">{t("legal.cookiePolicy.types.analytic.label")}</h4>
                                        <p className="text-indigo-100/50 text-xs leading-relaxed">{t("legal.cookiePolicy.types.analytic.desc")}</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="w-8 h-8 bg-amber-500/20 rounded flex items-center justify-center text-amber-400 font-bold text-xs">F</div>
                                        <h4 className="font-bold text-sm tracking-wide">{t("legal.cookiePolicy.types.functional.label")}</h4>
                                        <p className="text-indigo-100/50 text-xs leading-relaxed">{t("legal.cookiePolicy.types.functional.desc")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Management - How to manage */}
                        <div className="md:col-span-3 lg:col-span-2 bg-indigo-600 rounded-[2.5rem] p-10 md:p-14 text-white flex flex-col md:flex-row gap-12 items-center">
                            <div className="md:w-1/2">
                                <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-8">03. {t("legal.cookiePolicy.ui.controls")}</div>
                                <h2 className="text-4xl font-bold mb-6 tracking-tight">{t("legal.cookiePolicy.management.title")}</h2>
                                <p className="text-indigo-100/80 text-sm leading-relaxed mb-8">
                                    {t("legal.cookiePolicy.management.desc")}
                                </p>
                            </div>
                            <div className="md:w-1/2 w-full grid grid-cols-1 gap-3">
                                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2 px-2">{t("legal.cookiePolicy.management.instruction")}</p>
                                {(t("legal.cookiePolicy.management.browsers", { returnObjects: true }) as Array<{ name: string; path: string }>).map((browser, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl border border-white/10 group cursor-default">
                                        <span className="text-sm font-bold">{browser.name}</span>
                                        <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-mono text-indigo-200">{browser.path}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Contact */}
                        <div className="md:col-span-3 lg:col-span-1 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-10">04. {t("legal.cookiePolicy.ui.inquiries")}</div>
                                <h2 className="text-3xl font-bold mb-6 tracking-tight">{t("legal.cookiePolicy.contact.title")}</h2>
                                <p className="text-slate-500 text-sm leading-relaxed italic border-l-2 border-indigo-600 pl-6">
                                    {t("legal.cookiePolicy.contact.desc")}
                                </p>
                            </div>
                            <div className="mt-12 text-center">
                                <a href="mailto:info@fogcatalog.com" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all">
                                    info@fogcatalog.com
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </a>
                            </div>
                        </div>

                    </div>

                    {/* Catalog Footer Style Badge */}
                    <div className="flex justify-center border-t border-slate-100 pt-12">
                        <div className="px-6 py-2 bg-slate-50 rounded-full border border-slate-200 flex items-center gap-4">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">OFFICIAL DOCUMENT — FOG CATALOG INC.</span>
                        </div>
                    </div>

                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
