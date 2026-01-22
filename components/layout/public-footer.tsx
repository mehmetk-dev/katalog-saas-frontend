"use client"

import Link from "next/link"
import { LayoutGrid } from "lucide-react"

import { useTranslation } from "@/lib/i18n-provider"

export function PublicFooter() {
    const { t } = useTranslation()

    return (
        <footer className="border-t border-slate-200 bg-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-12 mb-12">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center">
                                <LayoutGrid className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg">FogCatalog</span>
                        </Link>
                        <p className="text-slate-500 leading-relaxed text-sm">
                            {t('footer.description')}
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-5">{t('footer.product')}</h4>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li><Link href="/features" className="hover:text-violet-600 transition-colors">{t('footer.features')}</Link></li>
                            <li><Link href="/pricing" className="hover:text-violet-600 transition-colors">{t('footer.pricing')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-5">{t('footer.support')}</h4>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li><Link href="/contact" className="hover:text-violet-600 transition-colors">{t('footer.contact')}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                    <p>{t('footer.rights')}</p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="hover:text-violet-600 transition-colors">{t('footer.privacy')}</Link>
                        <Link href="/terms" className="hover:text-violet-600 transition-colors">{t('footer.terms')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
