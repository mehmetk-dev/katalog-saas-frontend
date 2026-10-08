"use client"

import Link from "next/link"
import {
    Share2,
    Smartphone,
    Globe,
    Image as ImageIcon,
} from "lucide-react"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CheckItem } from "./shared"

export function ShareSection() {
    const { t } = useTranslation()

    return (
        <section className="max-w-7xl mx-auto mb-32 md:mb-48">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                    <div className="w-12 h-12 bg-info-soft rounded-2xl flex items-center justify-center mb-8">
                        <Share2 className="w-6 h-6 text-info" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 whitespace-pre-line">{t('featuresPage.shareTitle')}</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                        {t('featuresPage.shareDesc')}
                    </p>
                    <ul className="space-y-4 mb-8">
                        <CheckItem>{t('featuresPage.shareList1')}</CheckItem>
                        <CheckItem>{t('featuresPage.shareList2')}</CheckItem>
                        <CheckItem>{t('featuresPage.shareList3')}</CheckItem>
                    </ul>
                    <Link href="/auth?tab=signup">
                        <Button className={cn(
                            "h-14 px-8 bg-info hover:bg-info/90 text-info-foreground",
                            "rounded-full text-lg font-bold shadow-lg shadow-info/20"
                        )}>
                            {t('featuresPage.shareBtn')}
                        </Button>
                    </Link>
                </div>
                <div className="order-1 lg:order-2 relative group">
                    <div className="absolute inset-0 bg-info-soft rounded-[2rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>

                    {/* Social Sharing Visual */}
                    <div className="relative mx-auto w-full max-w-md bg-card rounded-[3rem] border-4 border-border shadow-2xl overflow-hidden p-8">
                        {/* Browser Header */}
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-brand"></div>
                                <div className="w-3 h-3 rounded-full bg-warning"></div>
                                <div className="w-3 h-3 rounded-full bg-success"></div>
                            </div>
                            <div className="flex-1 h-7 bg-muted/50 rounded-lg flex items-center px-3">
                                <Globe className="w-3 h-3 text-muted-foreground mr-2" />
                                <span className="text-xs text-muted-foreground">fogcatalog.com/catalog/...</span>
                            </div>
                        </div>

                        {/* Social Share Buttons */}
                        <div className="space-y-3">
                            {/* WhatsApp */}
                            <div className="flex items-center gap-3 p-3 bg-[#25D366]/10 rounded-xl border-2 border-[#25D366]/20 hover:scale-105 transition-transform cursor-pointer">
                                <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="h-2 w-20 bg-border rounded mb-1"></div>
                                    <div className="h-2 w-16 bg-accent rounded"></div>
                                </div>
                            </div>

                            {/* Instagram */}
                            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border-2 border-border/20 hover:scale-105 transition-transform cursor-pointer">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="h-2 w-24 bg-border rounded mb-1"></div>
                                    <div className="h-2 w-20 bg-accent rounded"></div>
                                </div>
                            </div>

                            {/* Facebook */}
                            <div className="flex items-center gap-3 p-3 bg-[#1877F2]/10 rounded-xl border-2 border-[#1877F2]/20 hover:scale-105 transition-transform cursor-pointer">
                                <div className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center text-white">
                                    <Share2 className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="h-2 w-20 bg-border rounded mb-1"></div>
                                    <div className="h-2 w-14 bg-accent rounded"></div>
                                </div>
                            </div>
                        </div>

                        {/* Link Copy Section */}
                        <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-mono">fogcatalog.com/c/abc123</span>
                                <div className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg">
                                    {t('featuresPage.shareCopy')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
