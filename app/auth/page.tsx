"use client"

import { useState, Suspense } from "react"
import { AuthForm } from "@/components/auth/auth-form"
import { OnboardingModal } from "@/components/auth/onboarding-modal"
import { BookOpen, Sparkles, Zap, Shield, Loader2 } from "lucide-react"

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

export default function AuthPage() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleSignUpComplete = () => {
    setShowOnboarding(true)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.45_0.25_280)_0%,oklch(0.55_0.25_300)_50%,oklch(0.5_0.22_260)_100%)]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary-foreground/20 blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-xl font-semibold">CatalogPro</span>
            </div>
          </div>

          <div className="space-y-8">
            <h1 className="text-4xl font-bold leading-tight text-balance">
              Create stunning product catalogs in minutes
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              Join thousands of businesses who use CatalogPro to showcase their products beautifully.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-foreground/10 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span>Beautiful templates for every industry</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-foreground/10 rounded-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <span>Export to PDF or share via link</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-foreground/10 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <span>Enterprise-grade security</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-primary-foreground/60">Trusted by 10,000+ businesses worldwide</div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-2 bg-primary rounded-lg">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">CatalogPro</span>
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
