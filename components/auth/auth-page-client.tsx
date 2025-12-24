"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { BookOpen, Loader2 } from "lucide-react"

import { AuthForm } from "@/components/auth/auth-form"
import { OnboardingModal } from "@/components/auth/onboarding-modal"
import { useTranslation } from "@/lib/i18n-provider"

function AuthContent({ onSignUpComplete }: { onSignUpComplete: () => void }) {
    return <AuthForm onSignUpComplete={onSignUpComplete} />
}

function AuthLoading() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    )
}

export function AuthPageClient() {
    const [showOnboarding, setShowOnboarding] = useState(false)
    const { t } = useTranslation()

    const handleSignUpComplete = () => {
        setShowOnboarding(true)
    }

    return (
        <div className="min-h-screen flex">
            {/* Left side - Hero Image & Branding (Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/hero-dashboard.webp"
                        alt="CatalogPro Dashboard Önizleme"
                        className="w-full h-full object-cover opacity-80"
                    />
                </div>
                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full">
                    <div>
                        <Link href="/" className="flex items-center gap-3 mb-2 w-fit hover:opacity-90 transition-opacity">
                            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">CatalogPro</span>
                        </Link>
                    </div>
                    <div className="space-y-6">
                        <blockquote className="space-y-2">
                            <p className="text-lg font-medium leading-relaxed">
                                {t('auth.testimonialQuote')}
                            </p>
                            <footer className="text-sm text-white/80">
                                <cite className="not-italic">{t('auth.testimonialAuthor')}</cite>
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* Right side - Auth Form */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                {/* Mobile Premium Background */}
                <div className="absolute inset-0 lg:hidden">
                    {/* Gradient Base */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/30 dark:via-background dark:to-fuchsia-950/20" />

                    {/* Decorative Blur Circles */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-fuchsia-400/15 rounded-full blur-3xl" />
                    <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-purple-300/10 rounded-full blur-2xl" />

                    {/* Subtle Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.15]" />
                </div>

                {/* Desktop Background */}
                <div className="hidden lg:block absolute inset-0 bg-background" />

                {/* Content Container */}
                <div className="relative z-10 w-full max-w-[380px] mx-auto p-5 sm:p-6 md:p-8">
                    {/* Mobile Card Container */}
                    <div className="lg:hidden bg-white/70 dark:bg-background/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-violet-500/5 border border-white/50 dark:border-white/10 p-6 sm:p-8">
                        {/* Mobile Logo */}
                        <div className="flex flex-col items-center mb-6">
                            <Link href="/" className="flex items-center gap-2.5 mb-2">
                                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg shadow-violet-500/25">
                                    <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                                    CatalogPro
                                </span>
                            </Link>
                            <p className="text-xs text-muted-foreground">Profesyonel Katalog Oluşturucu</p>
                        </div>

                        <Suspense fallback={<AuthLoading />}>
                            <AuthContent onSignUpComplete={handleSignUpComplete} />
                        </Suspense>
                    </div>

                    {/* Desktop Content (no card) */}
                    <div className="hidden lg:block space-y-5">
                        <Suspense fallback={<AuthLoading />}>
                            <AuthContent onSignUpComplete={handleSignUpComplete} />
                        </Suspense>
                    </div>
                </div>
            </div>

            <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
        </div>
    )
}

