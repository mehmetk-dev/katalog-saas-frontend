"use client"

import Link from "next/link"
import {
    ArrowRight,
    MousePointerClick,
    QrCode,
    BarChart3,
    Share2,
    FileText,
    Smartphone,
    Rocket,
    Globe,
    Zap,
    Image as ImageIcon,
    ShieldCheck,
    Sparkles,
    Layers
} from "lucide-react"

import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-provider"
import { cn } from "@/lib/utils"

function CheckItem({ children, color = "green" }: {
    children: React.ReactNode
    color?: "green" | "emerald"
}) {
    const colorMap = {
        green: "bg-green-100 text-green-600",
        emerald: "bg-emerald-100 text-emerald-600",
    }
    return (
        <li className="flex items-center gap-3 font-semibold text-slate-700">
            <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                colorMap[color]
            )}>
                ✓
            </div>
            {children}
        </li>
    )
}

function FloatingProductBadge({
    imageUrl, position, className
}: {
    imageUrl: string
    position: "right" | "left"
    className?: string
}) {
    const positionCls = position === "right"
        ? "-right-8 -top-6"
        : "-left-8 bottom-10"

    return (
        <div className={cn(
            "absolute bg-white shadow-lg p-3 rounded-xl flex gap-3 animate-bounce",
            positionCls,
            className
        )}>
            <div
                className="w-10 h-10 bg-slate-100 rounded-lg bg-cover"
                style={{ backgroundImage: `url('${imageUrl}')` }}
            />
            <div>
                <div className="h-2 w-16 bg-slate-200 rounded mb-1" />
                <div className="h-2 w-10 bg-green-200 rounded" />
            </div>
            <div className={cn(
                "absolute -top-2 -right-2 bg-green-500 text-white",
                "text-[10px] w-5 h-5 flex items-center justify-center rounded-full"
            )}>
                ✓
            </div>
        </div>
    )
}

