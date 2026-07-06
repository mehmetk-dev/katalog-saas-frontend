"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import type { Language } from "@/lib/translations"

interface MenuItem {
    href: string
    label: string
    index: string
}

interface PublicMobileMenuProps {
    menuItems: MenuItem[]
    language: Language
    setLanguage: (lang: Language) => void
    createCatalogLabel: string
    onClose: () => void
}

export function PublicMobileMenu({
    menuItems,
    language,
    setLanguage,
    createCatalogLabel,
    onClose,
}: PublicMobileMenuProps) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col h-screen w-screen overflow-hidden"
            >
                <div className="h-20 flex-shrink-0 flex items-center justify-end px-6" />

                <nav className="flex-1 flex flex-col px-8 pt-6 relative overflow-hidden bg-white uppercase">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.04] select-none text-center">
                        <span className="text-[120px] font-black text-black leading-none tracking-tighter">KATALOG</span>
                    </div>

                    <div className="space-y-2">
                        {menuItems.map((link, index) => (
                            <motion.div
                                key={link.href}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + (index * 0.1) }}
                                className="relative z-10"
                            >
                                <Link
                                    href={link.href}
                                    onClick={onClose}
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

                <div className="p-8 bg-white border-t border-slate-100 flex-shrink-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Link href="/auth?tab=signup" prefetch={false} onClick={onClose}>
                            <Button size="lg" className="w-full h-16 bg-[#cf1414] hover:bg-black text-white shadow-xl shadow-red-100 text-lg font-black uppercase tracking-tight rounded-none flex items-center justify-between px-8 transition-colors">
                                <span>{createCatalogLabel}</span>
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
        </AnimatePresence>
    )
}
