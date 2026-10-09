"use client"

import { PublicFooter } from "@/components/layout/public-footer"
import { PublicHeader } from "@/components/layout/public-header"
import { CtaBanner, MarketingPage, PageHero, Section, SignupButton, StepCard } from "@/components/marketing"
import { useTranslation } from "@/lib/contexts/i18n-provider"

const STEPS = [1, 2, 3] as const

export default function HowItWorksPage() {
    const { t } = useTranslation()

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
                        <StepCard
                            key={step}
                            step={step}
                            label={t(`howItWorksPage.step${step}Badge`)}
                            title={t(`howItWorksPage.step${step}Title`)}
                            description={t(`howItWorksPage.step${step}Desc`)}
                        />
                    ))}
                </div>
            </Section>

            <CtaBanner
                title={t("howItWorksPage.ctaTitle")}
                description={t("howItWorksPage.ctaDesc")}
                action={<SignupButton>{t("howItWorksPage.ctaButton")}</SignupButton>}
                note={t("landing.heroNote")}
            />
        </MarketingPage>
    )
}
