"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Check, BookOpen, ArrowRight, Sparkles, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Starter",
    description: "Yeni başlayanlar için",
    price: { monthly: 0, yearly: 0 },
    features: ["1 Katalog Dışa Aktarma", "50 Ürün Limiti", "3 Temel Şablon", "Filigranlı PDF", "E-posta Desteği"],
    cta: "Ücretsiz Başla",
    ctaVariant: "outline" as const,
    href: "/auth",
  },
  {
    name: "Growth",
    description: "Büyüyen işletmeler için",
    price: { monthly: 29, yearly: 290 },
    popular: true,
    features: [
      "Sınırsız Dışa Aktarma",
      "Sınırsız Ürün",
      "Tüm Şablonlar",
      "Filigransız",
      "Özel Markalama",
      "Link ile Paylaşım",
      "Öncelikli Destek",
    ],
    cta: "İletişime Geç",
    ctaVariant: "default" as const,
    href: "/contact",
  },
  {
    name: "Business",
    description: "Büyük ekipler ve kurumlar için",
    price: { monthly: 79, yearly: 790 },
    features: [
      "Growth'daki her şey",
      "Özel Domain",
      "Gelişmiş Analitik",
      "Takım İşbirliği",
      "API Erişimi",
      "SSO & SAML",
      "Özel Hesap Yöneticisi",
    ],
    cta: "Satışla Görüş",
    ctaVariant: "outline" as const,
    href: "/contact",
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
  const [isYearly, setIsYearly] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">CatalogPro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth">Giriş Yap</Link>
            </Button>
            <Button asChild>
              <Link href="/auth">Başla</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <Badge variant="secondary" className="mb-4">
            Fiyatlandırma
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Basit, şeffaf fiyatlandırma</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            İşletmeniz için mükemmel planı seçin. Ücretsiz başlayın, hazır olduğunuzda yükseltin.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <Label className={cn("text-base", !isYearly && "font-semibold")}>Aylık</Label>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <Label className={cn("text-base", isYearly && "font-semibold")}>
              Yıllık
              <Badge variant="secondary" className="ml-2">
                %17 Tasarruf
              </Badge>
            </Label>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border bg-card p-8 flex flex-col",
                  plan.popular && "border-primary shadow-lg shadow-primary/10 scale-105",
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4">
                    <Sparkles className="w-3 h-3 mr-1" />
                    En Popüler
                  </Badge>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold">${isYearly ? plan.price.yearly : plan.price.monthly}</span>
                  {plan.price.monthly > 0 && <span className="text-muted-foreground">/{isYearly ? "yıl" : "ay"}</span>}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button variant={plan.ctaVariant} className="w-full" asChild>
                  <Link href={plan.href}>
                    {plan.href === "/contact" && <MessageCircle className="w-4 h-4 mr-2" />}
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-muted-foreground">Sorularınız mı var? Cevaplarımız burada.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {faqs.map((faq) => (
              <div key={faq.question} className="space-y-2">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="text-muted-foreground text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Başlamaya hazır mısınız?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            CatalogPro ile güzel ürün katalogları oluşturan binlerce işletmeye katılın.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth">
                Ücretsiz Dene
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">
                <MessageCircle className="w-4 h-4 mr-2" />
                İletişime Geç
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} CatalogPro. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Gizlilik
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Şartlar
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                İletişim
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
