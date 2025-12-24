"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, ArrowLeft, Eye, EyeOff, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { OnboardingModal } from "@/components/auth/onboarding-modal"
import { useTranslation } from "@/lib/i18n-provider"

export function AuthPageClient() {
    const router = useRouter()
    const { t } = useTranslation()
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    useEffect(() => {
        setIsAnimating(true)
        const timer = setTimeout(() => setIsAnimating(false), 300)
        return () => clearTimeout(timer)
    }, [isSignUp])

    const getSiteUrl = () => {
        if (typeof window !== "undefined") return window.location.origin
        return "http://localhost:3000"
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        const supabase = createClient()

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
                        data: {
                            full_name: name,
                            company_name: companyName
                        },
                    },
                })
                if (error) throw error

                if (data.session) {
                    setIsRedirecting(true)
                    await new Promise(r => setTimeout(r, 800))
                    router.push("/dashboard")
                    router.refresh()
                } else if (data.user) {
                    router.push("/auth/verify")
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error

                setIsRedirecting(true)
                await new Promise(r => setTimeout(r, 800))
                router.push("/dashboard")
                router.refresh()
            }
        } catch (err) {
            setError(t("auth.errorGeneric") || "Bir hata oluştu. Lütfen tekrar deneyin.")
            setIsLoading(false)
        }
    }

    const handleGoogleAuth = async () => {
        setIsGoogleLoading(true)
        const supabase = createClient()
        try {
            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${getSiteUrl()}/auth/callback` },
            })
        } catch (err) {
            setIsGoogleLoading(false)
        }
    }

    if (isRedirecting) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                    </div>
                    <p className="text-slate-500 font-medium">{t("auth.redirecting") || "Yönlendiriliyor..."}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#FDFDFD] text-[#111]">
            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />

            {/* Minimal Grid - Very Subtle */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />

            {/* Back Button */}
            <div className="absolute top-6 left-6 z-20">
                <Link href="/" className="group flex items-center gap-3 text-sm font-medium text-slate-500 hover:text-violet-700 transition-colors">
                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-violet-600 group-hover:bg-violet-50 transition-all bg-white">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    </div>
                    {t("auth.backToHome") || "Ana Sayfa"}
                </Link>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-[400px] p-6 relative z-10">

                {/* Header - Animated key change for smooth text transition */}
                <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-2 duration-500" key={isSignUp ? 'signup-header' : 'signin-header'}>
                    <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl mx-auto mb-6 shadow-xl shadow-violet-500/20 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-3">
                        {isSignUp ? t("auth.createAccount") : t("auth.welcomeBack") || "Tekrar Hoş Geldiniz"}
                    </h1>
                    <p className="text-slate-500 text-[15px] max-w-[280px] mx-auto leading-relaxed">
                        {isSignUp
                            ? t("auth.signupDesc") || "Profesyonel kataloglar oluşturmak için hemen başlayın."
                            : t("auth.signinDesc") || "Kaldığınız yerden devam etmek için giriş yapın."}
                    </p>
                </div>

                {/* Form Container with Height Transition */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg text-center animate-in shake">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4 relative">
                        {/* Name Field - Conditional Rendering with Animation */}
                        <div className={`grid transition-all duration-300 ease-in-out ${isSignUp ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0 mb-0'}`}>
                            <div className="overflow-hidden space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-900 ml-1">{t("auth.fullName")}</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[15px] outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all placeholder:text-slate-300 hover:border-slate-300"
                                        placeholder={t("auth.placeholderName")}
                                        required={isSignUp}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-900 ml-1">{t("auth.company")}</label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[15px] outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all placeholder:text-slate-300 hover:border-slate-300"
                                        placeholder={t("auth.placeholderCompany")}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-slate-900 ml-1">{t("auth.email")}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[15px] outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all placeholder:text-slate-300 hover:border-slate-300"
                                placeholder={t("auth.placeholderEmail")}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[13px] font-medium text-slate-900">{t("auth.password")}</label>
                                {!isSignUp && (
                                    <Link href="/auth/forgot-password" className="text-[13px] font-medium text-slate-500 hover:text-violet-600 transition-colors">
                                        {t("auth.forgotPassword")}
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 px-4 pr-12 bg-white border border-slate-200 rounded-xl text-[15px] outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all placeholder:text-slate-300 hover:border-slate-300"
                                    placeholder={t("auth.placeholderPassword")}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isGoogleLoading}
                        className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            isSignUp ? t("auth.signup") : t("auth.signin")
                        )}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-[#FDFDFD] px-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
                                {t("auth.or")}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isLoading || isGoogleLoading}
                        className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 hover:border-slate-300"
                    >
                        {isGoogleLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {t("auth.continueWithGoogle")}
                            </>
                        )}
                    </button>

                    <p className="text-center text-[14px] text-slate-500 mt-8">
                        {isSignUp ? t("auth.alreadyHaveAccount") : t("auth.dontHaveAccount")}{" "}
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-violet-700 font-semibold hover:text-violet-900 transition-colors hover:underline"
                        >
                            {isSignUp ? t("auth.signin") : t("auth.signup")}
                        </button>
                    </p>
                </form>
            </div>

            <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
        </div>
    )
}
