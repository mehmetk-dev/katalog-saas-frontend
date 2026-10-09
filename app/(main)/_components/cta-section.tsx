import React from "react"

import { CtaBanner, SignupButton } from "@/components/marketing"
import type { TranslationFn } from "./types"

export const CtaSection = React.memo(function CtaSection({ t }: { t: TranslationFn }) {
    return (
        <CtaBanner
            title={t("landing.ctaTitle")}
            description={t("landing.ctaDesc")}
            action={<SignupButton>{t("landing.ctaButton")}</SignupButton>}
            note={t("landing.heroNote")}
        />
    )
})
