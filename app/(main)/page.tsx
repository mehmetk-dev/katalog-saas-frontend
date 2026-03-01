"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { useTranslation } from "@/lib/contexts/i18n-provider"

import { HeroSection } from "./_components/hero-section"
import { SocialProofSection } from "./_components/social-proof-section"
import { FeaturesSection } from "./_components/features-section"
import { MobileSection } from "./_components/mobile-section"
import { HowItWorksSection } from "./_components/how-it-works-section"
import { CtaSection } from "./_components/cta-section"

function getAuthErrorParams(url: URL) {
  const hashParams = new URLSearchParams(url.hash.substring(1))
  return {
    error: url.searchParams.get('error') || hashParams.get('error'),
    errorCode: url.searchParams.get('error_code') || hashParams.get('error_code'),
    errorDescription: url.searchParams.get('error_description') || hashParams.get('error_description'),
  }
}

export default function HomePage() {
  const { t, language } = useTranslation()
  const router = useRouter()

  // Update document title when language changes
  useEffect(() => {
    document.title = t('common.siteTitle')
  }, [language, t])

  // Auth Error Handling (Supabase redirects to home on expired links)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    const { error, errorCode, errorDescription } = getAuthErrorParams(url)

    if (error || errorCode || errorDescription) {
      const authUrl = new URL(`${window.location.origin}/auth`)
      if (error) authUrl.searchParams.set('error', error)
      if (errorCode) authUrl.searchParams.set('error_code', errorCode)
      if (errorDescription) authUrl.searchParams.set('error_description', errorDescription)

      router.replace(authUrl.pathname + authUrl.search)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <PublicHeader />
      <HeroSection t={t} />
      <SocialProofSection t={t} />
      <FeaturesSection t={t} />
      <MobileSection t={t} />
      <HowItWorksSection t={t} />
      <CtaSection t={t} />
      <PublicFooter />
    </div>
  )
}
