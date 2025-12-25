"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Lock, CheckCircle2, BookOpen, ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-provider"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth/forgot-password")
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"))
      return
    }

    if (password.length < 6) {
      setError(t("auth.passwordLength"))
      return
    }

    setIsLoading(true)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.passwordUpdateError"))
    } finally {
      setIsLoading(false)
    }
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
                {t("auth.passwordUpdatedTitle")}
              </h1>
              <p className="text-slate-500">
                {t("auth.passwordUpdatedDesc")}
              </p>
            </div>
          ) : (
            // Form State
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-violet-500/10 border border-white/50 p-8">
              <div className="text-center mb-8">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {t("auth.resetPasswordTitle")}
                </h1>
                <p className="text-slate-500">
                  {t("auth.resetPasswordSubtitle")}
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
                    {t("auth.newPassword")}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[15px] outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all placeholder:text-slate-300 hover:border-slate-300 disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-slate-400 ml-1">{t("auth.passwordLength")}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-900 ml-1">
                    {t("auth.confirmPassword")}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[15px] outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all placeholder:text-slate-300 hover:border-slate-300 disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("auth.updatePassword")}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
