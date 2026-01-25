"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail, CheckCircle2, BookOpen, AlertCircle } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-provider"

const getSiteUrl = () => {
  if (typeof window !== "undefined") return window.location.origin
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showGoogleWarning, setShowGoogleWarning] = useState(false)
  const { t } = useTranslation()

  const checkProvider = async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/check-provider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    const providerInfo = await checkProvider(email)

    if (providerInfo.isOAuth && providerInfo.provider === "google") {
      setShowGoogleWarning(true)
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const SITE_URL = getSiteUrl()
      const redirectUrl = `${SITE_URL}/auth/confirm-recovery`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error
      setSuccess(true)
    } catch (err) {
      console.error("[ForgotPassword] Error:", err)
      setError(err instanceof Error ? err.message : t("auth.errorGeneric"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueAnyway = async () => {
    setIsLoading(true)
    setShowGoogleWarning(false)
    const supabase = createClient()
    try {
      const SITE_URL = getSiteUrl()
      const redirectUrl = `${SITE_URL}/auth/confirm-recovery`
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.errorGeneric"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    const SITE_URL = getSiteUrl()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${SITE_URL}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-violet-100 via-violet-50/50 to-white relative overflow-hidden font-sans">
      {/* Background Decorations (Matching Auth Page) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute -top-1 left-0 w-full h-56"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d946ef" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            fill="url(#waveGradient)"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
        <div className="absolute top-20 right-6 w-24 h-24 rounded-full border-[3px] border-violet-300/60" />
        <div className="absolute -bottom-32 -left-16 w-72 h-72 bg-gradient-to-tr from-violet-500/40 via-purple-400/30 to-fuchsia-400/20 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/auth" className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700 transition-colors">
          <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-violet-600 group-hover:bg-violet-50 transition-all bg-white/80 backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </div>
          <span>{t("auth.backToLogin") || "Geri Dön"}</span>
        </Link>
      </div>

      <div className="w-full max-w-[420px] p-6 relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl mx-auto mb-6 shadow-xl shadow-violet-500/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-3">
            {success ? t("auth.emailSentTitle") || "Kontrol Edin" :
              showGoogleWarning ? "Google Hesabı" : t("auth.forgotPasswordTitle") || "Şifremi Unuttum"}
          </h1>
          <p className="text-slate-500 text-[15px] leading-relaxed">
            {success ? t("auth.emailSentText", { email }) || "Şifre sıfırlama linki gönderildi." :
              showGoogleWarning ? "Bu hesap Google ile kayıtlıdır." : t("auth.forgotPasswordSubtitle") || "Size bir şifre yenileme bağlantısı göndereceğiz."}
          </p>
        </div>

        {success ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-full h-12 bg-green-50 text-green-700 rounded-xl flex items-center justify-center gap-2 px-4 text-sm font-medium border border-green-100">
              <CheckCircle2 className="w-5 h-5" />
              <span>E-posta başarıyla gönderildi</span>
            </div>
            <Link href="/auth" className="block w-full">
              <button className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 transition-all">
                {t("auth.backToLogin") || "Giriş Yap"}
              </button>
            </Link>
          </div>
        ) : showGoogleWarning ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <button
              onClick={handleGoogleSignIn}
              className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 hover:border-slate-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google ile Giriş Yap
            </button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#FDFDFD] px-4 text-xs font-medium text-slate-400 uppercase tracking-widest">Veya</span>
              </div>
            </div>
            <button
              onClick={handleContinueAnyway}
              disabled={isLoading}
              className="w-full h-12 bg-transparent border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Yine de şifre sıfırla"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-900 ml-1">{t("auth.email") || "E-posta"}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[15px] outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all placeholder:text-slate-300"
                placeholder={t("auth.placeholderEmail") || "email@adresiniz.com"}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.sendResetLink") || "Sıfırlama Bağlantısı Gönder"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-slate-100 pt-8">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
            Powered by FogCatalog
          </p>
        </div>
      </div>
    </div>
  )
}
