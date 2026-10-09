"use client"

import {
    BarChart3,
    FileDown,
    FileSpreadsheet,
    Palette,
    QrCode,
    Rocket,
    Share2,
    SlidersHorizontal,
    Tags,
} from "lucide-react"

import { PublicFooter } from "@/components/layout/public-footer"
import { PublicHeader } from "@/components/layout/public-header"
import {
    CtaBanner,
    FeatureCard,
    FeatureRow,
    MarketingPage,
    PageHero,
    SecondaryButton,
    Section,
    SectionHeader,
    SignupButton,
} from "@/components/marketing"
import { useTranslation } from "@/lib/contexts/i18n-provider"

const ROWS = [
    { icon: FileSpreadsheet, key: "import" },
    { icon: Share2, key: "share" },
    { icon: Rocket, key: "publish" },
] as const

const MORE = [
    { icon: QrCode, key: "qr" },
    { icon: FileDown, key: "pdf" },
    { icon: BarChart3, key: "analytics" },
    { icon: Tags, key: "categories" },
    { icon: SlidersHorizontal, key: "attributes" },
    { icon: Palette, key: "branding" },
] as const

export default function FeaturesPage() {
    const { t } = useTranslation()

    return (
        <MarketingPage header={<PublicHeader />} footer={<PublicFooter />}>
            <PageHero
                eyebrow={t("featuresPage.heroBadge")}
                title={t("featuresPage.heroTitle")}
                description={t("featuresPage.heroDesc")}
                actions={
                    <>
                        <SignupButton>{t("featuresPage.ctaButton")}</SignupButton>
                        <SecondaryButton href="/create-demo">{t("header.demo")}</SecondaryButton>
                    </>
                }
            />

            <Section className="pt-0 sm:pt-0">
                {ROWS.map((row) => (
                    <FeatureRow
                        key={row.key}
                        icon={row.icon}
                        title={t(`featuresPage.${row.key}Title`)}
                        description={t(`featuresPage.${row.key}Desc`)}
                        bullets={[1, 2, 3].map((n) => t(`featuresPage.${row.key}List${n}`))}
                    />
                ))}
            </Section>

            <Section tone="muted">
                <SectionHeader title={t("featuresPage.moreTitle")} description={t("featuresPage.moreDesc")} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {MORE.map((item) => (
                        <FeatureCard
                            key={item.key}
                            icon={item.icon}
                            title={t(`featuresPage.${item.key}Title`)}
                            description={t(`featuresPage.${item.key}Desc`)}
                        />
                    ))}
                </div>
            </Section>

            <CtaBanner
                title={t("featuresPage.ctaTitle")}
                description={t("featuresPage.ctaDesc")}
                action={<SignupButton>{t("featuresPage.ctaButton")}</SignupButton>}
                note={t("featuresPage.ctaNote")}
            />
        </MarketingPage>
    )
}
