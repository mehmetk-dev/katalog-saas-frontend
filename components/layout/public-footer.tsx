"use client"

import Link from "next/link"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { Logo } from "@/components/ui/logo"

export function PublicFooter() {
    const { t } = useTranslation()

    return (
        <footer className="border-t border-border bg-background pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-1 group">
                            <Logo />
                        </Link>
                        <p className="text-muted-foreground leading-relaxed text-sm">
                            {t('footer.description')}
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-foreground mb-5">{t('footer.product')}</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/features" className="hover:text-foreground transition-colors">{t('footer.features')}</Link></li>
                            <li><Link href="/pricing" className="hover:text-foreground transition-colors">{t('footer.pricing')}</Link></li>
                            <li><Link href="/blog" className="hover:text-foreground transition-colors">{t('footer.blog')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-foreground mb-5">{t('footer.support')}</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/contact" className="hover:text-foreground transition-colors">{t('footer.contact')}</Link></li>
                            <li><Link href="/faq" className="hover:text-foreground transition-colors">{t('footer.faq')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-foreground mb-5">{t('footer.legal')}</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/legal/distance-sales-agreement" className="hover:text-foreground transition-colors">{t('footer.distanceSales')}</Link></li>
                            <li><Link href="/legal/cancellation-policy" className="hover:text-foreground transition-colors">{t('footer.cancellation')}</Link></li>
                            <li><Link href="/legal/kvkk" className="hover:text-foreground transition-colors">{t('footer.kvkk')}</Link></li>
                            <li><Link href="/legal/cookie-policy" className="hover:text-foreground transition-colors">{t('footer.cookies')}</Link></li>
                            <li><Link href="/legal/explicit-consent" className="hover:text-foreground transition-colors">{t('footer.consent')}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>{t('footer.rights')}</p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">{t('footer.privacy')}</Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">{t('footer.terms')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
