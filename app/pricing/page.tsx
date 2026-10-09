"use client"

import { useState } from "react"

import { BillingCycleToggle, PlanCards } from "@/components/billing/plan-cards"
import { PublicFooter } from "@/components/layout/public-footer"
import { PublicHeader } from "@/components/layout/public-header"
import { MarketingPage, PageHero, Section, SectionHeader } from "@/components/marketing"
import { useTranslation } from "@/lib/contexts/i18n-provider"

const FAQ_KEYS = [1, 2, 3] as const

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(true)
    const { t } = useTranslation()

    return (
        <MarketingPage header={<PublicHeader />} footer={<PublicFooter />}>
            <PageHero
                eyebrow={t("pricingPage.title")}
                title={t("pricingPage.subtitleTitle")}
                description={t("pricingPage.subtitle")}
            >
                <div className="mt-8">
                    <BillingCycleToggle isYearly={isYearly} onChange={setIsYearly} />
                </div>
            </PageHero>

            <Section className="pt-0 sm:pt-0">
                <PlanCards isYearly={isYearly} />
            </Section>

            <Section tone="muted">
                <SectionHeader title={t("pricingPage.faqTitle")} />
                <dl className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
                    {FAQ_KEYS.map((n) => (
                        <div key={n} className="rounded-xl border border-border bg-card p-6">
                            <dt className="font-semibold text-card-foreground">{t(`pricingPage.faq${n}Q`)}</dt>
                            <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`pricingPage.faq${n}A`)}</dd>
                        </div>
                    ))}
                </dl>
            </Section>
        </MarketingPage>
    )
}
