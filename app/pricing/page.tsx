"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Check, BookOpen, ArrowRight, Sparkles, MessageCircle, Star, Zap, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Ücretsiz",
    icon: Star,
    description: "Yeni başlayanlar için",
    price: { monthly: 0, yearly: 0 },
    color: "from-slate-400 to-slate-500",
    features: [
      "1 Katalog",
      "50 Ürün Limiti",
      "1 PDF İhracatı",
      "Filigranlı"
    ],
    cta: "Ücretsiz Başla",
    ctaVariant: "outline" as const,
    href: "/auth",
  },
  {
    name: "Plus",
    icon: Zap,
    description: "Büyüyen işletmeler için",
    price: { monthly: 500, yearly: 5000 },
    color: "from-blue-500 to-cyan-500",
    features: [
      "10 Katalog",
      "1.000 Ürün",
      "50 PDF İhracatı",
      "Filigransız"
    ],
    cta: "Plus'a Geç",
    ctaVariant: "default" as const,
    href: "/auth?plan=plus",
  },
  {
    name: "Pro",
    icon: Crown,
    description: "Profesyoneller için",
    price: { monthly: 1000, yearly: 10000 },
    popular: true,
    color: "from-violet-600 to-indigo-600",
    features: [
      "Sınırsız Katalog",
      "Sınırsız Ürün",
      "Sınırsız PDF İhracatı",
      "Tüm Özellikler"
    ],
    cta: "Pro'ya Geç",
    ctaVariant: "default" as const,
    href: "/auth?plan=pro",
  },
]

const faqs = [
  {
    question: "Planımı sonra değiştirebilir miyim?",
    answer: "Evet! Planınızı istediğiniz zaman yükseltebilir veya düşürebilirsiniz. Değişiklikler anında geçerli olur.",
  },
  {
    question: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
    answer: "Tüm büyük kredi kartlarını, PayPal ve yıllık planlar için banka havalesi kabul ediyoruz.",
  },
  {
    question: "Ücretsiz deneme var mı?",
    answer: "Evet, tüm ücretli planlarda 14 günlük ücretsiz deneme var. Kredi kartı gerekmez.",
  },
  {
    question: "İstediğim zaman iptal edebilir miyim?",
    answer: "Kesinlikle. Aboneliğinizi herhangi bir zamanda gizli ücret olmadan iptal edebilirsiniz.",
  },
]

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CatalogPro</span>
          </Link>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth">Giriş Yap</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth">Başla</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 text-center">
        <div className="container mx-auto px-4">
          <Badge variant="secondary" className="mb-4">
            Fiyatlandırma
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Basit, şeffaf fiyatlandırma</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            İşletmeniz için mükemmel planı seçin. Ücretsiz başlayın.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <Label className={cn("text-base", !isYearly && "font-semibold")}>Aylık</Label>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <Label className={cn("text-base", isYearly && "font-semibold")}>
              Yıllık
              <Badge variant="secondary" className="ml-2 bg-green-500 text-white hover:bg-green-600 border-0">
                2 Ay Bedava
              </Badge>
            </Label>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon
              const price = isYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly

              return (
                <div
                  key={plan.name}
                  className={cn(
                    "relative rounded-2xl border-2 bg-card p-6 flex flex-col transition-all",
                    plan.popular
                      ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/10 shadow-xl scale-105 z-10"
                      : "border-border hover:border-primary/50 hover:shadow-lg",
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-violet-600 hover:bg-violet-700 border-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      En Popüler
                    </Badge>
                  )}

                  <div className="mb-4 text-center">
                    <div className={cn(
                      "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br text-white shadow-md",
                      plan.color
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mb-6 text-center border-y py-4 border-dashed">
                    {price === 0 ? (
                      <span className="text-3xl font-bold">Ücretsiz</span>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold">₺{price}</span>
                        <span className="text-muted-foreground text-sm">/ay</span>
                        {isYearly && (
                          <p className="text-xs text-muted-foreground mt-1">Yıllık ₺{plan.price.yearly}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center justify-center gap-2 text-sm text-center">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{feature}</span>
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
      <section className="py-20 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Sıkça Sorulan Sorular</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {faqs.map((faq) => (
              <div key={faq.question} className="space-y-2 bg-background p-6 rounded-xl border">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="text-muted-foreground text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CatalogPro. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  )
}
