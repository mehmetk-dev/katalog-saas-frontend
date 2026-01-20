"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Zap, Star, Crown, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-provider"

interface Plan {
  name: string
  icon: LucideIcon
  description: string
  price: { monthly: number; yearly: number }
  color: string
  iconColor: string
  features: string[]
  cta: string
  href: string
  popular?: boolean
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true)
  const { t } = useTranslation()

  const plans: Plan[] = [
    {
      name: t('pricingPage.free'),
      icon: Star,
      description: t('pricingPage.freeDesc'),
      price: { monthly: 0, yearly: 0 },
      color: "bg-slate-100",
      iconColor: "text-slate-600",
      features: [
        t('plans.features.catalogsCount', { count: 1 }),
        t('plans.features.productLimit', { count: 50 }),
        t('upgradeModal.features.pdfLimit', { count: 1 }),
        t('upgradeModal.features.standardPdf'),
        t('pricingPage.watermarked')
      ],
      cta: t('pricingPage.ctaFree'),
      href: "/auth",
      popular: false,
    },
    {
      name: t('pricingPage.plus'),
      icon: Zap,
      description: t('pricingPage.plusDesc'),
      price: { monthly: 500, yearly: 5000 },
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      features: [
        t('plans.features.catalogsCount', { count: 10 }),
        t('plans.features.productLimit', { count: 1000 }),
        t('upgradeModal.features.pdfLimit', { count: 50 }),
        t('upgradeModal.features.standardPdf'),
        t('pricingPage.noWatermark')
      ],
      cta: t('pricingPage.ctaPlus'),
      href: "/auth?plan=plus",
      popular: false,
    },
    {
      name: t('pricingPage.pro'),
      icon: Crown,
      description: t('pricingPage.proDesc'),
      price: { monthly: 1000, yearly: 10000 },
      popular: true,
      color: "bg-violet-100",
      iconColor: "text-violet-600",
      features: [
        t('plans.unlimitedCatalogs'),
        t('plans.features.unlimitedProducts'),
        t('plans.unlimitedDownloads'),
        t('upgradeModal.features.highResPdf'),
        t('plans.allTemplates')
      ],
      cta: t('pricingPage.ctaPro'),
      href: "/auth?plan=pro",
    },
  ]

  const faqs = [
    {
      question: t('pricingPage.faq1Q'),
      answer: t('pricingPage.faq1A'),
    },
    {
      question: t('pricingPage.faq2Q'),
      answer: t('pricingPage.faq2A'),
    },
    {
      question: t('pricingPage.faq3Q'),
      answer: t('pricingPage.faq3A'),
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">{t('pricingPage.title')}</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-8">
            {t('pricingPage.subtitle')}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <Label className={cn("text-base", !isYearly && "font-semibold text-slate-900")}>{t('pricingPage.monthly')}</Label>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <Label className={cn("text-base", isYearly && "font-semibold text-slate-900")}>
              {t('pricingPage.yearly')}
              <Badge className="ml-2 bg-emerald-500 text-white hover:bg-emerald-600 border-0">
                {t('pricingPage.freeMonths')}
              </Badge>
            </Label>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon
              const price = isYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly

              return (
                <div
                  key={plan.name}
                  className={cn(
                    "relative bg-white rounded-2xl border-2 p-6 flex flex-col transition-all",
                    plan.popular
                      ? "border-violet-500 shadow-xl scale-105 z-10"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-lg",
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-violet-600 hover:bg-violet-700 border-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t('pricingPage.mostPopular')}
                    </Badge>
                  )}

                  <div className="mb-4 text-center">
                    <div className={cn(
                      "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center",
                      plan.color
                    )}>
                      <Icon className={cn("w-6 h-6", plan.iconColor)} />
                    </div>
                    <h3 className="text-xl font-bold mb-1 text-slate-900">{plan.name}</h3>
                    <p className="text-sm text-slate-500">{plan.description}</p>
                  </div>

                  <div className="mb-6 text-center border-y border-dashed border-slate-200 py-4">
                    {price === 0 ? (
                      <span className="text-3xl font-bold text-slate-900">{t('pricingPage.free')}</span>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-slate-900">₺{price}</span>
                        <span className="text-slate-500 text-sm">{t('pricingPage.month')}</span>
                        {isYearly && (
                          <p className="text-xs text-slate-400 mt-1">{t('pricingPage.year')} ₺{plan.price.yearly}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center justify-center gap-2 text-sm text-center">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      plan.popular && "bg-violet-600 hover:bg-violet-700"
                    )}
                    asChild
                  >
                    <Link href={plan.href}>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('pricingPage.faqTitle')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {faqs.map((faq) => (
              <div key={faq.question} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-slate-500 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
