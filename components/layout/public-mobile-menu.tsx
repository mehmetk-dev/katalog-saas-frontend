"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
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
                className="fixed inset-0 z-[100] bg-background md:hidden flex flex-col h-screen w-screen overflow-hidden"
            >
                <div className="h-20 flex-shrink-0 flex items-center justify-end px-6" />

                <nav className="flex-1 overflow-y-auto px-6 pt-2">
                    {menuItems.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onClose}
                            className="flex items-center justify-between border-b border-border py-4 text-lg font-medium text-foreground transition-colors active:bg-muted"
                        >
                            {link.label}
                            <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                        </Link>
                    ))}
                </nav>

                <div className="flex-shrink-0 space-y-6 border-t border-border bg-background p-6">
                    <Button asChild variant="brand" size="lg" className="h-11 w-full">
                        <Link href="/auth?tab=signup" prefetch={false} onClick={onClose}>
                            {createCatalogLabel}
                        </Link>
                    </Button>

                    <div className="flex items-center justify-center gap-1 rounded-full border border-border bg-muted p-1">
                        {(["tr", "en"] as const).map((lang) => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => setLanguage(lang)}
                                aria-pressed={language === lang}
                                className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase transition-colors ${language === lang ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
