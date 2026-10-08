import React from "react"
import { MousePointerClick, QrCode, BarChart3, Sparkles, Layers } from "lucide-react"

import { cn } from "@/lib/utils"
import type { TranslationFn } from "./types"

/* ------------------------------------------------------------------ */
/*  Sub-components for each bento card                                 */
/* ------------------------------------------------------------------ */

function DragDropCard({ t }: { t: TranslationFn }) {
    return (
        <div className={cn(
            "md:col-span-2 group relative p-8 md:p-10 rounded-[2.5rem]",
            "bg-card border border-border/80",
            "shadow-xl shadow-black/5",
            "hover:shadow-2xl hover:shadow-black/10",
            "hover:border-border transition-all duration-500",
            "overflow-hidden flex flex-col md:flex-row gap-8",
            "items-center cursor-default"
        )}>
            <div className={cn(
                "absolute top-0 right-0 w-[500px] h-[500px]",
                "bg-gradient-to-br from-muted via-transparent to-transparent",
                "opacity-0 group-hover:opacity-100",
                "transition-opacity duration-700 pointer-events-none"
            )} />

            <div className="flex-1 relative z-10 text-left">
                <div className={cn(
                    "w-14 h-14 rounded-2xl bg-accent border border-border",
                    "flex items-center justify-center mb-6",
                    "group-hover:scale-110 transition-transform duration-500 shadow-sm"
                )}>
                    <MousePointerClick className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-foreground">{t('landing.dragDropTitle')}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                    {t('landing.dragDropDesc')}
                </p>
            </div>

            {/* Editor Simulation Mockup */}
            <div className="flex-1 w-full relative perspective-[1000px]">
                <div className={cn(
                    "relative bg-card rounded-2xl border border-border",
                    "shadow-lg overflow-hidden transform",
                    "group-hover:rotate-y-[-5deg] group-hover:rotate-x-[2deg]",
                    "transition-all duration-700 ease-out"
                )}>
                    {/* Fake Toolbar */}
                    <div className="h-10 bg-muted/50 border-b border-border flex items-center px-4 justify-between">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-brand/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
                        </div>
                        <div className="h-2 w-20 bg-accent rounded-full" />
                    </div>
                    {/* Content Area */}
                    <div className={cn(
                        "p-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]",
                        "[background-size:16px_16px] h-[220px] relative"
                    )}>
                        {/* Sidebar Tools */}
                        <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-12 bg-card",
                            "border-r border-border",
                            "flex flex-col items-center py-4 gap-3"
                        )}>
                            {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded bg-muted" />)}
                        </div>

                        {/* Draggable Catalog Item */}
                        <div className={cn(
                            "absolute top-1/2 left-1/2 w-40 p-3 bg-card",
                            "rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
                            "border border-border cursor-grab active:cursor-grabbing",
                            "transform -translate-x-1/2 -translate-y-1/2",
                            "group-hover:translate-x-4 group-hover:-translate-y-8",
                            "group-hover:rotate-3 transition-all duration-1000",
                            "ease-in-out z-20"
                        )}>
                            <div className={cn(
                                "aspect-square bg-accent rounded-md",
                                "mb-2 flex items-center justify-center"
                            )}>
                                <Layers className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="h-2 bg-muted rounded w-3/4 mb-1" />
                            <div className="h-2 bg-muted/50 rounded w-1/2" />

                            {/* Cursor Hand */}
                            <div className={cn(
                                "absolute -bottom-8 -right-8",
                                "opacity-0 group-hover:opacity-100",
                                "transition-opacity delay-200 duration-500"
                            )}>
                                <div className="px-3 py-1 bg-primary text-primary-foreground text-[10px] rounded-full shadow-lg">Drag Me!</div>
                            </div>
                        </div>

                        {/* Ghost Placeholder */}
                        <div className="absolute top-8 right-8 w-32 h-40 border-2 border-dashed border-border rounded-lg opacity-50" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function QrCodeCard({ t }: { t: TranslationFn }) {
    return (
        <div className={cn(
            "group relative p-8 rounded-[2.5rem] bg-card",
            "border border-border/80 hover:border-info/20",
            "shadow-xl shadow-black/5",
            "hover:shadow-2xl hover:shadow-info/20",
            "transition-all duration-500 overflow-hidden flex flex-col"
        )}>
            <div className={cn(
                "absolute inset-0 bg-info-soft/30",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            )} />

            <div className="mb-auto relative z-10">
                <div className={cn(
                    "w-14 h-14 rounded-2xl bg-info-soft border border-info/20",
                    "flex items-center justify-center mb-6 shadow-sm"
                )}>
                    <QrCode className="w-7 h-7 text-info" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">{t('landing.qrTitle')}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                    {t('landing.qrDesc')}
                </p>
            </div>

            {/* QR Animation */}
            <div className={cn(
                "mt-8 relative mx-auto w-32 h-32 bg-card p-3",
                "rounded-2xl shadow-lg border border-border",
                "group-hover:scale-105 transition-transform duration-500"
            )}>
                <div className={cn(
                    "w-full h-full bg-primary rounded-xl",
                    "flex items-center justify-center relative overflow-hidden"
                )}>
                    <QrCode className="w-20 h-20 text-white opacity-80" />
                    {/* Scanning Beam */}
                    <div className={cn(
                        "absolute top-0 left-0 w-full h-1 bg-info",
                        "shadow-[0_0_15px_rgba(96,165,250,0.8)]",
                        "animate-[scan_2s_ease-in-out_infinite]",
                        "opacity-0 group-hover:opacity-100"
                    )} />
                </div>
            </div>
        </div>
    )
}

const CHART_BAR_HEIGHTS = [35, 55, 40, 70, 50, 85, 60, 95] as const

function AnalyticsCard({ t }: { t: TranslationFn }) {
    return (
        <div className={cn(
            "group relative p-8 rounded-[2.5rem] bg-card",
            "border border-border/80 hover:border-success/20",
            "shadow-xl shadow-black/5",
            "hover:shadow-2xl hover:shadow-success/20",
            "transition-all duration-500 overflow-hidden flex flex-col"
        )}>
            <div className={cn(
                "absolute inset-0 bg-success-soft/30",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            )} />

            <div className="relative z-10">
                <div className={cn(
                    "w-14 h-14 rounded-2xl bg-success-soft border border-success/20",
                    "flex items-center justify-center mb-6 shadow-sm"
                )}>
                    <BarChart3 className="w-7 h-7 text-success" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">{t('landing.analyticsTitle')}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm mb-6">
                    {t('landing.analyticsDesc')}
                </p>
            </div>

            {/* Live Chart */}
            <div className="mt-auto h-32 w-full flex items-end justify-between gap-2 px-2 pb-2">
                {CHART_BAR_HEIGHTS.map((h, i) => (
                    <div key={i} className="relative w-full group/bar">
                        <div
                            className={cn(
                                "bg-success-soft rounded-t-md w-full",
                                "absolute bottom-0 transition-all duration-500",
                                "group-hover:bg-success/90"
                            )}
                            style={{ height: `${h}%` }}
                        />
                        {/* Hover Tooltip */}
                        <div className={cn(
                            "absolute -top-6 left-1/2 -translate-x-1/2",
                            "text-[10px] font-bold bg-primary text-primary-foreground",
                            "px-1.5 py-0.5 rounded",
                            "opacity-0 group-hover/bar:opacity-100 transition-opacity"
                        )}>
                            {h}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function TemplatesCard({ t }: { t: TranslationFn }) {
    return (
        <div className={cn(
            "md:col-span-2 group relative p-8 md:p-10 rounded-[2.5rem]",
            "bg-primary text-primary-foreground",
            "shadow-xl shadow-black/10",
            "hover:shadow-2xl hover:shadow-black/10",
            "transition-all duration-500 overflow-hidden",
            "flex flex-col md:flex-row gap-8 items-center cursor-pointer"
        )}>
            <div className={cn(
                "absolute top-0 right-0 w-[600px] h-[600px]",
                "bg-background/5 rounded-full blur-3xl -mr-32 -mt-32",
                "opacity-50 group-hover:scale-110",
                "transition-transform duration-1000"
            )} />

            <div className="flex-1 relative z-10">
                <div className={cn(
                    "w-14 h-14 rounded-2xl bg-background/10",
                    "border border-white/20 flex items-center",
                    "justify-center mb-6 backdrop-blur-sm"
                )}>
                    <Layers className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4">{t('landing.templatesTitle')}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                    {t('landing.templatesDesc')}
                </p>
            </div>

            {/* 3D Template Showcase */}
            <div className={cn(
                "flex-1 w-full flex justify-center",
                "perspective-[1200px] relative h-48 items-center"
            )}>
                {/* Card 1 (Left) */}
                <div className={cn(
                    "w-32 h-44 bg-card rounded-xl shadow-2xl absolute",
                    "left-4 md:left-10 transform scale-90 -rotate-12 translate-x-4",
                    "group-hover:-translate-x-12 group-hover:-rotate-[15deg]",
                    "transition-all duration-700 z-10 border border-border/50"
                )}>
                    <div className="h-24 bg-brand-soft rounded-t-xl mb-2" />
                    <div className="px-3 space-y-2">
                        <div className="w-full h-2 bg-muted rounded" />
                        <div className="w-2/3 h-2 bg-muted rounded" />
                    </div>
                </div>

                {/* Card 2 (Right) */}
                <div className={cn(
                    "w-32 h-44 bg-card rounded-xl shadow-2xl absolute",
                    "right-4 md:right-10 transform scale-90 rotate-12 -translate-x-4",
                    "group-hover:translate-x-12 group-hover:rotate-[15deg]",
                    "transition-all duration-700 z-10 border border-border/50"
                )}>
                    <div className="h-24 bg-success-soft rounded-t-xl mb-2" />
                    <div className="px-3 space-y-2">
                        <div className="w-full h-2 bg-muted rounded" />
                        <div className="w-2/3 h-2 bg-muted rounded" />
                    </div>
                </div>

                {/* Card 3 (Center - Hero) */}
                <div className={cn(
                    "w-36 h-48 bg-card rounded-xl",
                    "shadow-[0_20px_50px_rgba(0,0,0,0.3)] absolute z-30",
                    "transform group-hover:scale-110 group-hover:-translate-y-4",
                    "transition-all duration-500 border border-border"
                )}>
                    <div className={cn(
                        "h-28 bg-muted",
                        "rounded-t-xl mb-3 p-3 flex flex-col justify-end"
                    )}>
                        <div className="w-8 h-8 rounded bg-background/50 backdrop-blur-sm mb-2" />
                    </div>
                    <div className="px-4 space-y-2">
                        <div className="w-full h-2.5 bg-primary rounded-full" />
                        <div className="w-2/3 h-2 bg-accent rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Main Features Section                                              */
/* ------------------------------------------------------------------ */

interface FeaturesSectionProps {
    t: TranslationFn
}

export const FeaturesSection = React.memo(function FeaturesSection({ t }: FeaturesSectionProps) {
    return (
        <section id="özellikler" className="py-24 md:py-32 bg-muted/50 relative overflow-hidden">
            {/* Decorative Background */}
            <div className={cn(
                "absolute top-0 left-0 w-full h-full",
                "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]",
                "from-muted/50 via-muted/20 to-transparent pointer-events-none"
            )} />
            <div className={cn(
                "absolute top-1/4 right-0 w-[600px] h-[600px]",
                "bg-accent/30 rounded-full blur-3xl",
                "opacity-50 pointer-events-none translate-x-1/2"
            )} />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full",
                        "bg-accent text-primary border border-border",
                        "mb-6 font-semibold text-xs uppercase tracking-wider"
                    )}>
                        <Sparkles className="w-3 h-3" />
                        {t('landing.featuresBadge')}
                    </div>
                    <h2 className={cn(
                        "text-4xl md:text-6xl font-black mb-6",
                        "tracking-tight text-foreground leading-[1.1]"
                    )}>
                        {t('landing.featuresTitle')}
                    </h2>
                    <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
                        {t('landing.featuresSubtitle')}
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    <DragDropCard t={t} />
                    <QrCodeCard t={t} />
                    <AnalyticsCard t={t} />
                    <TemplatesCard t={t} />
                </div>
            </div>
        </section>
    )
})
