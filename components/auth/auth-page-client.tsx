"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { OnboardingModal } from "@/components/auth/onboarding-modal"

export function AuthPageClient() {
    const router = useRouter()
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [isRedirecting, setIsRedirecting] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

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
                        data: { full_name: name },
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
            setError("Giriş başarısız. Bilgilerinizi kontrol edin.")
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
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
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
            <div className="absolute top-8 left-8 z-20">
                <Link href="/" className="group flex items-center gap-3 text-sm font-medium text-gray-500 hover:text-black transition-colors">
                    <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-black transition-colors bg-white">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    </div>
                    Let's go back
                </Link>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-[400px] p-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="w-12 h-12 bg-black rounded-xl mx-auto mb-6 shadow-xl shadow-black/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                            <path d="M4 19.5C4 18.8315 4 18.4973 4.01519 18.232C4.16122 15.6836 6.18356 13.6612 8.73196 13.5152C8.99731 13.5 9.33152 13.5 10 13.5H14C14.6685 13.5 15.0027 13.5 15.268 13.5152C17.8164 13.6612 19.8388 15.6836 19.9848 18.232C20 18.4973 20 18.8315 20 19.5M12 10.5C14.2091 10.5 16 8.70914 16 6.5C16 4.29086 14.2091 2.5 12 2.5C9.79086 2.5 8 4.29086 8 6.5C8 8.70914 9.79086 10.5 12 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="text-[32px] font-semibold tracking-tight text-black mb-3">
                        {isSignUp ? "Create account" : "Welcome back"}
                    </h1>
                    <p className="text-gray-500 text-[15px]">
                        {isSignUp ? "Start creating professional catalogs today." : "Please enter your details to sign in."}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {isSignUp && (
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-gray-900 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-[15px] outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-gray-300 hover:border-gray-300"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-gray-900 ml-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-[15px] outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-gray-300 hover:border-gray-300"
                                placeholder="name@company.com"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[13px] font-medium text-gray-900">Password</label>
                                {!isSignUp && (
                                    <Link href="/auth/forgot-password" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors">
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 px-4 pr-12 bg-white border border-gray-200 rounded-xl text-[15px] outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-gray-300 hover:border-gray-300"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isGoogleLoading}
                        className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-xl shadow-lg shadow-black/5 hover:shadow-black/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            isSignUp ? "Create account" : "Sign in"
                        )}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-[#FDFDFD] px-4 text-xs font-medium text-gray-400 uppercase tracking-widest">
                                OR
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isLoading || isGoogleLoading}
                        className="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 hover:border-gray-300"
                    >
                        {isGoogleLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </button>

                    <p className="text-center text-[14px] text-gray-500 mt-8">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-black font-semibold hover:underline transition-all"
                        >
                            {isSignUp ? "Sign in" : "Sign up"}
                        </button>
                    </p>
                </form>
            </div>

            <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
        </div>
    )
}
