"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowRight, Check, Star, Sparkles, HelpCircle, Diamond, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { buildCheckoutHref, CHECKOUT_PLANS } from "@/lib/billing/plans"

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true)
  const { t } = useTranslation()

  // Plans Data
  const plans = useMemo(() => [
    {
      id: "free",
      name: t('pricingPage.free'), // "Starter"
      subtitle: "Dijital dünyaya adım atın.",
      icon: Star,
      price: { monthly: 0, yearly: 0 },
      theme: "light",
      features: [
        t('plans.features.catalogsCount', { count: 1 }),
        t('plans.features.productLimit', { count: 50 }),
        "Standart PDF İndirme",
        "Temel İstatistikler",
        "FogCatalog Filigranı"
      ],
      cta: "Ücretsiz Başla",
      href: "/auth",
    },
    {
      id: "plus",
      name: t('pricingPage.plus'), // "Plus"
      subtitle: "Büyüyen işletmeler için.",
      icon: Zap,
      price: {
        monthly: CHECKOUT_PLANS.plus.monthlyPrice,
        yearly: CHECKOUT_PLANS.plus.yearlyPrice,
      },
      theme: "light",
      features: [
        t('plans.features.catalogsCount', { count: 10 }),
        t('plans.features.productLimit', { count: 1000 }),
        "Logo & Marka Özelleştirme",
        "Filigran Yok",
        "Öncelikli QR Kodları",
        "Kategori Yönetimi"
      ],
      cta: "Plus'a Geç",
      href: "/auth?plan=plus",
    },
    {
      id: "pro",
      name: t('pricingPage.pro'), // "Pro Visionary"
      subtitle: "Sınırları kaldırın.",
      icon: Diamond,
      price: {
        monthly: CHECKOUT_PLANS.pro.monthlyPrice,
        yearly: CHECKOUT_PLANS.pro.yearlyPrice,
      },
      popular: true,
      theme: "dark", // Special Dark Theme
      features: [
        "Sınırsız Katalog",
        "Sınırsız Ürün",
        "Yüksek Çözünürlüklü (4K) PDF",
        "Gelişmiş SEO Ayarları",
        "Detaylı Analitik Paneli",
        "Tüm Premium Şablonlar",
        "7/24 Öncelikli Whatsapp Desteği"
      ],
      cta: "Sınırları Kaldır",
      href: "/auth?plan=pro",
    },
  ], [t])

  const faqs = useMemo(() => [
    {
      question: t('pricingPage.faq1Q'),
      answer: "Kesinlikle. 'Starter' paketimiz tamamen ücretsizdir ve kredi kartı gerektirmez. İstediğiniz kadar kullanabilirsiniz.",
    },
    {
      question: t('pricingPage.faq2Q'), // Cancel anytime?
      answer: "Evet, taahhüt yok. Memnun kalmazsanız panelinizden tek tıkla aboneliğinizi sonlandırabilirsiniz.",
    },
    {
      question: "Paketimi sonradan değiştirebilir miyim?",
      answer: "Tabii ki. İşletmeniz büyüdükçe dilediğiniz zaman paneliniz üzerinden bir üst pakete geçiş yapabilirsiniz.",
    },
  ], [t])

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-soft">
      <PublicHeader />

      <main className="pt-32 pb-24 md:pt-40 md:pb-32 px-4 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-accent/50 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-brand-soft/50 rounded-full blur-[150px]"></div>
          <div className="absolute inset-0 opacity-[0.02] bg-[url('/noise.svg')]"></div>
        </div>

        <div className="max-w-7xl mx-auto">

          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-20 md:mb-28">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="w-3 h-3 text-warning-soft-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Premium Plans</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-foreground mb-8 leading-[0.9] tracking-tight">
              Kataloğunuzu <br />
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-brand">Seçkinleştirin.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground font-light max-w-xl mx-auto leading-relaxed">
              İşletmenizin ihtiyacına uygun paketi seçin, ürünlerinizi profesyonel bir vitrine dönüştürün.
            </p>

            {/* Toggle */}
            <div className="mt-12 inline-flex p-1.5 bg-muted rounded-full border border-border relative">
              <div className={cn(
                "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-card rounded-full shadow-sm transition-all duration-300 ease-spring",
                isYearly ? "left-[calc(50%+3px)]" : "left-1.5"
              )}></div>

              <button
                onClick={() => setIsYearly(false)}
                className={cn("relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors", !isYearly ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                Aylık
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={cn("relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors flex items-center gap-2", isYearly ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                Yıllık
                <span className="text-[9px] bg-success-soft text-success-soft-foreground px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">-20%</span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-32">
            {plans.map((plan) => {
              const price = isYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly
              const isDark = plan.theme === "dark"

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col p-8 md:p-10 rounded-[2rem] transition-all duration-500 group",
                    isDark
                      ? "bg-[#0F172A] text-white shadow-2xl shadow-black/20 md:-translate-y-6 md:hover:-translate-y-8 border border-white/10"
                      : "bg-card text-foreground shadow-xl shadow-black/50 border border-border hover:shadow-2xl hover:border-border md:hover:-translate-y-2"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-gradient-to-r from-warning-soft to-warning text-warning-soft-foreground px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] shadow-lg shadow-warning/50 flex items-center gap-2">
                        <Star className="w-3 h-3 fill-warning-soft-foreground" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Top Section */}
                  <div className="mb-10">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-xl",
                      isDark ? "bg-background/10 text-white" : "bg-muted/50 text-foreground border border-border"
                    )}>
                      <plan.icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>

                    <h3 className="font-serif text-3xl md:text-4xl mb-2">{plan.name}</h3>
                    <p className={cn("text-sm font-medium", isDark ? "text-muted-foreground" : "text-muted-foreground")}>{plan.subtitle}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-10">
                    <div className="flex items-baseline gap-1">
                      {price === 0 ? (
                        <span className="text-5xl font-sans font-bold">Ücretsiz</span>
                      ) : (
                        <>
                          <span className={cn("text-sm font-bold -translate-y-6 mr-1", isDark ? "text-muted-foreground" : "text-muted-foreground")}>₺</span>
                          <span className="text-6xl font-sans font-bold tracking-tighter">{price}</span>
                          <span className={cn("text-sm font-bold ml-1", isDark ? "text-muted-foreground" : "text-muted-foreground")}>/ ay</span>
                        </>
                      )}
                    </div>
                    {isYearly && price > 0 && (
                      <p className={cn("text-xs font-bold uppercase tracking-widest mt-2", isDark ? "text-success" : "text-success")}>
                        ₺{plan.price.yearly} / yıl
                      </p>
                    )}
                    {price > 0 && (
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-2", isDark ? "text-muted-foreground" : "text-muted-foreground")}>
                        {t('checkout.vatIncluded')}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="flex-1 mb-10">
                    <div className={cn("h-px w-full mb-8", isDark ? "bg-background/10" : "bg-muted")}></div>
                    <ul className="space-y-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm group/li">
                          <Check className={cn(
                            "w-4 h-4 shrink-0 transition-transform group-hover/li:scale-110",
                            isDark ? "text-warning" : "text-primary"
                          )} />
                          <span className={cn(
                            "font-medium leading-relaxed",
                            isDark ? "text-muted-foreground/70" : "text-muted-foreground"
                          )}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <Button
                    asChild
                    className={cn(
                      "w-full h-14 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300",
                      isDark
                        ? "bg-card text-foreground hover:bg-accent hover:scale-[1.02]"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02]"
                    )}
                  >
                    <Link
                      href={
                        plan.id === "free"
                          ? plan.href
                          : buildCheckoutHref(plan.id === "plus" ? "plus" : "pro", isYearly ? "yearly" : "monthly")
                      }
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )
            })}
          </div>

          {/* FAQ Section Integrated */}
          <div className="max-w-4xl mx-auto border-t border-border pt-20">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">Merak Ettikleriniz</h2>
              <p className="text-muted-foreground font-light text-lg">Aklınıza takılan sorular için buradayız.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {faqs.map((faq, i) => (
                <div key={i} className="group">
                  <h3 className="flex items-start gap-3 font-bold text-lg text-foreground mb-3 group-hover:text-primary transition-colors">
                    <HelpCircle className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                    {faq.question}
                  </h3>
                  <p className="pl-8 text-muted-foreground leading-relaxed text-sm">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
