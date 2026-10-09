import React from "react"

import { Section, SectionHeader, StepCard } from "@/components/marketing"
import type { TranslationFn } from "./types"

const STEPS = [
    { title: "landing.step1Title", desc: "landing.step1Desc" },
    { title: "landing.step2Title", desc: "landing.step2Desc" },
    { title: "landing.step3Title", desc: "landing.step3Desc" },
] as const

export const HowItWorksSection = React.memo(function HowItWorksSection({ t }: { t: TranslationFn }) {
    return (
        <Section id="nasil-calisir">
            <SectionHeader eyebrow={t("landing.howItWorksBadge")} title={t("landing.howItWorksTitle")} />
            <div className="grid gap-4 md:grid-cols-3">
                {STEPS.map((step, index) => (
                    <StepCard
                        key={step.title}
                        step={index + 1}
                        label={`${t("landing.step")} ${index + 1}`}
                        title={t(step.title)}
                        description={t(step.desc)}
                    />
                ))}
            </div>
        </Section>
    )
})
