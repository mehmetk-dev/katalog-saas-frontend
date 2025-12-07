"use client"

import { useState } from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Check, Sparkles, X, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Başlangıç için",
    features: [
      { label: "1 Katalog Dışa Aktarma", included: true },
      { label: "50 Ürün", included: true },
      { label: "Filigranlı Dışa Aktarma", included: true },
      { label: "Temel Şablonlar", included: true },
      { label: "Özel Markalama", included: false },
      { label: "Öncelikli Destek", included: false },
    ],
    current: true,
  },
  {
    name: "Pro",
    price: { monthly: 29, yearly: 290 },
    description: "Büyüyen işletmeler için",
    popular: true,
    features: [
      { label: "Sınırsız Dışa Aktarma", included: true },
      { label: "Sınırsız Ürün", included: true },
      { label: "Filigransız", included: true },
      { label: "Tüm Şablonlar", included: true },
      { label: "Özel Markalama", included: true },
      { label: "Öncelikli Destek", included: true },
    ],
  },
]

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">Pro'ya Yükselt</DialogTitle>
          <DialogDescription>
            Ücretsiz dışa aktarma hakkınızı kullandınız. Kataloglarınızı indirmeye ve paylaşmaya devam etmek için
            yükseltin.
          </DialogDescription>
        </DialogHeader>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 py-4">
          <Label className={cn(!isYearly && "font-semibold")}>Aylık</Label>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <Label className={cn(isYearly && "font-semibold")}>
            Yıllık
            <Badge variant="secondary" className="ml-2">
              %17 Tasarruf
            </Badge>
          </Label>
        </div>

        {/* Plans Comparison */}
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn("relative rounded-lg border p-6", plan.popular && "border-primary bg-primary/5")}
            >
              {plan.popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  En Popüler
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${isYearly ? plan.price.yearly : plan.price.monthly}</span>
                  {plan.price.monthly > 0 && <span className="text-muted-foreground">/{isYearly ? "yıl" : "ay"}</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-center gap-2 text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={cn(!feature.included && "text-muted-foreground")}>{feature.label}</span>
                  </li>
                ))}
              </ul>

              {plan.current ? (
                <Button className="w-full bg-transparent" variant="outline" disabled>
                  Mevcut Plan
                </Button>
              ) : (
                <Button className="w-full" asChild>
                  <Link href="/contact">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    İletişime Geç
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