export default function FeaturesPage() {
    const { t } = useTranslation()
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100">
            <PublicHeader />

            <main className="pt-32 pb-24 md:pt-40 md:pb-32 px-4 overflow-hidden">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vh] bg-indigo-50/80 rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-blue-50/80 rounded-full blur-[150px]"></div>
                </div>

                {/* Hero Section */}
                <div className="max-w-5xl mx-auto text-center mb-32 relative">
                    <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                        "border border-slate-200 bg-white shadow-sm mb-8",
                        "animate-in fade-in zoom-in duration-700"
                    )}>
                        <Rocket className="w-4 h-4 text-sky-600" />
                        <span className={cn(
                            "text-xs font-bold uppercase tracking-widest text-slate-700"
                        )}>
                            {t('featuresPage.heroBadge')}
                        </span>
                    </div>

                    <h1 className={cn(
                        "text-5xl md:text-7xl lg:text-8xl font-black text-slate-900",
                        "mb-8 leading-[0.95] tracking-tight"
                    )}>
                        {t('featuresPage.heroTitle')} <br />
                        <span className={cn(
                            "text-transparent bg-clip-text bg-gradient-to-r",
                            "from-sky-600 via-blue-600 to-sky-600 animate-gradient-x"
                        )}>
                            {t('featuresPage.heroTitleHighlight')}
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light">
                        {t('featuresPage.heroDesc')}
                    </p>
                </div>

                {/* FEATURE 1: Bulk Upload (Left Image / Right Text) */}
                <section className="max-w-7xl mx-auto mb-32 md:mb-48">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative group">
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-tr from-sky-500 to-blue-600",
                                "rounded-[2rem] blur-2xl opacity-20",
                                "group-hover:opacity-30 transition-opacity"
                            )} />
                            <div className={cn(
                                "relative bg-white border border-slate-200 rounded-[2.5rem]",
                                "p-8 md:p-12 shadow-2xl shadow-sky-100/50 overflow-hidden",
                                "min-h-[400px] flex flex-col items-center justify-center"
                            )}>
                                {/* Visual Mockup for Drag & Drop */}
                                <div className={cn(
                                    "absolute inset-0 bg-slate-50/50",
                                    "[mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
                                )} />
                                <div className={cn(
                                    "w-full max-w-sm border-2 border-dashed border-sky-200",
                                    "bg-sky-50/50 rounded-3xl p-10 text-center relative z-10",
                                    "group-hover:scale-105 transition-transform duration-500"
                                )}>
                                    <div className={cn(
                                        "w-20 h-20 bg-white rounded-full shadow-lg mx-auto",
                                        "flex items-center justify-center mb-6"
                                    )}>
                                        <ImageIcon className="w-10 h-10 text-sky-600" />
                                    </div>
                                    <p className="font-bold text-slate-900 text-lg mb-2">{t('featuresPage.bulkDropTitle')}</p>
                                    <p className="text-sm text-slate-500">{t('featuresPage.bulkDropDesc')}</p>

                                    {/* Floating Badges */}
                                    <FloatingProductBadge
                                        position="right"
                                        imageUrl="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100"
                                    />
                                    <FloatingProductBadge
                                        position="left"
                                        imageUrl="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100"
                                        className="delay-150"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-8">
                                <MousePointerClick className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 whitespace-pre-line">{t('featuresPage.bulkTitle')}</h2>
                            <p className="text-xl text-slate-500 leading-relaxed mb-8">
                                {t('featuresPage.bulkDesc')}
                            </p>
                            <ul className="space-y-4">
                                <CheckItem>{t('featuresPage.bulkList1')}</CheckItem>
                                <CheckItem>{t('featuresPage.bulkList2')}</CheckItem>
                                <CheckItem>{t('featuresPage.bulkList3')}</CheckItem>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* FEATURE 2: Link Sharing & Social (Right Image / Left Text) */}
                <section className="max-w-7xl mx-auto mb-32 md:mb-48">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-8">
                                <Share2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 whitespace-pre-line">{t('featuresPage.shareTitle')}</h2>
                            <p className="text-xl text-slate-500 leading-relaxed mb-8">
                                {t('featuresPage.shareDesc')}
                            </p>
                            <ul className="space-y-4 mb-8">
                                <CheckItem>{t('featuresPage.shareList1')}</CheckItem>
                                <CheckItem>{t('featuresPage.shareList2')}</CheckItem>
                                <CheckItem>{t('featuresPage.shareList3')}</CheckItem>
                            </ul>
                            <Link href="/auth?plan=free">
                                <Button className={cn(
                                    "h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white",
                                    "rounded-full text-lg font-bold shadow-lg shadow-blue-200"
                                )}>
                                    {t('featuresPage.shareBtn')}
                                </Button>
                            </Link>
                        </div>
                        <div className="order-1 lg:order-2 relative group">
                            <div className="absolute inset-0 bg-blue-200 rounded-[2rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>

                            {/* Social Sharing Visual */}
                            <div className="relative mx-auto w-full max-w-md bg-white rounded-[3rem] border-4 border-slate-200 shadow-2xl overflow-hidden p-8">
                                {/* Browser Header */}
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="flex-1 h-7 bg-slate-50 rounded-lg flex items-center px-3">
                                        <Globe className="w-3 h-3 text-slate-400 mr-2" />
                                        <span className="text-xs text-slate-400">fogcatalog.com/catalog/...</span>
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
                                            <div className="h-2 w-20 bg-slate-300 rounded mb-1"></div>
                                            <div className="h-2 w-16 bg-slate-200 rounded"></div>
                                        </div>
                                    </div>

                                    {/* Instagram */}
                                    <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border-2 border-purple-300/20 hover:scale-105 transition-transform cursor-pointer">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-2 w-24 bg-slate-300 rounded mb-1"></div>
                                            <div className="h-2 w-20 bg-slate-200 rounded"></div>
                                        </div>
                                    </div>

                                    {/* Facebook */}
                                    <div className="flex items-center gap-3 p-3 bg-[#1877F2]/10 rounded-xl border-2 border-[#1877F2]/20 hover:scale-105 transition-transform cursor-pointer">
                                        <div className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center text-white">
                                            <Share2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-2 w-20 bg-slate-300 rounded mb-1"></div>
                                            <div className="h-2 w-14 bg-slate-200 rounded"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Link Copy Section */}
                                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400 font-mono">fogcatalog.com/c/abc123</span>
                                        <div className="px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-lg">
                                            {t('featuresPage.shareCopy')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FEATURE 3: Publishing (Left Image / Right Text) */}
                <section className="max-w-7xl mx-auto mb-32 md:mb-48">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative group">
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-tr from-emerald-500 to-teal-500",
                                "rounded-[2rem] blur-2xl opacity-10",
                                "group-hover:opacity-20 transition-opacity"
                            )} />
                            <div className={cn(
                                "relative bg-white border border-slate-200 rounded-[2.5rem]",
                                "p-8 md:p-12 shadow-2xl shadow-slate-100 overflow-hidden",
                                "min-h-[400px] flex flex-col items-center justify-center"
                            )}>
                                {/* Visual Mockup for Publishing */}
                                <div className={cn(
                                    "absolute inset-0",
                                    "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))]",
                                    "from-emerald-50/50 via-white to-white"
                                )} />

                                <div className="relative z-10 w-full max-w-sm">
                                    {/* Dashboard Mini Mockup */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 mb-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 bg-slate-100 rounded-lg bg-cover"
                                                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100')" }}
                                                />
                                                <div>
                                                    <div className="h-2 w-24 bg-slate-800 rounded mb-1.5"></div>
                                                    <div className="h-2 w-16 bg-slate-300 rounded"></div>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "px-3 py-1 bg-emerald-100 text-emerald-700",
                                                "text-[10px] font-bold rounded-full",
                                                "border border-emerald-200 flex items-center gap-1.5"
                                            )}>
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                YAYINDA
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-xs text-slate-500">
                                                <span>Son Güncelleme:</span>
                                                <span className="font-mono text-slate-900">Şimdi</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full w-full bg-emerald-500 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Card (Floating) */}
                                    <div className={cn(
                                        "absolute -right-4 -bottom-4 bg-slate-900 text-white",
                                        "p-5 rounded-2xl shadow-2xl shadow-slate-900/20 w-48",
                                        "group-hover:scale-105 transition-transform duration-500"
                                    )}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                <Zap className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <span className="font-bold text-sm">{t('featuresPage.publishQuick')}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mb-3">{t('featuresPage.publishQuickDesc')}</p>
                                        <div className="h-1 w-12 bg-emerald-500 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-8">
                                <Rocket className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 whitespace-pre-line">{t('featuresPage.publishTitle')}</h2>
                            <p className="text-xl text-slate-500 leading-relaxed mb-8">
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

                {/* FEATURE 3: QR & PDF (Dual Cards) */}
                <section className="max-w-7xl mx-auto mb-32">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Card 1: QR Code */}
                        <div className="bg-slate-950 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden group">
                            <div className={cn(
                                "absolute top-0 right-0 w-64 h-64 bg-emerald-500/20",
                                "rounded-full blur-[80px]",
                                "group-hover:bg-emerald-500/30 transition-colors duration-500"
                            )} />

                            <div className="relative z-10">
                                <QrCode className="w-12 h-12 text-emerald-400 mb-6" />
                                <h3 className="text-3xl font-bold mb-4">{t('featuresPage.qrTitle')}</h3>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                    {t('featuresPage.qrDesc')}
                                </p>
                                <div className={cn(
                                    "w-full max-w-[200px] aspect-square bg-white p-4",
                                    "rounded-xl mx-auto shadow-2xl rotate-3",
                                    "group-hover:rotate-0 transition-transform duration-500"
                                )}>
                                    <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
                                        <QrCode className="w-24 h-24 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: PDF Generation */}
                        <div className={cn(
                            "bg-slate-50 border border-slate-200 rounded-[3rem]",
                            "p-10 md:p-14 text-slate-900 relative overflow-hidden group"
                        )}>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-200/30 rounded-full blur-[80px]"></div>

                            <div className="relative z-10 h-full flex flex-col">
                                <div className="mb-auto">
                                    <FileText className="w-12 h-12 text-rose-500 mb-6" />
                                    <h3 className="text-3xl font-bold mb-4">{t('featuresPage.pdfTitle')}</h3>
                                    <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                                        {t('featuresPage.pdfDesc')}
                                    </p>
                                </div>

                                <div className="relative h-48 mt-8 perspective-[1000px]">
                                    <div className={cn(
                                        "absolute left-1/2 -translate-x-1/2 top-0",
                                        "w-40 h-56 bg-white shadow-xl shadow-slate-200",
                                        "border border-slate-200 rounded-lg",
                                        "rotate-x-12 group-hover:rotate-x-0",
                                        "group-hover:-translate-y-4 transition-all duration-500",
                                        "flex flex-col p-4 items-center"
                                    )}>
                                        <div className="w-full h-24 bg-slate-100 rounded mb-2 overflow-hidden">
                                            <div
                                                className="w-full h-full bg-cover opacity-50"
                                                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200')" }}
                                            />
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded mb-1"></div>
                                        <div className="w-2/3 h-2 bg-slate-100 rounded mb-4"></div>
                                        <div className="mt-auto flex items-center gap-2">
                                            <div className={cn(
                                                "w-6 h-6 bg-red-100 rounded flex items-center",
                                                "justify-center text-[8px] font-bold text-red-600"
                                            )}>
                                                PDF
                                            </div>
                                            <span className="text-[8px] text-slate-400">catalog.pdf</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* BENTO GRID: Other Features */}
                <section className="max-w-7xl mx-auto mb-20">
                    <h2 className="text-3xl font-bold text-center mb-16">{t('featuresPage.bentoHeader')}</h2>
                    <div className="grid md:grid-cols-4 gap-4 md:gap-6 auto-rows-[280px]">

                        {/* Card 1: Advanced Analytics (Wide) */}
                        <div className={cn(
                            "md:col-span-2 bg-white rounded-3xl p-8",
                            "border border-slate-200 hover:border-slate-300",
                            "hover:shadow-xl hover:shadow-slate-200/50",
                            "transition-all duration-300 flex flex-col justify-between",
                            "group overflow-hidden relative"
                        )}>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{t('featuresPage.analyticsTitle')}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{t('featuresPage.analyticsDesc')}</p>
                            </div>

                            {/* Chart Visual */}
                            <div className={cn(
                                "absolute right-0 bottom-0 w-1/2 h-2/3",
                                "flex items-end gap-2 px-6 pb-6",
                                "opacity-30 group-hover:opacity-100 transition-opacity duration-500"
                            )}>
                                <div className="w-full bg-blue-100 h-[40%] rounded-t-sm group-hover:h-[60%] transition-all duration-700 delay-100"></div>
                                <div className="w-full bg-blue-200 h-[70%] rounded-t-sm group-hover:h-[85%] transition-all duration-700 delay-200"></div>
                                <div className="w-full bg-blue-600 h-[50%] rounded-t-sm group-hover:h-[100%] transition-all duration-700 delay-300"></div>
                                <div className="w-full bg-blue-400 h-[30%] rounded-t-sm group-hover:h-[50%] transition-all duration-700 delay-100"></div>
                            </div>
                        </div>

                        {/* Card 2: Secure Infrastructure (Visual Rich) */}
                        <div className={cn(
                            "bg-slate-50 rounded-3xl p-6 border border-slate-200",
                            "overflow-hidden relative group",
                            "hover:bg-white hover:shadow-lg transition-all duration-500"
                        )}>
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity duration-500">
                                <ShieldCheck className={cn(
                                    "w-24 h-24 text-emerald-100 rotate-12 transform",
                                    "group-hover:text-emerald-500 transition-colors"
                                )} />
                            </div>

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className={cn(
                                        "w-10 h-10 bg-emerald-100/80 backdrop-blur-sm",
                                        "text-emerald-600 rounded-lg",
                                        "flex items-center justify-center mb-4"
                                    )}>
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 leading-tight whitespace-pre-line">{t('featuresPage.securityTitle')}</h3>
                                </div>

                                <div className="bg-white/80 backdrop-blur-md border border-emerald-100 rounded-xl p-3 mt-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">{t('featuresPage.securityStatus')}</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full w-[98%] bg-emerald-400 rounded-full"></div>
                                        </div>
                                        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                                            <span>SSL: Active</span>
                                            <span>256-bit</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Global Access (White Theme) */}
                        <div className={cn(
                            "bg-white rounded-3xl p-6 border border-slate-200",
                            "hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100/50",
                            "transition-all duration-500 relative overflow-hidden group"
                        )}>
                            {/* Map Background */}
                            <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 grayscale inverted">
                                <div className={cn(
                                    "absolute inset-0",
                                    "bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.1),transparent)]"
                                )} />
                                <svg viewBox="0 0 200 100" className="w-full h-full text-slate-900 fill-current">
                                    <path d="M20,50 Q50,20 80,50 T140,50 T200,50" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                                    <circle cx="20" cy="50" r="2" className="animate-ping text-sky-500" />
                                    <circle cx="80" cy="50" r="2" className="animate-ping delay-300 text-sky-500" />
                                    <circle cx="140" cy="50" r="2" className="animate-ping delay-700 text-sky-500" />
                                </svg>
                            </div>

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div className={cn(
                                    "w-10 h-10 bg-sky-50 text-sky-600 rounded-lg",
                                    "flex items-center justify-center",
                                    "border border-sky-100 mb-4"
                                )}>
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-1 leading-tight">Dünyaya<br />Açılın</h3>
                                    <p className="text-slate-500 text-[10px] leading-relaxed mb-3">
                                        Müşterileriniz nerede olursa olsun, ürünlerinize anında ulaşsın.
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "px-2 py-0.5 rounded-full bg-emerald-50",
                                            "border border-emerald-100 text-emerald-600",
                                            "text-[9px] font-bold tracking-wide",
                                            "flex items-center gap-1.5"
                                        )}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            7/24 KESİNTİSİZ
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Smart Categories (Replaced Quick Share) */}
                        <div className={cn(
                            "bg-white rounded-3xl p-6 border border-slate-200",
                            "flex flex-col justify-between",
                            "hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50",
                            "transition-all duration-500 group relative overflow-hidden"
                        )}>
                            <div className={cn(
                                "absolute -right-8 -top-8 w-32 h-32 bg-amber-50",
                                "rounded-full blur-2xl group-hover:bg-amber-100 transition-colors"
                            )} />

                            <div>
                                <div className={cn(
                                    "w-10 h-10 bg-amber-50 text-amber-600 rounded-lg",
                                    "flex items-center justify-center mb-4"
                                )}>
                                    <Layers className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 leading-tight mb-1">Akıllı<br />Kategoriler</h3>
                            </div>

                            <div className="mt-4 relative h-12">
                                {/* Stacked Tags Animation */}
                                <div className={cn(
                                    "absolute left-0 bottom-0 bg-white border border-slate-200",
                                    "text-[10px] font-medium text-slate-500 px-3 py-1.5",
                                    "rounded-lg shadow-sm w-3/4 transform",
                                    "group-hover:-translate-y-8 group-hover:scale-95",
                                    "transition-all duration-500 z-10"
                                )}>
                                    #Aksesuar
                                </div>
                                <div className={cn(
                                    "absolute left-2 bottom-1 bg-white border border-slate-200",
                                    "text-[10px] font-medium text-slate-500 px-3 py-1.5",
                                    "rounded-lg shadow-sm w-3/4 transform",
                                    "group-hover:-translate-y-4 group-hover:scale-100",
                                    "transition-all duration-500 z-20"
                                )}>
                                    #Giyim
                                </div>
                                <div className={cn(
                                    "absolute left-4 bottom-2 bg-amber-500",
                                    "border border-amber-500 text-[10px] font-bold text-white",
                                    "px-3 py-1.5 rounded-lg shadow-md w-3/4",
                                    "flex items-center justify-between transform",
                                    "group-hover:translate-y-0 group-hover:scale-105",
                                    "transition-all duration-500 z-30"
                                )}>
                                    <span>#Yeni Sezon</span>
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Card 5: Unlimited Variations (Wide - Replaced Purple Gradient) */}
                        <div className={cn(
                            "md:col-span-2 bg-slate-50 rounded-3xl p-8",
                            "border border-slate-200 relative overflow-hidden",
                            "group hover:border-slate-300 transition-colors"
                        )}>
                            {/* Abstract Pattern Background (Subtle) */}
                            <div className={cn(
                                "absolute top-0 right-0 w-64 h-64 bg-slate-200/50",
                                "rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"
                            )} />

                            <div className="relative z-10 flex flex-col h-full justify-center">
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Sınırsız Varyasyon</h3>
                                <p className="text-slate-600 mb-8 max-w-sm">
                                    Renk, beden, materyal... Ürünlerinizin tüm seçeneklerini en ince detayına kadar listeleyin.
                                </p>

                                <div className="flex gap-4">
                                    {[
                                        { color: "bg-rose-500", delay: "delay-0" },
                                        { color: "bg-blue-500", delay: "delay-75" },
                                        { color: "bg-amber-500", delay: "delay-150" },
                                        { color: "bg-emerald-500", delay: "delay-200" },
                                    ].map(({ color, delay }) => (
                                        <div
                                            key={color}
                                            className={cn(
                                                "w-8 h-8 rounded-full ring-4 ring-white shadow-lg",
                                                "group-hover:-translate-y-2 transition-transform duration-300",
                                                color, delay
                                            )}
                                        />
                                    ))}
                                    <div className={cn(
                                        "w-8 h-8 rounded-full bg-slate-900 ring-4 ring-white shadow-lg",
                                        "group-hover:-translate-y-2 transition-transform duration-300 delay-300",
                                        "flex items-center justify-center text-[10px] text-white font-bold"
                                    )}>
                                        +99
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 6: Fast Setup (Progress Bar) */}
                        <div className={cn(
                            "bg-white rounded-3xl p-6 border border-slate-200",
                            "flex flex-col justify-between",
                            "hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50",
                            "transition-all duration-500 group relative"
                        )}>
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Zap className="w-20 h-20 text-amber-500 -rotate-12" />
                            </div>

                            <div>
                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-4">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-900 leading-tight mb-1 whitespace-pre-line">{t('featuresPage.fastSetupTitle')}</h3>
                            </div>

                            <div className="mt-4">
                                <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">
                                    <span>{t('featuresPage.fastSetupLoading')}</span>
                                    <span className="text-amber-600">100%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className={cn(
                                        "h-full bg-amber-500 w-0 rounded-full",
                                        "group-hover:w-full transition-all duration-1000 ease-out"
                                    )} />
                                </div>
                                <div className={cn(
                                    "mt-2 text-[10px] text-emerald-600 font-medium",
                                    "opacity-0 group-hover:opacity-100",
                                    "transition-opacity delay-700 flex items-center gap-1"
                                )}>
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    {t('featuresPage.fastSetupLive')}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="max-w-7xl mx-auto mt-32 mb-20">
                    <div className="relative bg-slate-900 rounded-[3rem] overflow-hidden min-h-[400px] flex items-center">
                        {/* Background Patterns */}
                        <div className={cn(
                            "absolute top-0 right-0 w-[600px] h-[600px]",
                            "bg-sky-500/10 rounded-full blur-[120px]",
                            "-translate-y-1/2 translate-x-1/2 pointer-events-none"
                        )} />
                        <div className={cn(
                            "absolute bottom-0 left-0 w-[400px] h-[400px]",
                            "bg-blue-500/10 rounded-full blur-[100px]",
                            "translate-y-1/2 -translate-x-1/2 pointer-events-none"
                        )} />

                        <div className="grid lg:grid-cols-2 gap-12 w-full p-8 md:p-20 relative z-10 items-center">
                            {/* Text Content */}
                            <div className="text-left relative z-20">
                                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                    {t('featuresPage.ctaMainTitle')} <br />
                                    <span className="text-sky-400">{t('featuresPage.ctaHighlight')}</span>
                                </h2>
                                <p className="text-slate-400 text-base md:text-lg mb-8 max-w-md leading-relaxed">
                                    {t('featuresPage.ctaMainDesc')}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 items-start">
                                    <Link href="/auth?tab=signup" className="w-full sm:w-auto">
                                        <Button
                                            size="lg"
                                            className={cn(
                                                "w-full sm:w-auto h-14 md:h-16 px-10",
                                                "rounded-full text-base font-bold",
                                                "bg-white text-slate-900 hover:bg-slate-100",
                                                "hover:scale-105 transition-all shadow-xl"
                                            )}
                                        >
                                            {t('featuresPage.ctaButton')}
                                            <ArrowRight className="w-5 h-5 ml-2 text-slate-900" />
                                        </Button>
                                    </Link>
                                    <div className={cn(
                                        "flex items-center h-14 md:h-16",
                                        "px-0 md:px-4 text-slate-500",
                                        "text-xs font-medium tracking-wide"
                                    )}>
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                        {t('featuresPage.ctaNoCard')}
                                    </div>
                                </div>
                            </div>

                            {/* Visual: Catalog Mockup (Responsive) */}
                            <div className={cn(
                                "relative flex h-[280px] md:h-[320px]",
                                "items-center justify-center lg:perspective-[2000px]"
                            )}>
                                <div className={cn(
                                    "relative w-full max-w-[300px] lg:w-[500px] h-full",
                                    "flex justify-center items-center transform-style-3d",
                                    "hover:scale-105 transition-transform duration-700"
                                )}>

                                    {/* Left Page (Back Cover) - Hidden on Mobile */}
                                    <div className={cn(
                                        "hidden lg:flex absolute left-[30px]",
                                        "w-[220px] h-[300px] bg-slate-800",
                                        "rounded-l-2xl border border-slate-700 shadow-2xl",
                                        "transform rotate-y-6 origin-right z-10",
                                        "flex-col p-6"
                                    )}>
                                        <div className="w-full h-32 bg-slate-700/50 rounded-lg mb-4 shimmer"></div>
                                        <div className="space-y-2">
                                            <div className="w-full h-2 bg-slate-700/50 rounded"></div>
                                            <div className="w-full h-2 bg-slate-700/50 rounded"></div>
                                            <div className="w-2/3 h-2 bg-slate-700/50 rounded"></div>
                                        </div>
                                        <div className="mt-auto flex gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-700/50"></div>
                                            <div className="w-8 h-8 rounded-full bg-slate-700/50"></div>
                                        </div>
                                    </div>

                                    {/* Right Page (Front Cover) - Visible & Styled on Mobile */}
                                    <div className={cn(
                                        "relative lg:absolute lg:right-[30px]",
                                        "w-full max-w-[240px] lg:w-[220px]",
                                        "h-[320px] lg:h-[300px]",
                                        "bg-gradient-to-br from-slate-700 to-slate-900",
                                        "rounded-2xl lg:rounded-r-2xl",
                                        "shadow-2xl shadow-slate-900/50",
                                        "lg:transform lg:-rotate-y-6 lg:origin-left z-20",
                                        "flex flex-col p-8 items-center justify-center",
                                        "text-white border border-white/10 group"
                                    )}>
                                        <Sparkles className="w-12 h-12 lg:w-10 lg:h-10 mb-6 text-sky-200" />
                                        <h3 className="font-serif text-4xl lg:text-3xl mb-3 lg:mb-2 tracking-tight">{t('featuresPage.ctaCollection')}</h3>
                                        <div className="w-16 lg:w-12 h-1 bg-white/30 rounded-full mb-3 lg:mb-2"></div>
                                        <p className="text-xs lg:text-[10px] text-sky-200 tracking-[0.3em] uppercase">2026 / 2027</p>

                                        {/* Shine Effect */}
                                        <div className={cn(
                                            "absolute inset-0 bg-gradient-to-tr",
                                            "from-transparent via-white/10 to-transparent",
                                            "rounded-2xl lg:rounded-r-2xl pointer-events-none"
                                        )} />
                                    </div>

                                    {/* Spine - Hidden on Mobile */}
                                    <div className={cn(
                                        "hidden lg:block absolute w-[60px] h-[300px]",
                                        "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 z-0"
                                    )} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <PublicFooter />
        </div >
    )
}
