"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Eye, EyeOff, BookOpen } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

interface AuthFormNewProps {
    isSignUp: boolean
    onSignUpComplete: () => void
}

export function AuthFormNew({ isSignUp, onSignUpComplete: _onSignUpComplete }: AuthFormNewProps) {
    const router = useRouter()
    // const { t } = useTranslation() // Unused for now as text is hardcoded in TR
    const searchParams = useSearchParams()

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [isRedirecting, setIsRedirecting] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Handle URL error parameters
    useEffect(() => {
        const urlError = searchParams.get("error")
        if (urlError) {
            const errorMessages: Record<string, string> = {
                "auth_failed": "Kimlik doğrulama başarısız",
                "code_expired": "Oturum süresi doldu",
                "invalid_code": "Geçersiz kod",
            }
            setError(errorMessages[urlError] || `Hata: ${urlError}`)
        }
    }, [searchParams])

    const getSiteUrl = () => {
        if (typeof window !== "undefined") {
            const origin = window.location.origin
            if (origin.includes("0.0.0.0")) {
                return origin.replace("0.0.0.0", "localhost")
            }
            return origin
        }
        return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        try {
            if (isSignUp) {
                // Sign Up
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
                        data: {
                            full_name: name,
                        },
                    },
                })

                if (error) {
                    if (error.message.includes("already registered")) {
                        throw new Error("Bu e-posta adresi zaten kayıtlı")
                    }
                    if (error.message.includes("Password should be")) {
                        throw new Error("Şifre en az 6 karakter olmalıdır")
                    }
                    throw error
                }

                if (data.session) {
                    setIsRedirecting(true)
                    await new Promise(resolve => setTimeout(resolve, 300))
                    router.push("/dashboard")
                    router.refresh()
                } else if (data.user && !data.session) {
                    router.push("/auth/verify")
                }
            } else {
                // Sign In
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })

                if (error) {
                    if (error.message.includes("Invalid login credentials")) {
                        throw new Error("E-posta veya şifre hatalı")
                    }
                    if (error.message.includes("Email not confirmed")) {
                        throw new Error("E-posta adresinizi doğrulamanız gerekiyor")
                    }
                    throw error
                }

                if (data?.user) {
                    // Log activity
                    try {
                        await supabase.from('activity_logs').insert({
                            user_id: data.user.id,
                            user_email: data.user.email || email,
                            activity_type: 'user_login',
                            description: `${data.user.email} sisteme giriş yaptı`,
                        })
                    } catch (logError) {
                        console.error('Activity log error:', logError)
                    }
                }

                setIsRedirecting(true)
                await new Promise(resolve => setTimeout(resolve, 300))
                router.push("/dashboard")
                router.refresh()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Bir hata oluştu")
            setIsLoading(false)
        }
    }

    // Full screen loading overlay
    if (isRedirecting) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-3 bg-violet-100 rounded-2xl">
                        <BookOpen className="w-10 h-10 text-violet-600" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                            <span className="text-lg font-medium text-slate-900">Yönlendiriliyor</span>
                        </div>
                        <p className="text-sm text-slate-500">Panele yönlendiriliyorsunuz...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-in fade-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            {/* Name Field (Sign Up Only) */}
            {isSignUp && (
                <div className="space-y-1.5">
                    <input
                        type="text"
                        placeholder="Ad Soyad"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all disabled:opacity-50 disabled:bg-slate-50"
                    />
                </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
                <input
                    type="email"
                    placeholder="E-posta adresi"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all disabled:opacity-50 disabled:bg-slate-50"
                />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Şifre"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={isLoading}
                        className="w-full h-12 px-4 pr-12 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all disabled:opacity-50 disabled:bg-slate-50"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>

                {/* Forgot Password Link */}
                {!isSignUp && (
                    <div className="flex justify-end">
                        <a
                            href="/auth/forgot-password"
                            className="text-xs text-violet-600 hover:underline"
                        >
                            Şifremi unuttum
                        </a>
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isSignUp ? "Hesap oluşturuluyor..." : "Giriş yapılıyor..."}</span>
                    </>
                ) : (
                    <span>{isSignUp ? "Başlayın" : "Giriş Yap"}</span>
                )}
            </button>

            {/* Terms (Sign Up Only) */}
            {isSignUp && (
                <p className="text-xs text-center text-slate-400">
                    Kayıt olarak{" "}
                    <a href="/terms" className="text-violet-600 hover:underline">Kullanım Şartları</a>
                    {" "}ve{" "}
                    <a href="/privacy" className="text-violet-600 hover:underline">Gizlilik Politikası</a>
                    'nı kabul etmiş olursunuz.
                </p>
            )}
        </form>
    )
}
