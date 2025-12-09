"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { AuthForm } from "@/components/auth/auth-form"
import { OnboardingModal } from "@/components/auth/onboarding-modal"
import { BookOpen, Loader2 } from "lucide-react"

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

    const handleSignUpComplete = () => {
        setShowOnboarding(true)
    }

    return (
        <div className="min-h-screen flex">
            {/* Left side - Hero Image & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/hero-dashboard.webp"
                        alt="Background"
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
                                "CatalogPro ile ürünlerimizi müşterilerimize sunmak hiç bu kadar kolay olmamıştı. Profesyonel şablonlar işimizi bir üst seviyeye taşıdı."
                            </p>
                            <footer className="text-sm text-white/80">
                                Ahmet Yılmaz, <cite className="not-italic">TechStore Kurucusu</cite>
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* Right side - Auth Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="w-full max-w-sm space-y-6">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-xl font-bold">CatalogPro</span>
                        </Link>
                    </div>

                    <Suspense fallback={<AuthLoading />}>
                        <AuthContent onSignUpComplete={handleSignUpComplete} />
                    </Suspense>
                </div>
            </div>

            <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
        </div>
    )
}
