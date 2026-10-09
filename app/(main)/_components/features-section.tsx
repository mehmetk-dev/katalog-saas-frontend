import React from "react"
import { BarChart3, FileDown, FileSpreadsheet, LayoutTemplate, MousePointerClick, QrCode } from "lucide-react"

import { FeatureCard, Section, SectionHeader } from "@/components/marketing"
import type { TranslationFn } from "./types"

const FEATURES = [
    { icon: MousePointerClick, title: "landing.dragDropTitle", desc: "landing.dragDropDesc" },
    { icon: FileSpreadsheet, title: "landing.excelTitle", desc: "landing.excelDesc" },
    { icon: LayoutTemplate, title: "landing.templatesTitle", desc: "landing.templatesDesc" },
    { icon: QrCode, title: "landing.qrTitle", desc: "landing.qrDesc" },
    { icon: FileDown, title: "landing.pdfTitle", desc: "landing.pdfDesc" },
    { icon: BarChart3, title: "landing.analyticsTitle", desc: "landing.analyticsDesc" },
] as const

export const FeaturesSection = React.memo(function FeaturesSection({ t }: { t: TranslationFn }) {
    return (
        <Section id="ozellikler" tone="muted">
            <SectionHeader
                eyebrow={t("landing.featuresBadge")}
                title={t("landing.featuresTitle")}
                description={t("landing.featuresSubtitle")}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((feature) => (
                    <FeatureCard
                        key={feature.title}
                        icon={feature.icon}
                        title={t(feature.title)}
                        description={t(feature.desc)}
                    />
                ))}
            </div>
        </Section>
    )
})
