"use client"

import Link from "next/link"
import { Sparkles, Menu, X, ArrowRight, ChevronRight, Globe, User } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-provider"
import { AnimatePresence, motion } from "framer-motion"

export function PublicHeader({ fullWidth = false }: { fullWidth?: boolean }) {
    const { t, language, setLanguage } = useTranslation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const menuItems = [
        { href: "/features", label: t('header.features'), index: "01", desc: "Sektörün en güçlü araçları" },
        { href: "/pricing", label: t('header.pricing'), index: "02", desc: "Her işletmeye uygun planlar" },
        { href: "/create-demo", label: t('header.demo'), index: "03", desc: "Saniyeler içinde katalog oluşturun" },
        { href: "/blog", label: t('header.blog'), index: "04", desc: "Katalog dünyasından haberler" },
        { href: "/contact", label: t('header.contact'), index: "05", desc: "Bize her zaman ulaşın" },
    ]

    return (
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/50">
            <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} px-6 h-16 flex items-center justify-between`}>
                {/* Left: Logo */}
                <div className="flex items-center shrink-0">
                    <Link href="/" className="flex items-center group" aria-label="FogCatalog Ana Sayfa">
                        <span className="font-montserrat text-3xl tracking-tighter flex items-center">
                            <span className="font-black text-[#cf1414] uppercase">Fog</span>
                            <span className="font-light text-slate-900">Catalog</span>
                        </span>
                    </Link>
                </div>

                {/* Center: Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    {menuItems.map((item) => (
                        <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-600 hover:text-[#cf1414] transition-colors">
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className={`flex items-center gap-3 shrink-0 ${fullWidth ? 'ml-8' : ''}`}>
                    {/* Language Switcher (Desktop) */}
                    <div className="hidden md:flex items-center bg-slate-100 rounded-full p-1 mr-2 border border-slate-200 shadow-inner">
                        <button
                            onClick={() => setLanguage('tr')}
                            className={`px-3 py-1 text-[10px] font-black rounded-full transition-all duration-300 ${language === 'tr' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-900'}`}
                            aria-label="Türkçe"
                        >
                            TR
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-3 py-1 text-[10px] font-black rounded-full transition-all duration-300 ${language === 'en' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-900'}`}
                            aria-label="English"
                        >
                            EN
                        </button>
                    </div>

                    <Link href="/auth?tab=signup">
                        <Button
                            size="sm"
                            className="hidden sm:inline-flex h-10 px-6 bg-[#cf1414] hover:bg-black text-white shadow-xl shadow-red-500/20 rounded-full transition-all duration-300 hover:scale-105 font-black uppercase text-[11px] tracking-wider"
                        >
                            {t('header.createCatalog')}
                            <Sparkles className="w-3.5 h-3.5 ml-2" />
                        </Button>
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-300 z-[120]"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6 animate-in spin-in-90 duration-300" /> : <Menu className="w-6 h-6 animate-in fade-in duration-300" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col h-screen w-screen overflow-hidden"
                    >
                        {/* Static Header Placeholder (Empty but takes space to keep main logo visible) */}
                        <div className="h-20 flex-shrink-0 flex items-center justify-end px-6">
                            {/* Empty space where the fixed header logo remains visible beneath or aligned with overlay */}
                        </div>

                        {/* Content Area - Designed like a Book Index */}
                        <nav className="flex-1 flex flex-col px-8 pt-6 relative overflow-hidden bg-white uppercase">
                            {/* Large Background Decoration - Horizontal and Centered Watermark */}
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.04] select-none text-center">
                                <span className="text-[120px] font-black text-black leading-none tracking-tighter">KATALOG</span>
                            </div>

                            <div className="space-y-2">
                                {menuItems.map((link, i) => (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + (i * 0.1) }}
                                        className="relative z-10"
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="py-6 border-b border-slate-100 block group active:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-[#cf1414] mb-1 tracking-[0.3em] uppercase">BÖLÜM {link.index}</span>
                                                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                                        {link.label}
                                                    </h3>
                                                </div>
                                                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-[#cf1414] group-hover:border-[#cf1414] transition-all">
                                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </nav>

                        {/* Footer Section - Stuck to Bottom */}
                        <div className="p-8 bg-white border-t border-slate-100 flex-shrink-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Link href="/auth?tab=signup" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button size="lg" className="w-full h-16 bg-[#cf1414] hover:bg-black text-white shadow-xl shadow-red-100 text-lg font-black uppercase tracking-tight rounded-none flex items-center justify-between px-8 transition-colors">
                                        <span>{t('header.createCatalog')}</span>
                                        <Sparkles className="w-6 h-6" />
                                    </Button>
                                </Link>

                                <div className="flex items-center justify-center gap-10 mt-8">
                                    <button
                                        onClick={() => setLanguage('tr')}
                                        className={`text-xs font-black tracking-[0.2em] transition-colors ${language === 'tr' ? 'text-[#cf1414] border-b-2 border-[#cf1414]' : 'text-slate-300 hover:text-slate-600'}`}
                                    >
                                        TR
                                    </button>
                                    <button
                                        onClick={() => setLanguage('en')}
                                        className={`text-xs font-black tracking-[0.2em] transition-colors ${language === 'en' ? 'text-[#cf1414] border-b-2 border-[#cf1414]' : 'text-slate-300 hover:text-slate-600'}`}
                                    >
                                        EN
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
