"use client"

import { useAuth, HeroPanel, AuthForm, RedirectOverlay } from "./auth-sections"
import { OnboardingModal } from "@/components/auth/onboarding-modal"
import { useTranslation } from "@/lib/contexts/i18n-provider"

export function AuthPageClient() {
    const { t } = useTranslation()
    const { state, handlers, showOnboarding, setShowOnboarding } = useAuth()

    if (state.isRedirecting) {
        return <RedirectOverlay t={t} />
    }

    return (
        <div className="min-h-screen w-full flex">
            <HeroPanel t={t} />
            <AuthForm t={t} state={state} handlers={handlers} />
            <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
        </div>
    )
}
