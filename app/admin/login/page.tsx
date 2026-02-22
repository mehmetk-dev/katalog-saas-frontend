"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react"

const getSiteUrl = () => {
    if (typeof window !== "undefined") {
        return window.location.origin
    }
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

export default function AdminLoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const router = useRouter()

    // Sign out any existing session when admin login page opens
    useEffect(() => {
        const signOutExisting = async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            setIsReady(true)
        }
        signOutExisting()
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const supabase = createClient()

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) {
                setError("Geçersiz e-posta veya şifre")
                return
            }

            if (!data.user) {
                setError("Giriş başarısız")
                return
            }

            // Check admin role
            const { data: profile } = await supabase
                .from("users")
                .select("is_admin")
                .eq("id", data.user.id)
                .single()

            if (!profile?.is_admin) {
                await supabase.auth.signOut()
                setError("Bu hesabın admin yetkisi bulunmuyor")
                return
            }

            router.push("/admin")
            router.refresh()
        } catch {
            setError("Bir hata oluştu. Tekrar deneyin.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true)
        setError("")

        try {
            const supabase = createClient()
            const SITE_URL = getSiteUrl()

            const { error: googleError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${SITE_URL}/auth/callback?next=/admin`,
                },
            })

            if (googleError) throw googleError
        } catch {
            setError("Google ile giriş başarısız")
            setIsGoogleLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
                        <Shield className="w-7 h-7 text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                    <p className="text-sm text-slate-500 mt-1">Yönetim paneline erişim</p>
                </div>

                {!isReady ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                    </div>
                ) : (
                    <>
                        {/* Google Login */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading}
                            className="w-full py-2.5 bg-white hover:bg-gray-100 disabled:opacity-50 text-slate-900 font-medium rounded-lg transition-colors flex items-center justify-center gap-3 mb-4"
                        >
                            {isGoogleLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            )}
                            Google ile Giriş Yap
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-1 h-px bg-slate-800" />
                            <span className="text-xs text-slate-600">veya</span>
                            <div className="flex-1 h-px bg-slate-800" />
                        </div>

                        {/* Email/Password Form */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">E-posta</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-colors"
                                    placeholder="admin@example.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Şifre</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3.5 py-2.5 pr-10 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-colors"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Kontrol ediliyor...
                                    </>
                                ) : (
                                    "Giriş Yap"
                                )}
                            </button>
                        </form>

                        <p className="text-center text-xs text-slate-600 mt-6">
                            Sadece yetkili yöneticiler erişebilir
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
