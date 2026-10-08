"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { Sparkles, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { Logo } from "@/components/ui/logo"

const PublicMobileMenu = dynamic(
    () => import("./public-mobile-menu").then((mod) => mod.PublicMobileMenu),
    { ssr: false },
)

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
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
            <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} px-6 h-16 flex items-center justify-between`}>
                {/* Left: Logo */}
                <div className="flex items-center shrink-0">
                    <Link href="/" className="flex items-center group" aria-label="FogCatalog Ana Sayfa">
                        <Logo size="lg" />
                    </Link>
                </div>

                {/* Center: Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    {menuItems.map((item) => (
                        <Link key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className={`flex items-center gap-3 shrink-0 ${fullWidth ? 'ml-8' : ''}`}>
                    {/* Language Switcher (Desktop) */}
                    <div className="hidden md:flex items-center bg-muted rounded-full p-1 mr-2 border border-border shadow-inner">
                        <button
                            onClick={() => setLanguage('tr')}
                            className={`px-3 py-1 text-[10px] font-black rounded-full transition-all duration-300 ${language === 'tr' ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'}`}
                            aria-label="Türkçe"
                        >
                            TR
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-3 py-1 text-[10px] font-black rounded-full transition-all duration-300 ${language === 'en' ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'}`}
                            aria-label="English"
                        >
                            EN
                        </button>
                    </div>

                    <Button
                        asChild
                        variant="brand"
                        size="lg"
                        className="hidden sm:inline-flex rounded-full shadow-lg shadow-brand/20 font-black uppercase text-[11px] tracking-wider"
                    >
                        <Link href="/auth?tab=signup" prefetch={false}>
                            {t('header.createCatalog')}
                            <Sparkles className="w-3.5 h-3.5" />
                        </Link>
                    </Button>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-foreground hover:bg-accent rounded-full transition-all duration-300 z-[120]"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6 animate-in spin-in-90 duration-300" /> : <Menu className="w-6 h-6 animate-in fade-in duration-300" />}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen ? (
                <PublicMobileMenu
                    menuItems={menuItems}
                    language={language}
                    setLanguage={setLanguage}
                    createCatalogLabel={t('header.createCatalog')}
                    sectionLabel={t('header.section')}
                    onClose={() => setIsMobileMenuOpen(false)}
                />
            ) : null}
        </header>
    )
}
