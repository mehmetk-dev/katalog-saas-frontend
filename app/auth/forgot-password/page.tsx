"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail, CheckCircle2, BookOpen, AlertCircle } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-provider"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://catalogpro.app"
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [showGoogleWarning, setShowGoogleWarning] = useState(false)
  const { t } = useTranslation()

  const checkProvider = async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/check-provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      return data
    } catch {
      return { isOAuth: false, provider: null }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setShowGoogleWarning(false)

    // Check if user is OAuth user
    console.log('Checking provider for:', email)
    const providerInfo = await checkProvider(email)
    console.log('Provider info:', providerInfo)

    if (providerInfo.isOAuth && providerInfo.provider === 'google') {
      setIsGoogleUser(true)
      setShowGoogleWarning(true)
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      console.log('Sending reset email to:', email)
      console.log('Redirect URL:', `${SITE_URL}/auth/reset-password`)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/auth/reset-password`,
      })

      console.log('Reset email result:', error ? error.message : 'Success')

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(err?.message || t("common.error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueAnyway = async () => {
    setIsLoading(true)
    setShowGoogleWarning(false)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/auth/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${SITE_URL}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-100 via-violet-50/50 to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Wave */}
        <svg
          className="absolute -top-1 left-0 w-full h-56"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#d946ef" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            fill="url(#waveGradient)"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>

        {/* Decorative Circles */}
        <div className="absolute top-24 right-12 w-32 h-32 rounded-full border-[3px] border-violet-200/40" />
        <div className="absolute top-36 right-20 w-12 h-12 rounded-full bg-gradient-to-br from-violet-400/30 to-fuchsia-400/20" />
        <div className="absolute bottom-32 left-12 w-20 h-20 rounded-full border-2 border-violet-200/30" />

        {/* Bottom Blobs */}
        <div className="absolute -bottom-32 -left-16 w-72 h-72 bg-gradient-to-tr from-violet-500/20 via-purple-400/15 to-fuchsia-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 right-0 w-56 h-56 bg-gradient-to-tl from-indigo-400/20 to-violet-300/15 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/30 transition-shadow">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">CatalogPro</span>
          </Link>

          <Link href="/auth">
            <Button variant="ghost" className="text-slate-600 hover:text-violet-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("auth.backToLogin")}
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center px-6 pt-12 pb-24">
        <div className="w-full max-w-md">
          {success ? (
            // Success State
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-violet-500/10 border border-white/50 p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {t("auth.emailSentTitle")}
              </h1>
              <p className="text-slate-500 mb-6">
                {t("auth.emailSentText", { email })}
              </p>
              <Link href="/auth">
                <Button className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl h-12">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("auth.backToLogin")}
                </Button>
              </Link>
            </div>
          ) : showGoogleWarning ? (
            // Google User Warning State
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-violet-500/10 border border-white/50 p-8">
              <div className="text-center mb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Google Hesabı Tespit Edildi
                </h1>
                <p className="text-slate-500">
                  Bu email adresi Google ile kayıtlı. Google ile giriş yapmanızı öneririz.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleGoogleSignIn}
                  className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google ile Giriş Yap
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white/80 px-3 text-slate-400">veya</span>
                  </div>
                </div>

                <Button
                  onClick={handleContinueAnyway}
                  variant="outline"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl border-slate-200"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Yine de Şifre Belirle
                </Button>

                <p className="text-xs text-center text-slate-400 mt-4">
                  Şifre belirlerseniz, hem Google hem şifre ile giriş yapabilirsiniz.
                </p>
              </div>
            </div>
          ) : (
            // Form State
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-violet-500/10 border border-white/50 p-8">
              <div className="text-center mb-8">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                  <Mail className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {t("auth.forgotPasswordTitle")}
                </h1>
                <p className="text-slate-500">
                  {t("auth.forgotPasswordSubtitle")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-900 ml-1">
                    {t("auth.email")}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[15px] outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all placeholder:text-slate-300 hover:border-slate-300 disabled:opacity-50"
                    placeholder={t("auth.placeholderEmail")}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("auth.sendResetLink")}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/auth"
                    className="text-sm text-slate-500 hover:text-violet-600 transition-colors"
                  >
                    ← {t("auth.backToLogin")}
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
