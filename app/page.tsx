"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Zap,
  Share2,
  Sparkles,
  Users,
  FileText,
  QrCode,
  BarChart3,
  MousePointerClick,
  Layers,
  Smartphone,
  Eye,
  TrendingUp
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { useTranslation } from "@/lib/i18n-provider"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const { t, language } = useTranslation()
  const router = useRouter()

  // Update document title when language changes
  useEffect(() => {
    document.title = t('common.siteTitle')
  }, [language, t])

  // Auth Error Handling (Supabase redirects to home on expired links)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    // Hem query params (?) hem de hash (#) kısımlarını kontrol et
    const error = url.searchParams.get('error') || new URLSearchParams(url.hash.substring(1)).get('error')
    const errorCode = url.searchParams.get('error_code') || new URLSearchParams(url.hash.substring(1)).get('error_code')
    const errorDesc = url.searchParams.get('error_description') || new URLSearchParams(url.hash.substring(1)).get('error_description')

    if (error || errorCode || errorDesc) {

      const authUrl = new URL(`${window.location.origin}/auth`)
      if (error) authUrl.searchParams.set('error', error)
      if (errorCode) authUrl.searchParams.set('error_code', errorCode)
      if (errorDesc) authUrl.searchParams.set('error_description', errorDesc)

      router.replace(authUrl.pathname + authUrl.search)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
        {/* Modern Background */}
        <div className={cn(
          "absolute inset-0 -z-20",
          "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))]",
          "from-violet-100/40 via-slate-50 to-white"
        )} />

        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] -z-10 opacity-60 pointer-events-none overflow-hidden">
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-[800px] h-[800px] bg-gradient-to-tr",
            "from-violet-400/30 to-fuchsia-300/30",
            "rounded-full blur-[120px] animate-pulse"
          )} />
          <div className={cn(
            "absolute top-0 right-0 w-[500px] h-[500px]",
            "bg-sky-300/20 rounded-full blur-[100px]",
            "mix-blend-multiply animate-pulse animation-delay-2000"
          )} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Animated Badge */}
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full",
              "bg-white/80 border border-violet-100 text-violet-700",
              "shadow-sm shadow-violet-100/50 mb-8 backdrop-blur-md",
              "animate-in fade-in slide-in-from-bottom-4 duration-700"
            )}>
              <span className="relative flex h-2 w-2">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full",
                  "rounded-full bg-violet-400 opacity-75"
                )} />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">{t('landing.badge')}</span>
            </div>

            {/* Massive Headline */}
            <h1 className={cn(
              "text-5xl sm:text-7xl md:text-8xl font-black tracking-tight",
              "mb-8 leading-[0.95] text-slate-900",
              "animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100"
            )}>
              {t('landing.heroTitle')}{' '}
              <br className="hidden md:block" />
              <span className={cn(
                "text-transparent bg-clip-text bg-gradient-to-r",
                "from-violet-600 via-fuchsia-600 to-sky-600 animate-gradient-x"
              )}>
                {t('landing.heroTitleHighlight')}
              </span>{' '}
              {t('landing.heroTitleEnd')}
            </h1>

            {/* Subtext */}
            <p className={cn(
              "text-lg md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto",
              "leading-relaxed font-light",
              "animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200"
            )}>
              {t('landing.heroSubtitle')}
            </p>

            {/* Call to Actions */}
            <div className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-4",
              "animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300"
            )}>
              <Link href="/auth?tab=signup">
                <Button
                  size="lg"
                  className={cn(
                    "h-16 px-10 text-lg rounded-full bg-slate-900",
                    "hover:bg-slate-800 shadow-xl shadow-slate-900/20",
                    "transition-all duration-300 hover:scale-105",
                    "hover:-translate-y-1 font-bold group"
                  )}
                >
                  {t('landing.startNow')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/create-demo">
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-16 px-10 text-lg rounded-full border-slate-200",
                    "bg-white/50 hover:bg-white hover:border-violet-200",
                    "hover:text-violet-600 transition-all duration-300",
                    "hover:scale-105 backdrop-blur-sm font-semibold"
                  )}
                >
                  {t('landing.seeExamples')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual - Glassmorphism & 3D */}
          <div className={cn(
            "mt-24 relative max-w-6xl mx-auto",
            "perspective-[2000px] group",
            "animate-in fade-in zoom-in duration-1000 delay-500"
          )}>
            {/* Glow Effect */}
            <div className={cn(
              "absolute inset-0 -z-10 bg-gradient-to-t",
              "from-violet-500/20 via-transparent to-transparent",
              "blur-3xl opacity-50 group-hover:opacity-75",
              "transition-opacity duration-700"
            )} />

            {/* Laptop Mockup Image Functionality */}
            <div className={cn(
              "relative transform transition-all duration-700",
              "group-hover:rotate-x-2 group-hover:-translate-y-4"
            )}>
              {/* Reflection/Shine */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-tr",
                "from-white/20 via-transparent to-transparent",
                "z-20 rounded-2xl pointer-events-none"
              )} />

              <Image
                src="/hero-catalog.png"
                alt="FogCatalog Dashboard"
                className="w-full rounded-2xl shadow-2xl ring-1 ring-white/20"
                priority
                width={1200}
                height={675}
              />

              {/* Floating Cards - Reimagined */}
              <div className={cn(
                "absolute -left-12 top-1/4 p-4 pl-5",
                "bg-white/80 backdrop-blur-xl rounded-2xl",
                "shadow-2xl shadow-slate-900/10 border border-white/50",
                "hidden lg:flex items-center gap-4 animate-float z-30",
                "transform hover:scale-110 transition-transform duration-300"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br",
                  "from-emerald-400 to-green-500",
                  "flex items-center justify-center",
                  "shadow-lg shadow-emerald-200"
                )}>
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('landing.newView')}</p>
                  <p className="text-xl font-black text-slate-900">{t('landing.today')}</p>
                </div>
              </div>

              <div className={cn(
                "absolute -right-8 top-1/3 p-4 pl-5",
                "bg-white/80 backdrop-blur-xl rounded-2xl",
                "shadow-2xl shadow-slate-900/10 border border-white/50",
                "hidden lg:flex items-center gap-4",
                "animate-float animation-delay-1000 z-30",
                "transform hover:scale-110 transition-transform duration-300"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br",
                  "from-violet-500 to-fuchsia-500",
                  "flex items-center justify-center",
                  "shadow-lg shadow-fuchsia-200"
                )}>
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('landing.catalogViewed')}</p>
                  <p className="text-xl font-black text-slate-900">{t('landing.summerCollection')}</p>
                </div>
              </div>

              {/* Bottom Label */}
              <div className={cn(
                "absolute -bottom-6 left-1/2 -translate-x-1/2",
                "px-6 py-3 bg-slate-900/90 backdrop-blur-md rounded-full",
                "text-white text-sm font-medium shadow-2xl",
                "flex items-center gap-2 border border-white/10",
                "opacity-0 group-hover:opacity-100",
                "transition-opacity duration-500 delay-100",
                "transform translate-y-4 group-hover:translate-y-0"
              )}>
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Dashboard Preview v2.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Trusted By */}
      <section className="py-10 border-b border-slate-200/60 bg-white/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-400 mb-8 uppercase tracking-[0.2em]">
            {t('landing.trustedBy')}
          </p>
          <div className="relative overflow-hidden">
            <div className={cn(
              "flex flex-wrap items-center justify-center gap-x-12 gap-y-8",
              "opacity-60 grayscale hover:grayscale-0 hover:opacity-100",
              "transition-all duration-700"
            )}>
              {['Moda Butik', 'Tech Store', 'Home Decor', 'Auto Parts', 'Organic Market', 'Beauty Shop'].map((brand, i) => (
                <div key={i} className={cn(
                  "group flex items-center gap-2.5 text-slate-700",
                  "font-black text-xl tracking-tight cursor-default",
                  "select-none hover:scale-105 transition-transform"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-xl bg-gradient-to-br",
                    "from-slate-100 to-slate-200 border border-slate-300/50",
                    "flex items-center justify-center shadow-sm",
                    "group-hover:shadow-md transition-all"
                  )}>
                    <FileText className="w-5 h-5 text-slate-500 group-hover:text-violet-600 transition-colors" />
                  </div>
                  <span>{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section id="özellikler" className="py-24 md:py-32 bg-slate-50/50 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className={cn(
          "absolute top-0 left-0 w-full h-full",
          "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]",
          "from-slate-100/50 via-slate-50/20 to-transparent pointer-events-none"
        )} />
        <div className={cn(
          "absolute top-1/4 right-0 w-[600px] h-[600px]",
          "bg-violet-100/30 rounded-full blur-3xl",
          "opacity-50 pointer-events-none translate-x-1/2"
        )} />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full",
              "bg-violet-100 text-violet-700 border border-violet-200",
              "mb-6 font-semibold text-xs uppercase tracking-wider"
            )}>
              <Sparkles className="w-3 h-3" />
              {t('landing.featuresBadge')}
            </div>
            <h2 className={cn(
              "text-4xl md:text-6xl font-black mb-6",
              "tracking-tight text-slate-900 leading-[1.1]"
            )}>
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-xl text-slate-500 font-light leading-relaxed max-w-2xl mx-auto">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Large Card - Drag & Drop */}
            <div className={cn(
              "md:col-span-2 group relative p-8 md:p-10 rounded-[2.5rem]",
              "bg-white border border-slate-200/80",
              "shadow-xl shadow-slate-200/40",
              "hover:shadow-2xl hover:shadow-violet-200/30",
              "hover:border-violet-200 transition-all duration-500",
              "overflow-hidden flex flex-col md:flex-row gap-8",
              "items-center cursor-default"
            )}>
              <div className={cn(
                "absolute top-0 right-0 w-[500px] h-[500px]",
                "bg-gradient-to-br from-violet-50 via-transparent to-transparent",
                "opacity-0 group-hover:opacity-100",
                "transition-opacity duration-700 pointer-events-none"
              )} />

              <div className="flex-1 relative z-10 text-left">
                <div className={cn(
                  "w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100",
                  "flex items-center justify-center mb-6",
                  "group-hover:scale-110 transition-transform duration-500 shadow-sm"
                )}>
                  <MousePointerClick className="w-7 h-7 text-violet-600" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-slate-900">{t('landing.dragDropTitle')}</h3>
                <p className="text-slate-500 text-lg leading-relaxed">
                  {t('landing.dragDropDesc')}
                </p>
              </div>

              {/* Advanced UI Mockup - Editor Simulation */}
              <div className="flex-1 w-full relative perspective-[1000px]">
                <div className={cn(
                  "relative bg-white rounded-2xl border border-slate-200",
                  "shadow-lg overflow-hidden transform",
                  "group-hover:rotate-y-[-5deg] group-hover:rotate-x-[2deg]",
                  "transition-all duration-700 ease-out"
                )}>
                  {/* Fake Toolbar */}
                  <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                    </div>
                    <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                  </div>
                  {/* Content Area */}
                  <div className={cn(
                    "p-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]",
                    "[background-size:16px_16px] h-[220px] relative"
                  )}>
                    {/* Sidebar Tools */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-12 bg-white",
                      "border-r border-slate-100",
                      "flex flex-col items-center py-4 gap-3"
                    )}>
                      {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded bg-slate-100"></div>)}
                    </div>

                    {/* Draggable Catalog Item */}
                    <div className={cn(
                      "absolute top-1/2 left-1/2 w-40 p-3 bg-white",
                      "rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
                      "border border-slate-100 cursor-grab active:cursor-grabbing",
                      "transform -translate-x-1/2 -translate-y-1/2",
                      "group-hover:translate-x-4 group-hover:-translate-y-8",
                      "group-hover:rotate-3 transition-all duration-1000",
                      "ease-in-out z-20"
                    )}>
                      <div className={cn(
                        "aspect-square bg-violet-100 rounded-md",
                        "mb-2 flex items-center justify-center"
                      )}>
                        <Layers className="w-8 h-8 text-violet-300" />
                      </div>
                      <div className="h-2 bg-slate-100 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-slate-50 rounded w-1/2"></div>

                      {/* Cursor Hand */}
                      <div className={cn(
                        "absolute -bottom-8 -right-8",
                        "opacity-0 group-hover:opacity-100",
                        "transition-opacity delay-200 duration-500"
                      )}>
                        <div className="px-3 py-1 bg-slate-800 text-white text-[10px] rounded-full shadow-lg">Drag Me!</div>
                      </div>
                    </div>

                    {/* Ghost Placeholders */}
                    <div className="absolute top-8 right-8 w-32 h-40 border-2 border-dashed border-slate-200 rounded-lg opacity-50"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Card */}
            <div className={cn(
              "group relative p-8 rounded-[2.5rem] bg-white",
              "border border-slate-200/80 hover:border-blue-300",
              "shadow-xl shadow-slate-200/40",
              "hover:shadow-2xl hover:shadow-blue-200/20",
              "transition-all duration-500 overflow-hidden flex flex-col"
            )}>
              <div className={cn(
                "absolute inset-0 bg-blue-50/30",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              )} />

              <div className="mb-auto relative z-10">
                <div className={cn(
                  "w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100",
                  "flex items-center justify-center mb-6 shadow-sm"
                )}>
                  <QrCode className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-900">{t('landing.qrTitle')}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {t('landing.qrDesc')}
                </p>
              </div>

              {/* QR Animation */}
              <div className={cn(
                "mt-8 relative mx-auto w-32 h-32 bg-white p-3",
                "rounded-2xl shadow-lg border border-slate-100",
                "group-hover:scale-105 transition-transform duration-500"
              )}>
                <div className={cn(
                  "w-full h-full bg-slate-900 rounded-xl",
                  "flex items-center justify-center relative overflow-hidden"
                )}>
                  {/* QR Pattern */}
                  <QrCode className="w-20 h-20 text-white opacity-80" />
                  {/* Scanning Beam */}
                  <div className={cn(
                    "absolute top-0 left-0 w-full h-1 bg-blue-400",
                    "shadow-[0_0_15px_rgba(96,165,250,0.8)]",
                    "animate-[scan_2s_ease-in-out_infinite]",
                    "opacity-0 group-hover:opacity-100"
                  )} />
                </div>
              </div>
            </div>

            {/* Analytics Card */}
            <div className={cn(
              "group relative p-8 rounded-[2.5rem] bg-white",
              "border border-slate-200/80 hover:border-emerald-300",
              "shadow-xl shadow-slate-200/40",
              "hover:shadow-2xl hover:shadow-emerald-200/20",
              "transition-all duration-500 overflow-hidden flex flex-col"
            )}>
              <div className={cn(
                "absolute inset-0 bg-emerald-50/30",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              )} />

              <div className="relative z-10">
                <div className={cn(
                  "w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100",
                  "flex items-center justify-center mb-6 shadow-sm"
                )}>
                  <BarChart3 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-900">{t('landing.analyticsTitle')}</h3>
                <p className="text-slate-500 leading-relaxed text-sm mb-6">
                  {t('landing.analyticsDesc')}
                </p>
              </div>

              {/* Live Chart */}
              <div className="mt-auto h-32 w-full flex items-end justify-between gap-2 px-2 pb-2">
                {[35, 55, 40, 70, 50, 85, 60, 95].map((h, i) => (
                  <div key={i} className="relative w-full group/bar">
                    <div
                      className={cn(
                        "bg-emerald-200 rounded-t-md w-full",
                        "absolute bottom-0 transition-all duration-500",
                        "group-hover:bg-emerald-500"
                      )}
                      style={{ height: `${h}%` }}
                    ></div>
                    {/* Hover Tooltip Effect */}
                    <div className={cn(
                      "absolute -top-6 left-1/2 -translate-x-1/2",
                      "text-[10px] font-bold bg-slate-800 text-white",
                      "px-1.5 py-0.5 rounded",
                      "opacity-0 group-hover/bar:opacity-100 transition-opacity"
                    )}>
                      {h}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Templates Card (Full Width) */}
            <div className={cn(
              "md:col-span-2 group relative p-8 md:p-10 rounded-[2.5rem]",
              "bg-indigo-600 text-white",
              "shadow-xl shadow-indigo-900/20",
              "hover:shadow-2xl hover:shadow-indigo-600/30",
              "transition-all duration-500 overflow-hidden",
              "flex flex-col md:flex-row gap-8 items-center cursor-pointer"
            )}>
              <div className={cn(
                "absolute top-0 right-0 w-[600px] h-[600px]",
                "bg-white/5 rounded-full blur-3xl -mr-32 -mt-32",
                "opacity-50 group-hover:scale-110",
                "transition-transform duration-1000"
              )} />

              <div className="flex-1 relative z-10">
                <div className={cn(
                  "w-14 h-14 rounded-2xl bg-white/10",
                  "border border-white/20 flex items-center",
                  "justify-center mb-6 backdrop-blur-sm"
                )}>
                  <Layers className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4">{t('landing.templatesTitle')}</h3>
                <p className="text-indigo-100 text-lg leading-relaxed max-w-md">
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
                  "w-32 h-44 bg-white rounded-xl shadow-2xl absolute",
                  "left-4 md:left-10 transform scale-90 -rotate-12 translate-x-4",
                  "group-hover:-translate-x-12 group-hover:-rotate-[15deg]",
                  "transition-all duration-700 z-10 border border-slate-200/50"
                )}>
                  <div className="h-24 bg-rose-100 rounded-t-xl mb-2"></div>
                  <div className="px-3 space-y-2">
                    <div className="w-full h-2 bg-slate-100 rounded"></div>
                    <div className="w-2/3 h-2 bg-slate-100 rounded"></div>
                  </div>
                </div>

                {/* Card 2 (Right) */}
                <div className={cn(
                  "w-32 h-44 bg-white rounded-xl shadow-2xl absolute",
                  "right-4 md:right-10 transform scale-90 rotate-12 -translate-x-4",
                  "group-hover:translate-x-12 group-hover:rotate-[15deg]",
                  "transition-all duration-700 z-10 border border-slate-200/50"
                )}>
                  <div className="h-24 bg-emerald-100 rounded-t-xl mb-2"></div>
                  <div className="px-3 space-y-2">
                    <div className="w-full h-2 bg-slate-100 rounded"></div>
                    <div className="w-2/3 h-2 bg-slate-100 rounded"></div>
                  </div>
                </div>

                {/* Card 3 (Center - Hero) */}
                <div className={cn(
                  "w-36 h-48 bg-white rounded-xl",
                  "shadow-[0_20px_50px_rgba(0,0,0,0.3)] absolute z-30",
                  "transform group-hover:scale-110 group-hover:-translate-y-4",
                  "transition-all duration-500 border border-slate-100"
                )}>
                  <div className={cn(
                    "h-28 bg-gradient-to-br from-violet-200 to-fuchsia-200",
                    "rounded-t-xl mb-3 p-3 flex flex-col justify-end"
                  )}>
                    <div className="w-8 h-8 rounded bg-white/50 backdrop-blur-sm mb-2"></div>
                  </div>
                  <div className="px-4 space-y-2">
                    <div className="w-full h-2.5 bg-slate-800 rounded-full"></div>
                    <div className="w-2/3 h-2 bg-slate-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile / Dark Section */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
        {/* Background Gradient */}
        <div className={cn(
          "absolute top-0 left-0 w-full h-full",
          "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]",
          "from-violet-900/20 via-slate-900 to-slate-900"
        )} />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Phone Mockup */}
            <div className="w-full lg:w-1/2 relative">
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r",
                "from-violet-600/30 to-fuchsia-600/30",
                "rounded-full blur-[100px] scale-75"
              )} />
              <div className="relative mx-auto w-[280px]">
                {/* Phone Frame */}
                <div className={cn(
                  "relative bg-slate-800 rounded-[3rem] p-3",
                  "shadow-2xl shadow-black/50 border border-slate-700"
                )}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-2xl" />
                  <div className="rounded-[2.2rem] overflow-hidden bg-white aspect-[9/19]">
                    <Image
                      src="/hero-dashboard.webp"
                      alt="FogCatalog mobil uyumlu katalog görünümü - Akıllı telefon üzerinde ürün kataloğu"
                      className="w-full h-full object-cover"
                      width={280}
                      height={592}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="w-full lg:w-1/2 space-y-8">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full",
                "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              )}>
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">{t('landing.mobileBadge')}</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                {t('landing.mobileTitle')}{' '}
                <span className={cn(
                  "text-transparent bg-clip-text bg-gradient-to-r",
                  "from-cyan-400 to-violet-400"
                )}>
                  {t('landing.mobileScore')}
                </span>
              </h2>

              <p className="text-xl text-slate-400 leading-relaxed">
                {t('landing.mobileDesc')}
              </p>

              <ul className="space-y-5">
                {[
                  t('landing.mobileFeature1'),
                  t('landing.mobileFeature2'),
                  t('landing.mobileFeature3')
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className={cn(
                  "h-12 px-6 bg-white text-slate-900",
                  "hover:bg-slate-100 rounded-full font-semibold",
                  "shadow-xl shadow-white/10"
                )}
              >
                {t('landing.mobileButton')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Timeline */}
      <section id="nasıl-çalışır" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-20">
            {/* Left - Dashboard Mockup */}
            <div className="w-full lg:w-1/2 lg:sticky lg:top-32 lg:self-start">
              <div className={cn(
                "relative rounded-2xl shadow-2xl shadow-violet-500/10",
                "border border-slate-200 overflow-hidden bg-white"
              )}>
                {/* Browser Chrome */}
                <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                </div>
                {/* Dashboard Content */}
                <div className="p-6 bg-slate-50/50 aspect-[4/3]">
                  <div className="grid grid-cols-12 gap-4 h-full">
                    {/* Sidebar */}
                    <div className={cn(
                      "col-span-3 bg-white rounded-xl shadow-sm",
                      "border border-slate-100 p-3 space-y-2"
                    )}>
                      <div className="h-8 bg-violet-100 rounded-lg" />
                      <div className="h-6 bg-slate-100 rounded w-3/4" />
                      <div className="h-6 bg-slate-100 rounded w-1/2" />
                    </div>
                    {/* Main Content */}
                    <div className="col-span-9 space-y-4">
                      <div className="h-24 bg-white rounded-xl shadow-sm border border-slate-100" />
                      <div className="grid grid-cols-3 gap-3">
                        <div className="h-20 bg-white rounded-xl shadow-sm border border-slate-100" />
                        <div className="h-20 bg-white rounded-xl shadow-sm border border-slate-100" />
                        <div className="h-20 bg-white rounded-xl shadow-sm border border-slate-100" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Timeline */}
            <div className="w-full lg:w-1/2">
              <Badge className="mb-6 bg-violet-100 text-violet-700 hover:bg-violet-200 border-0">
                {t('landing.howItWorksBadge')}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tight">
                {t('landing.howItWorksTitle')}
              </h2>

              {/* Timeline */}
              <div className="relative">
                {/* Vertical Line */}
                <div className={cn(
                  "absolute left-6 top-0 bottom-0 w-0.5",
                  "bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500"
                )} />

                <div className="space-y-16">
                  {[
                    {
                      step: '01',
                      title: t('landing.step1Title'),
                      desc: t('landing.step1Desc'),
                      icon: Users
                    },
                    {
                      step: '02',
                      title: t('landing.step2Title'),
                      desc: t('landing.step2Desc'),
                      icon: FileText
                    },
                    {
                      step: '03',
                      title: t('landing.step3Title'),
                      desc: t('landing.step3Desc'),
                      icon: Share2
                    }
                  ].map((item, i) => (
                    <div key={i} className="relative flex gap-8 group">
                      {/* Step Circle */}
                      <div className={cn(
                        "relative z-10 w-12 h-12 rounded-full",
                        "bg-gradient-to-br from-violet-600 to-fuchsia-500",
                        "flex items-center justify-center text-white font-bold",
                        "shadow-lg shadow-violet-500/30 shrink-0",
                        "group-hover:scale-110 transition-transform"
                      )}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      {/* Content */}
                      <div className="pt-2">
                        <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">{t('landing.step')} {item.step}</span>
                        <h3 className="text-xl font-bold mt-1 mb-2">{item.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden bg-slate-50">
        {/* Dot Pattern Background */}
        <div className={cn(
          "absolute inset-0",
          "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]",
          "[background-size:20px_20px]",
          "[mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_40%,transparent_100%)]"
        )} />

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8">
            {t('landing.ctaTitle')}{' '}
            <span className={cn(
              "text-transparent bg-clip-text bg-gradient-to-r",
              "from-violet-600 to-fuchsia-500"
            )}>
              {t('landing.ctaHighlight')}
            </span>
          </h2>

          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
            {t('landing.ctaDesc')}
          </p>

          <Link href="/auth?tab=signup">
            <Button
              size="lg"
              className={cn(
                "h-16 px-12 text-lg rounded-full",
                "bg-gradient-to-r from-violet-600 to-fuchsia-500",
                "hover:from-violet-700 hover:to-fuchsia-600",
                "shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50",
                "transition-all duration-300 hover:scale-105",
                "hover:-translate-y-1 font-bold"
              )}
            >
              {t('landing.ctaButton')}
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
