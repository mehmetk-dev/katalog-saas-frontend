"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
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

export default function HomePage() {
  const { t, language } = useTranslation()

  // Update document title when language changes
  useEffect(() => {
    document.title = t('common.siteTitle')
  }, [language, t])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-32 overflow-hidden">
        {/* Background Gradient Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-400/30 via-fuchsia-400/20 to-pink-400/30 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100/80 text-violet-700 border border-violet-200/50 mb-8 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wide">{t('landing.badge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
              {t('landing.heroTitle')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">
                {t('landing.heroTitleHighlight')}
              </span>{' '}
              {t('landing.heroTitleEnd')}
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('landing.heroSubtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth?tab=signup">
                <Button
                  size="lg"
                  className="h-14 px-8 text-base rounded-full bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
                >
                  {t('landing.startNow')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base rounded-full border-slate-200 hover:bg-white hover:border-violet-200 hover:text-violet-600 transition-all duration-300"
                >
                  {t('landing.seeExamples')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual with Floating Cards */}
          <div className="mt-20 relative max-w-5xl mx-auto">
            {/* Glow Effect Behind Laptop */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-violet-500/40 via-fuchsia-500/30 to-pink-500/40 rounded-full blur-[100px] animate-pulse" />
            </div>

            {/* Laptop Mockup Image */}
            <div className="relative">
              <Image
                src="/hero-catalog.png"
                alt="CatalogPro dijital katalog oluşturucu arayüzü - Ürün yönetimi ve katalog tasarım ekranı"
                className="w-full"
                priority
                width={1200}
                height={675}
              />
            </div>

            {/* Floating Notification Card - Left */}
            <div className="absolute -left-8 top-1/4 p-4 bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-100 hidden lg:flex items-center gap-3 animate-float">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{t('landing.newView')}</p>
                <p className="font-bold text-slate-900">{t('landing.today')}</p>
              </div>
            </div>

            {/* Floating Notification Card - Right */}
            <div className="absolute -right-6 top-1/3 p-4 bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-100 hidden lg:flex items-center gap-3 animate-float animation-delay-1000">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{t('landing.catalogViewed')}</p>
                <p className="font-bold text-slate-900">{t('landing.summerCollection')}</p>
              </div>
            </div>

            {/* Floating Card - Bottom */}
            <div className="absolute -bottom-4 left-1/4 p-3 bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-100 hidden lg:flex items-center gap-2 animate-float animation-delay-2000">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{t('landing.qrScanned')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Trusted By */}
      <section className="py-12 border-y border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-slate-400 mb-8 uppercase tracking-wider">
            {t('landing.trustedBy')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {['Moda Butik', 'Tech Store', 'Home Decor', 'Auto Parts', 'Organic Market', 'Beauty Shop'].map((brand, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-600 font-bold text-lg tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section id="özellikler" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 hover:bg-violet-200 border-0">
              {t('landing.featuresBadge')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Large Card - Drag & Drop */}
            <div className="md:col-span-2 group relative p-8 rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/50 hover:border-violet-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-100/50 rounded-full blur-3xl -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 border border-violet-200/50 flex items-center justify-center mb-6">
                  <MousePointerClick className="w-7 h-7 text-violet-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t('landing.dragDropTitle')}</h3>
                <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-lg">
                  {t('landing.dragDropDesc')}
                </p>
                {/* Visual Mockup */}
                <div className="relative rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-slate-50 aspect-video">
                  <div className="absolute inset-0 p-4 grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-100 p-2 hover:shadow-md hover:scale-105 transition-all cursor-grab">
                        <div className="w-full aspect-square bg-slate-100 rounded mb-2" />
                        <div className="h-2 bg-slate-200 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-slate-200/50 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <QrCode className="w-40 h-40 text-blue-600" />
              </div>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200/50 flex items-center justify-center mb-6">
                  <QrCode className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t('landing.qrTitle')}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('landing.qrDesc')}
                </p>
                {/* Mini QR Visual */}
                <div className="mt-6 w-24 h-24 mx-auto bg-white rounded-xl shadow-lg p-2 border border-slate-100">
                  <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PHBhdGggZmlsbD0iIzFmMjkzNyIgZD0iTTEgMWg3djdIMXptMiAyaDN2M0gzem0tMiA4aDd2N0gxem0yIDJoM3YzSDN6bTgtMTJoN3Y3aC03em0yIDJoM3YzaC0zem0tMiA4aDJ2MmgtMnptMiAwaDJ2MmgtMnptMC0yaDJ2MmgtMnptMiAyaDJ2MmgtMnptMC0yaDJ2MmgtMnptMiAwaDJ2MmgtMnptMCAyaDJ2MmgtMnoiLz48L3N2Zz4=')] bg-contain" />
                </div>
              </div>
            </div>

            {/* Analytics Card */}
            <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-white border border-slate-200/50 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200/50 flex items-center justify-center mb-6">
                  <BarChart3 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t('landing.analyticsTitle')}</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {t('landing.analyticsDesc')}
                </p>
                {/* Sparkline Chart */}
                <div className="h-20 flex items-end gap-1">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t transition-all duration-300 hover:from-emerald-600 hover:to-emerald-500"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Templates Card */}
            <div className="md:col-span-2 group relative p-8 rounded-3xl bg-gradient-to-br from-fuchsia-50 to-white border border-slate-200/50 hover:border-fuchsia-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
              <div className="relative flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-fuchsia-100 border border-fuchsia-200/50 flex items-center justify-center mb-6">
                    <Layers className="w-7 h-7 text-fuchsia-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{t('landing.templatesTitle')}</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    {t('landing.templatesDesc')}
                  </p>
                </div>
                {/* Template Preview */}
                <div className="flex gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-28 h-36 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden transform hover:scale-105 hover:-rotate-2 transition-all duration-300">
                      <div className="h-20 bg-gradient-to-br from-violet-100 to-fuchsia-100" />
                      <div className="p-2 space-y-1">
                        <div className="h-2 bg-slate-200 rounded w-full" />
                        <div className="h-2 bg-slate-100 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile / Dark Section */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
        {/* Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-slate-900 to-slate-900" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Phone Mockup */}
            <div className="w-full lg:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 rounded-full blur-[100px] scale-75" />
              <div className="relative mx-auto w-[280px]">
                {/* Phone Frame */}
                <div className="relative bg-slate-800 rounded-[3rem] p-3 shadow-2xl shadow-black/50 border border-slate-700">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-2xl" />
                  <div className="rounded-[2.2rem] overflow-hidden bg-white aspect-[9/19]">
                    <Image
                      src="/hero-dashboard.webp"
                      alt="CatalogPro mobil uyumlu katalog görünümü - Akıllı telefon üzerinde ürün kataloğu"
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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">{t('landing.mobileBadge')}</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                {t('landing.mobileTitle')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
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
                className="h-12 px-6 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-semibold shadow-xl shadow-white/10"
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
              <div className="relative rounded-2xl shadow-2xl shadow-violet-500/10 border border-slate-200 overflow-hidden bg-white">
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
                    <div className="col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 p-3 space-y-2">
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
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500" />

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
                      <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30 shrink-0 group-hover:scale-110 transition-transform">
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
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_40%,transparent_100%)]" />

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8">
            {t('landing.ctaTitle')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">
              {t('landing.ctaHighlight')}
            </span>
          </h2>

          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
            {t('landing.ctaDesc')}
          </p>

          <Link href="/auth?tab=signup">
            <Button
              size="lg"
              className="h-16 px-12 text-lg rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 font-bold"
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
