"use client"

import Link from "next/link"
import { Sparkles, Menu, X, ArrowRight, ChevronRight, Globe, User } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-provider"

export function PublicHeader() {
    const { t, language, setLanguage } = useTranslation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 border-b border-slate-200/50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center group" aria-label="FogCatalog Ana Sayfa">
                    <span className="font-montserrat text-3xl tracking-tighter flex items-center">
                        <span className="font-black text-[#cf1414] uppercase">Fog</span>
                        <span className="font-light text-slate-900">Catalog</span>
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/features" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
                        {t('header.features')}
                    </Link>
                    <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
                        {t('header.pricing')}
                    </Link>
                    <Link href="/blog" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
                        {t('header.blog')}
                    </Link>
                    <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
                        {t('header.contact')}
                    </Link>
                </nav>

                <div className="flex items-center gap-3">
                    {/* Language Switcher (Desktop) */}
                    <div className="hidden md:flex items-center bg-slate-100 rounded-full p-1 mr-2 border border-slate-200">
                        <button
                            onClick={() => setLanguage('tr')}
                            className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 ${language === 'tr' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                            aria-label="Türkçe"
                        >
                            TR
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 ${language === 'en' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                            aria-label="English"
                        >
                            EN
                        </button>
                    </div>

                    <Link href="/auth" className="hidden sm:block">
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-sky-600 font-medium">
                            {t('header.login')}
                        </Button>
                    </Link>
                    <Link href="/auth?tab=signup">
                        <Button
                            size="sm"
                            className="hidden sm:inline-flex h-9 px-5 bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 rounded-full transition-all duration-300 hover:scale-105 font-semibold border border-sky-400/20"
                        >
                            {t('header.createCatalog')}
                            <Sparkles className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-3xl animate-in slide-in-from-top-5 fade-in duration-300 md:hidden flex flex-col">
                    {/* Background Gradients */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-400/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 translate-y-1/2"></div>

                    {/* Header inside Menu */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100/50">
                        <span className="font-montserrat text-2xl tracking-tighter flex items-center">
                            <span className="font-black text-[#cf1414] uppercase">Fog</span>
                            <span className="font-light text-slate-900">Catalog</span>
                        </span>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                            aria-label="Kapat"
                        >
                            <X className="w-6 h-6 text-slate-600" />
                        </button>
                    </div>

                    {/* Links */}
                    <nav className="flex-1 flex flex-col justify-center px-8 space-y-6 relative z-10">
                        {[
                            { href: "/features", label: t('header.features'), index: "01" },
                            { href: "/pricing", label: t('header.pricing'), index: "02" },
                            { href: "/blog", label: t('header.blog'), index: "03" },
                            { href: "/contact", label: t('header.contact'), index: "04" },
                        ].map((link, i) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="group flex items-center justify-between py-2 border-b border-slate-100/50 hover:border-sky-200 transition-colors"
                            >
                                <span className="text-4xl font-black text-slate-800 group-hover:text-sky-600 transition-colors tracking-tight">
                                    {link.label}
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-slate-300 group-hover:text-sky-300 transition-colors">{link.index}</span>
                                    <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-sky-600 group-hover:-rotate-45 transition-all duration-300" />
                                </div>
                            </Link>
                        ))}
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-8 bg-white/50 backdrop-blur-sm border-t border-slate-100 relative z-10">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button variant="outline" size="lg" className="w-full h-14 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-base font-bold bg-white/80">
                                    <User className="w-4 h-4 mr-2" />
                                    {t('header.login')}
                                </Button>
                            </Link>
                            <Link href="/auth?tab=signup" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button size="lg" className="w-full h-14 bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-200 text-base font-bold">
                                    {t('header.createCatalog')}
                                </Button>
                            </Link>
                        </div>

                        {/* Language Switcher */}
                        <div className="flex items-center justify-center gap-2">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <div className="flex bg-slate-100 p-1 rounded-full">
                                <button
                                    onClick={() => setLanguage('tr')}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${language === 'tr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                    aria-label="Türkçe Dili Seç"
                                >
                                    Türkçe
                                </button>
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                    aria-label="Select English Language"
                                >
                                    English
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
