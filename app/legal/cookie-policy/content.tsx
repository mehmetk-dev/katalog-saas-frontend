"use client"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { FileText } from "lucide-react"

export function CookiePolicyContent() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <PublicHeader />

            <main className="flex-1 pt-32 pb-20 px-4 md:px-6">
                <div className="max-w-[794px] mx-auto bg-card shadow-2xl min-h-[1123px] relative flex flex-col transform transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">

                    {/* Header */}
                    <div className="h-[80px] px-8 md:px-12 border-b border-border flex items-center justify-between shrink-0 bg-card">
                        <div className="text-[10px] tracking-[0.4em] text-muted-foreground uppercase font-medium">
                            FOGCATALOG
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground/60">
                            REF: LEG-CKP-2026/V1
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 px-8 md:px-12 py-12 md:py-16">

                        {/* Title */}
                        <div className="text-center mb-16">
                            <h1 className="text-xl md:text-2xl font-light tracking-[0.3em] text-foreground uppercase mb-6">
                                {t("legal.cookiePolicy.title")}
                            </h1>
                            <div className="w-12 h-[1px] bg-black mx-auto mb-6"></div>
                            <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
                                YÜRÜRLÜK TARİHİ: 25.01.2026
                            </p>
                        </div>

                        {/* Text */}
                        <div className="space-y-12 text-foreground text-[13px] leading-relaxed font-light text-justify">

                            <p className="text-muted-foreground mb-6">
                                {t("legal.cookiePolicy.intro")}
                            </p>

                            {/* Summary */}
                            <div className="bg-muted border border-border rounded-xl p-7 not-italic font-normal text-left">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-base font-bold text-foreground">{t("legal.cookiePolicy.summary.title")}</h2>
                                </div>
                                <ul className="space-y-2.5">
                                    {(t("legal.cookiePolicy.summary.items", { returnObjects: true }) as string[]).map((item, i) => (
                                        <li key={i} className="flex gap-3 items-start">
                                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                                            <span className="text-foreground text-sm leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* 1. What Is Cookie */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-foreground">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.cookiePolicy.whatIsCookie.title")}
                                </h2>
                                <p className="text-muted-foreground pl-7">
                                    {t("legal.cookiePolicy.whatIsCookie.desc")}
                                </p>
                            </section>

                            {/* 2. Types Of Cookies */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-foreground">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.cookiePolicy.types.title")}
                                </h2>

                                <div className="grid md:grid-cols-3 gap-4 pl-7">
                                    <div className="bg-card p-4 border border-border">
                                        <span className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">
                                            {t("legal.cookiePolicy.types.mandatory.label")}
                                        </span>
                                        <p className="text-foreground">
                                            {t("legal.cookiePolicy.types.mandatory.desc")}
                                        </p>
                                    </div>
                                    <div className="bg-card p-4 border border-border">
                                        <span className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">
                                            {t("legal.cookiePolicy.types.analytic.label")}
                                        </span>
                                        <p className="text-foreground">
                                            {t("legal.cookiePolicy.types.analytic.desc")}
                                        </p>
                                    </div>
                                    <div className="bg-card p-4 border border-border">
                                        <span className="block text-[10px] uppercase text-muted-foreground mb-2 font-bold tracking-widest">
                                            {t("legal.cookiePolicy.types.functional.label")}
                                        </span>
                                        <p className="text-foreground">
                                            {t("legal.cookiePolicy.types.functional.desc")}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* 3. Management */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-foreground">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.cookiePolicy.management.title")}
                                </h2>
                                <div className="pl-7 space-y-4">
                                    <p className="text-muted-foreground">
                                        {t("legal.cookiePolicy.management.desc")}
                                    </p>
                                    <p className="text-muted-foreground font-medium">
                                        {t("legal.cookiePolicy.management.instruction")}
                                    </p>
                                    <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                                        {(t("legal.cookiePolicy.management.browsers", { returnObjects: true }) as Array<{ name: string; path: string }>).map((browser, i) => (
                                            <li key={i}>
                                                <strong>{browser.name}:</strong> <span className="text-muted-foreground">{browser.path}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>

                            {/* 4. Contact */}
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3 text-foreground">
                                    <span className="w-4 h-[1px] bg-black"></span>
                                    {t("legal.cookiePolicy.contact.title")}
                                </h2>
                                <p className="text-muted-foreground pl-7">
                                    {t("legal.cookiePolicy.contact.desc")}
                                </p>
                            </section>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="h-[48px] border-t border-border flex items-center justify-center shrink-0 bg-card mt-auto">
                        <div className="flex items-center gap-8">
                            <div className="w-8 h-[1px] bg-muted" />
                            <span className="text-[9px] tracking-[0.5em] text-muted-foreground/60 uppercase">
                                SAYFA 01 / 01
                            </span>
                            <div className="w-8 h-[1px] bg-muted" />
                        </div>
                    </div>

                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
