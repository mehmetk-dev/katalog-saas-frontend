"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Lock, CheckCircle2, ShieldCheck, BookOpen } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/i18n-provider"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      const supabase = createClient()
      let { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 800))
        const retry = await supabase.auth.getSession()
        session = retry.data.session
      }

      if (!mounted) return

      if (!session) {
        router.push("/auth/forgot-password")
      } else {
        setIsChecking(false)
      }
    }

    checkSession()
    return () => { mounted = false }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Şifreler birbiriyle eşleşmiyor.")
      return
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.")
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
      }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Şifre güncellenirken bir hata oluştu.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-100 via-slate-50/50 to-white relative overflow-hidden font-sans">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute -top-1 left-0 w-full h-56"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B01E2E" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#000000" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#B01E2E" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            fill="url(#waveGradient)"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
        <div className="absolute -bottom-32 -right-16 w-72 h-72 bg-gradient-to-tl from-red-400/10 to-slate-300/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-[420px] p-6 relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#B01E2E] rounded-xl mx-auto mb-6 shadow-xl shadow-[#B01E2E]/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-3">
            {isChecking ? "Doğrulanıyor" : success ? "Şifre Güncellendi" :
              <span className="uppercase tracking-tighter">
                <span className="font-black text-[#B01E2E]">Fog</span><span className="font-light text-slate-900">Catalog</span>
              </span>
            }
          </h1>
          <p className="text-slate-500 text-[15px] leading-relaxed">
            {isChecking ? "Güvenli oturumunuz kontrol ediliyor..." :
              success ? "Yeni şifreniz başarıyla kaydedildi." : "Lütfen yeni ve güvenli bir şifre belirleyin."}
          </p>
        </div>

        {isChecking ? (
          <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#B01E2E] animate-spin" />
            </div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Lütfen Bekleyin...</p>
          </div>
        ) : success ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-full h-12 bg-green-50 text-green-700 rounded-xl flex items-center justify-center gap-2 px-4 text-sm font-medium border border-green-100">
              <CheckCircle2 className="w-5 h-5" />
              <span>Dashboard'a yönlendiriliyorsunuz</span>
            </div>
            <div className="flex justify-center pt-4">
              <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-900 ml-1">Yeni Şifre</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[15px] outline-none focus:border-[#B01E2E] focus:ring-1 focus:ring-[#B01E2E] transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-900 ml-1">Şifre Onayı</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[15px] outline-none focus:border-[#B01E2E] focus:ring-1 focus:ring-[#B01E2E] transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#B01E2E] hover:bg-[#8E1825] text-white font-medium rounded-xl shadow-lg shadow-[#B01E2E]/20 hover:shadow-[#B01E2E]/30 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Şifreyi Güncelle ve Giriş Yap"}
            </button>
          </form>
        )
        }

        <div className="mt-8 text-center border-t border-slate-100 pt-8">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
            Powered by FogCatalog
          </p>
        </div>
      </div>
    </div>
  )
}
