"use client"

import { Rocket, Zap } from "lucide-react"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
import { CheckItem } from "./shared"

export function PublishSection() {
    const { t } = useTranslation()

    return (
        <section className="max-w-7xl mx-auto mb-32 md:mb-48">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="relative group">
                    <div className={cn(
                        "absolute inset-0 bg-success",
                        "rounded-[2rem] blur-2xl opacity-10",
                        "group-hover:opacity-20 transition-opacity"
                    )} />
                    <div className={cn(
                        "relative bg-card border border-border rounded-[2.5rem]",
                        "p-8 md:p-12 shadow-2xl shadow-black/5 overflow-hidden",
                        "min-h-[400px] flex flex-col items-center justify-center"
                    )}>
                        <div className={cn(
                            "absolute inset-0",
                            "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))]",
                            "from-success-soft/50 via-background to-background"
                        )} />

                        <div className="relative z-10 w-full max-w-sm">
                            {/* Dashboard Mini Mockup */}
                            <div className="bg-card rounded-2xl border border-border shadow-xl p-6 mb-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 bg-muted rounded-lg bg-cover"
                                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100')" }}
                                        />
                                        <div>
                                            <div className="h-2 w-24 bg-primary rounded mb-1.5"></div>
                                            <div className="h-2 w-16 bg-border rounded"></div>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 bg-success-soft text-success-soft-foreground",
                                        "text-[10px] font-bold rounded-full",
                                        "border border-success/20 flex items-center gap-1.5"
                                    )}>
                                        <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                                        YAYINDA
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Son Güncelleme:</span>
                                        <span className="font-mono text-foreground">Şimdi</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full w-full bg-success rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Card (Floating) */}
                            <div className={cn(
                                "absolute -right-4 -bottom-4 bg-primary text-primary-foreground",
                                "p-5 rounded-2xl shadow-2xl shadow-black/20 w-48",
                                "group-hover:scale-105 transition-transform duration-500"
                            )}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-success" />
                                    </div>
                                    <span className="font-bold text-sm">{t('featuresPage.publishQuick')}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mb-3">{t('featuresPage.publishQuickDesc')}</p>
                                <div className="h-1 w-12 bg-success rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="w-12 h-12 bg-success-soft rounded-2xl flex items-center justify-center mb-8">
                        <Rocket className="w-6 h-6 text-success" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 whitespace-pre-line">{t('featuresPage.publishTitle')}</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                        {t('featuresPage.publishDesc')}
                    </p>
                    <ul className="space-y-4">
                        <CheckItem color="emerald">{t('featuresPage.publishList1')}</CheckItem>
                        <CheckItem color="emerald">{t('featuresPage.publishList2')}</CheckItem>
                        <CheckItem color="emerald">{t('featuresPage.publishList3')}</CheckItem>
                    </ul>
                </div>
            </div>
        </section>
    )
}
