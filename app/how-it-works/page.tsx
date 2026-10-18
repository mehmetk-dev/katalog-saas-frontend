"use client"

import type { ReactNode } from "react"
import { Check } from "lucide-react"

import { PublicFooter } from "@/components/layout/public-footer"
import { PublicHeader } from "@/components/layout/public-header"
import { CtaBanner, MarketingPage, PageHero, Section, SignupButton, StepCard } from "@/components/marketing"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
import { ProductsVisual, ShareVisual, TemplatesVisual } from "./_components/step-visuals"

const STEPS = [1, 2, 3] as const

export default function HowItWorksPage() {
    const { t } = useTranslation()
    const tr = (key: string, params?: Record<string, unknown>) => t(key, params) as string
    const points = (step: number) => {
        const value = t<string[] | string>(`howItWorksPage.step${step}Points`)
        return Array.isArray(value) ? value : []
    }

    const visuals: Record<(typeof STEPS)[number], ReactNode> = {
        1: <ProductsVisual t={tr} />,
        2: <TemplatesVisual />,
        3: <ShareVisual t={tr} />,
    }

    return (
        <MarketingPage header={<PublicHeader />} footer={<PublicFooter />}>
            <PageHero
                eyebrow={t("landing.howItWorksBadge")}
                title={t("howItWorksPage.title")}
                description={t("howItWorksPage.subtitle")}
            />

            <Section className="pt-0 sm:pt-0">
                <div className="grid gap-4 md:grid-cols-3">
                    {STEPS.map((step) => (
                        <a key={step} href={`#adim-${step}`} className="rounded-xl transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <StepCard
                                step={step}
                                label={t(`howItWorksPage.step${step}Badge`)}
                                title={t(`howItWorksPage.step${step}Title`)}
                                description={t(`howItWorksPage.step${step}Desc`)}
                            />
                        </a>
                    ))}
                </div>
            </Section>

            {/* Her adımın ayrıntısı: solda/sağda dönüşümlü metin + uygulamadaki karşılığı */}
            {STEPS.map((step) => (
                <Section key={step} id={`adim-${step}`} tone={step % 2 === 1 ? "muted" : "default"} className="scroll-mt-20">
                    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                        <div className={cn("space-y-5", step % 2 === 0 && "md:order-2")}>
                            <div className="flex items-center gap-3">
                                <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                                    {step}
                                </span>
                                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {t(`howItWorksPage.step${step}Badge`)}
                                </span>
                            </div>
                            <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                                {t(`howItWorksPage.step${step}Title`)}
                            </h2>
                            <p className="text-pretty leading-relaxed text-muted-foreground">{t(`howItWorksPage.step${step}Long`)}</p>
                            <ul className="space-y-2.5">
                                {points(step).map((point) => (
                                    <li key={point} className="flex items-start gap-3 text-sm text-foreground">
                                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={cn("min-w-0", step === 2 && "pb-6")}>{visuals[step]}</div>
                    </div>
                </Section>
            ))}

            <CtaBanner
                title={t("howItWorksPage.ctaTitle")}
                description={t("howItWorksPage.ctaDesc")}
                action={<SignupButton>{t("howItWorksPage.ctaButton")}</SignupButton>}
                note={t("landing.heroNote")}
            />
        </MarketingPage>
    )
}
