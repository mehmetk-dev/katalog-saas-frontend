"use client"

import { useTranslation } from "@/lib/i18n-provider"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { useEffect, useState } from "react"

export function KvkkContent() {
    const { t } = useTranslation()
    const [activeSection, setActiveSection] = useState(1)

    // Scroll tracking for sidebar indicator
    useEffect(() => {
        const handleScroll = () => {
            const sectionIds = [1, 2, 3, 4, 5, 6]
            const scrollPos = window.scrollY + 250

            for (const id of sectionIds) {
                const element = document.getElementById(`section-${id}`)
                if (element) {
                    const { top, bottom } = element.getBoundingClientRect()
                    const elementTop = top + window.scrollY
                    const elementBottom = bottom + window.scrollY

                    if (scrollPos >= elementTop && scrollPos < elementBottom) {
                        setActiveSection(id)
                        break
                    }
                }
            }
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const sections = [
        { id: 1, title: t("legal.kvkk.controller.title") },
        { id: 2, title: t("legal.kvkk.processedData.title") },
        { id: 3, title: t("legal.kvkk.purposes.title") },
        { id: 4, title: t("legal.kvkk.transfer.title") },
        { id: 5, title: t("legal.kvkk.collection.title") },
        { id: 6, title: t("legal.kvkk.rights.title") }
    ]

    const scrollToSection = (id: number) => {
        const element = document.getElementById(`section-${id}`)
        if (element) {
            const headerOffset = 140
            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            })
        }
    }

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            <PublicHeader />

            <main className="pt-40 pb-32 px-4 md:px-6">
                <div className="max-w-6xl mx-auto">

                    {/* Hero Header */}
                    <div className="mb-24 text-center">
                        <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full mb-6">
                            {t("legal.kvkk.ui.badge")}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-950 mb-8 lowercase first-letter:uppercase">
                            {t("legal.kvkk.ui.clarification")}
                        </h1>
                        <p className="text-slate-500 text-xl max-w-2xl mx-auto font-light leading-relaxed">
                            {t("legal.kvkk.title")}
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-16 items-stretch relative">

                        {/* LEFT: Sidebar Index - STICKY FIXED */}
                        <aside className="hidden lg:block lg:w-1/4">
                            <div className="sticky top-32 self-start py-4">
                                <nav className="relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100"></div>
                                    <div
                                        className="absolute left-0 w-px bg-indigo-600 transition-all duration-500 ease-in-out"
                                        style={{
                                            height: `${100 / sections.length}%`,
                                            transform: `translateY(${(activeSection - 1) * 100}%)`
                                        }}
                                    ></div>

                                    <ul className="space-y-4">
                                        {sections.map((section) => (
                                            <li key={section.id} className="pl-6">
                                                <button
                                                    onClick={() => scrollToSection(section.id)}
                                                    className={`text-left transition-all duration-300 group ${activeSection === section.id
                                                            ? "text-indigo-600"
                                                            : "text-slate-400 hover:text-slate-600"
                                                        }`}
                                                >
                                                    <span className="block text-[10px] uppercase tracking-widest mb-1 opacity-50 font-bold">Section 0{section.id}</span>
                                                    <span className={`text-sm tracking-tight leading-snug transition-all ${activeSection === section.id ? "font-bold" : "font-medium"
                                                        }`}>
                                                        {section.title}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>

                                <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t("legal.kvkk.ui.updated")}</h4>
                                    <p className="text-sm font-semibold text-slate-900">25.01.2026</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{t("legal.kvkk.ref")}</p>
                                </div>
                            </div>
                        </aside>

                        {/* RIGHT: Content Flow (Clean Modern Style) */}
                        <div className="lg:w-3/4 space-y-32">

                            {/* 1. Controller */}
                            <section id="section-1" className="relative">
                                <div className="absolute -left-12 top-0 text-8xl font-black text-slate-50 select-none -z-10">01</div>
                                <h2 className="text-3xl font-bold text-slate-950 mb-8 tracking-tight">{t("legal.kvkk.controller.title")}</h2>
                                <div className="prose prose-slate prose-lg max-w-none">
                                    <p className="text-slate-600 leading-relaxed italic border-l-4 border-indigo-600 pl-6 py-2">
                                        {t("legal.kvkk.controller.desc")}
                                    </p>
                                </div>
                            </section>

                            {/* 2. Processed Data */}
                            <section id="section-2" className="relative">
                                <div className="absolute -left-12 top-0 text-8xl font-black text-slate-50 select-none -z-10">02</div>
                                <h2 className="text-3xl font-bold text-slate-950 mb-8 tracking-tight">{t("legal.kvkk.processedData.title")}</h2>
                                <p className="text-slate-600 mb-10 text-lg">{t("legal.kvkk.processedData.desc")}</p>

                                <div className="grid sm:grid-cols-2 gap-8">
                                    {[
                                        { label: t("legal.kvkk.processedData.identity.label"), items: t("legal.kvkk.processedData.identity.items") },
                                        { label: t("legal.kvkk.processedData.contact.label"), items: t("legal.kvkk.processedData.contact.items") },
                                        { label: t("legal.kvkk.processedData.transaction.label"), items: t("legal.kvkk.processedData.transaction.items") },
                                        { label: t("legal.kvkk.processedData.security.label"), items: t("legal.kvkk.processedData.security.items") }
                                    ].map((item, i) => (
                                        <div key={i} className="group p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <h3 className="font-bold text-slate-900 mb-2">{item.label}</h3>
                                            <p className="text-sm text-slate-500">{item.items}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* 3. Purposes */}
                            <section id="section-3" className="relative">
                                <div className="absolute -left-12 top-0 text-8xl font-black text-slate-50 select-none -z-10">03</div>
                                <h2 className="text-3xl font-bold text-slate-950 mb-8 tracking-tight">{t("legal.kvkk.purposes.title")}</h2>
                                <div className="bg-slate-950 text-white rounded-[2rem] p-12 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative z-10 space-y-6">
                                        <p className="text-slate-400 mb-8">{t("legal.kvkk.purposes.desc")}</p>
                                        <div className="grid gap-4">
                                            {(t("legal.kvkk.purposes.items", { returnObjects: true }) as string[]).map((item, i) => (
                                                <div key={i} className="flex gap-4 items-center group">
                                                    <span className="w-6 h-px bg-indigo-500 transition-all group-hover:w-10"></span>
                                                    <span className="text-slate-300 text-sm">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 4. Transfer */}
                            <section id="section-4" className="relative">
                                <div className="absolute -left-12 top-0 text-8xl font-black text-slate-50 select-none -z-10">04</div>
                                <h2 className="text-3xl font-bold text-slate-950 mb-8 tracking-tight">{t("legal.kvkk.transfer.title")}</h2>
                                <p className="text-slate-600 text-lg leading-relaxed mb-10">{t("legal.kvkk.transfer.desc")}</p>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {(t("legal.kvkk.transfer.items", { returnObjects: true }) as any[]).map((item, i) => (
                                        <div key={i} className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100/50">
                                            <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                {item.label}
                                            </h4>
                                            <p className="text-sm text-indigo-800/70">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* 5. Collection */}
                            <section id="section-5" className="relative">
                                <div className="absolute -left-12 top-0 text-8xl font-black text-slate-50 select-none -z-10">05</div>
                                <h2 className="text-3xl font-bold text-slate-950 mb-8 tracking-tight">{t("legal.kvkk.collection.title")}</h2>
                                <div className="bg-white border border-slate-200 rounded-[2rem] p-12">
                                    <p className="text-slate-600 mb-10 text-lg leading-relaxed">{t("legal.kvkk.collection.desc")}</p>
                                    <div className="flex flex-wrap gap-3">
                                        {(t("legal.kvkk.collection.reasons", { returnObjects: true }) as string[]).map((item, i) => (
                                            <span key={i} className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="mt-8 text-slate-400 text-sm font-medium">{t("legal.kvkk.collection.footer")}</p>
                                </div>
                            </section>

                            {/* 6. Rights */}
                            <section id="section-6" className="relative">
                                <div className="absolute -left-12 top-0 text-8xl font-black text-slate-50 select-none -z-10">06</div>
                                <h2 className="text-3xl font-bold text-slate-950 mb-8 tracking-tight">{t("legal.kvkk.rights.title")}</h2>
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[2rem] p-12 shadow-xl shadow-indigo-200">
                                    <p className="text-indigo-50 text-xl leading-relaxed mb-12">
                                        {t("legal.kvkk.rights.desc")}
                                    </p>
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/10">
                                        <div>
                                            <h4 className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2">{t("legal.kvkk.ui.contactTitle")}</h4>
                                            <a href="mailto:kvkk@fogcatalog.com" className="text-2xl font-bold hover:text-indigo-200 transition-colors">kvkk@fogcatalog.com</a>
                                        </div>
                                        <p className="text-[10px] text-indigo-200 max-w-[200px] leading-relaxed opacity-60">
                                            {t("legal.kvkk.rights.contact")}
                                        </p>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
