"use client"

import Link from "next/link"
import { LayoutGrid, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-provider"

export function PublicHeader() {
    const { t } = useTranslation()

    return (
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 border-b border-slate-200/50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-all duration-300 group-hover:scale-105">
                        <LayoutGrid className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">CatalogPro</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/features" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                        {t('header.features')}
                    </Link>
                    <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                        {t('header.pricing')}
                    </Link>
                    <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                        {t('header.contact')}
                    </Link>
                </nav>

                <div className="flex items-center gap-3">
                    <Link href="/auth" className="hidden sm:block">
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-violet-600 font-medium">
                            {t('header.login')}
                        </Button>
                    </Link>
                    <Link href="/auth?tab=signup">
                        <Button
                            size="sm"
                            className="h-9 px-5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:from-violet-700 hover:to-fuchsia-600 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 rounded-full transition-all duration-300 hover:scale-105 font-semibold border border-violet-400/20"
                        >
                            {t('header.createCatalog')}
                            <Sparkles className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}
