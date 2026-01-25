"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Lock, CheckCircle2 } from "lucide-react"

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
    <div className="min-h-screen bg-white relative overflow-hidden font-montserrat">
      {/* Editorial Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#cf1414] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-black rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-6 py-8 sm:px-12">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tighter uppercase font-montserrat">
                <span className="text-[#cf1414]">Fog</span>
                <span className="text-slate-900">Catalog</span>
              </span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 pb-20">
          <div className="w-full max-w-md">
            {success ? (
              <div className="text-center animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mb-8 rotate-6">
                  <CheckCircle2 className="w-12 h-12 text-[#cf1414]" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">
                  Şifreniz <span className="text-[#cf1414]">Güncellendi</span>
                </h1>
                <p className="text-slate-500 font-medium mb-8">
                  Yeni şifreniz başarıyla kaydedildi. Dashboard'a yönlendiriliyorsunuz...
                </p>
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 text-[#cf1414] animate-spin" />
                </div>
              </div>
            ) : (
              <div className="bg-white border-t-8 border-[#cf1414] rounded-[2rem] shadow-2xl p-10 sm:p-12 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-10 opacity-50" />

                <div className="text-center mb-10">
                  <div className="mx-auto w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-slate-900/10">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter uppercase italic leading-none">
                    Yeni <span className="text-[#cf1414]">Parola</span>
                  </h1>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
                    Hesap Güvenlik Merkezi
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 text-[#cf1414] text-xs font-bold rounded-xl border border-red-100">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Yeni Şifre
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full h-14 px-5 bg-slate-50 border-2 border-transparent focus:border-[#cf1414] focus:bg-white rounded-2xl text-[15px] font-bold outline-none transition-all placeholder:text-slate-300 disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Şifreyi Onayla
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full h-14 px-5 bg-slate-50 border-2 border-transparent focus:border-[#cf1414] focus:bg-white rounded-2xl text-[15px] font-bold outline-none transition-all placeholder:text-slate-300 disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-slate-900 hover:bg-[#cf1414] text-white font-black rounded-2xl shadow-xl shadow-slate-900/10 transition-all duration-300 uppercase tracking-wider text-sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Şifreyi Güncelle ve Giriş Yap"
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center pt-8 border-t border-slate-50">
                  <Link
                    href="/auth"
                    className="text-[10px] font-black text-slate-400 hover:text-[#cf1414] transition-colors uppercase tracking-[0.2em]"
                  >
                    ← Oturum Açma Sayfasına Dön
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <footer className="py-8 px-6 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">
          Powered by FogCatalog Engineering
        </footer>
      </div>
    </div>
  )
}
