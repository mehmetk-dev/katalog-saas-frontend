import Link from "next/link"
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"
import type { AuthState, AuthHandlers, TranslateFn } from "./types"

interface AuthFormProps {
    t: TranslateFn
    state: AuthState
    handlers: AuthHandlers
}

function GoogleIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    )
}

export function AuthForm({ t, state, handlers }: AuthFormProps) {
    const { mode, isLoading, isGoogleLoading, error, fieldErrors, success, showPassword, showGoogleWarning, shakingFields, name, companyName, email, password } = state
    const { setMode, setName, setCompanyName, setEmail, setPassword, setShowPassword, setError, setFieldErrors, handleSubmit, handleGoogleAuth, handleContinueAnyway, resetForm } = handlers

    return (
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-b from-violet-100 via-violet-50/50 to-white relative overflow-hidden">
            {/* Background Decorations */}
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
            </div>

            {/* Back Button */}
            <div className="absolute top-6 left-6 z-20">
                <Link href="/" className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700 transition-colors">
                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-violet-600 group-hover:bg-violet-50 transition-all bg-white/80 backdrop-blur-sm">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    </div>
                    <span className="hidden sm:inline">{t("auth.backToHome") as string}</span>
                </Link>
            </div>

            <div className="w-full max-w-[420px] p-6 lg:p-12 relative z-10">
                {/* Animated Container for Form Modes */}
                <div
                    key={mode}
                    className="animate-in fade-in slide-in-from-right-4 duration-500 ease-out"
                >
                    <div className="mb-8 lg:mb-10 text-center lg:text-left">
                        <div className="lg:hidden mb-6">
                            <Link href="/" className="flex items-center justify-center">
                                <span className="font-montserrat text-4xl tracking-tighter flex items-center">
                                    <span className="font-black text-[#cf1414] uppercase">Fog</span>
                                    <span className="font-light text-slate-900">Catalog</span>
                                </span>
                            </Link>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 mb-3">
                            {mode === 'signup' ? (t("auth.signup") as string) : mode === 'forgot-password' ? (t("auth.forgotPasswordTitle") as string) : (t("auth.welcomeBack") as string)}
                        </h1>
                        <p className="text-slate-500 text-[15px] leading-relaxed">
                            {mode === 'signup' ? (t("auth.signupDesc") as string) : mode === 'forgot-password' ? (t("auth.forgotPasswordSubtitle") as string) : (t("auth.signinDesc") as string)}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* Error Alert */}
                        {error && (
                            <div className={`p-4 rounded-xl text-sm font-medium animate-in shake border-2 ${error.includes("Şifre sıfırlama linkinizin süresi dolmuş") || error.includes("süresi dolmuş")
                                ? "bg-amber-50 text-amber-800 border-amber-300 shadow-lg"
                                : "bg-red-50 text-red-600 border-red-300 shadow-lg"
                                }`}>
                                <div className="flex items-start gap-2">
                                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${error.includes("Şifre sıfırlama linkinizin süresi dolmuş") || error.includes("süresi dolmuş")
                                        ? "text-amber-600"
                                        : "text-red-500"
                                        }`} />
                                    <div className="flex-1">
                                        <p className="font-bold mb-2 text-base">
                                            {error.includes("Şifre sıfırlama linkinizin süresi dolmuş") || error.includes("süresi dolmuş")
                                                ? "⚠️ Link Süresi Dolmuş"
                                                : "❌ Hata"}
                                        </p>
                                        <p className="mb-3">{error}</p>
                                        {(error.includes("Şifre sıfırlama linkinizin süresi dolmuş") || error.includes("süresi dolmuş")) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setError(null)
                                                    setMode('forgot-password')
                                                }}
                                                className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                Yeni şifre sıfırlama linki iste →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success state for forgot-password */}
                        {success && mode === 'forgot-password' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="w-full h-12 bg-green-50 text-green-700 rounded-xl flex items-center justify-center gap-2 px-4 text-sm font-medium border border-green-100 italic">
                                    <CheckCircle2 className="w-5 h-5 animate-bounce-slow" />
                                    <span>{(t("auth.emailSentTitle") as string) || "Bağlantı Gönderildi"}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setMode('signin'); handlers.setSuccess(false); }}
                                    className="w-full h-12 bg-[#B01E2E] hover:bg-[#8E1825] text-white font-medium rounded-xl shadow-lg transition-all active:scale-[0.98]"
                                >
                                    {(t("auth.backToLogin") as string) || "Giriş Yapmaya Dön"}
                                </button>
                            </div>
                        ) : showGoogleWarning ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm">
                                    <p className="font-bold flex items-center gap-2 mb-1">
                                        <AlertCircle className="w-4 h-4" /> Google Hesabı Tespit Edildi
                                    </p>
                                    Bu email adresi Google ile bağlıdır. Google ile hızlıca giriş yapabilirsiniz.
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGoogleAuth}
                                    className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <GoogleIcon />
                                    Google ile Giriş Yap
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleContinueAnyway()}
                                    className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors underline"
                                >
                                    Yine de şifre sıfırlama linki gönder
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Signup-only fields */}
                                {mode === 'signup' && (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-medium text-slate-900 ml-1">{t("auth.fullName") as string}</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => {
                                                    setName(e.target.value)
                                                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" })
                                                }}
                                                className={`w-full h-12 px-4 bg-white border ${fieldErrors.name ? 'border-[#cf1414] ring-1 ring-[#cf1414] focus:ring-[#cf1414] focus:border-[#cf1414]' : 'border-slate-200 focus:border-violet-600 focus:ring-1 focus:ring-violet-600'} rounded-xl text-[15px] outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 ${shakingFields.name ? 'animate-shake' : ''}`}
                                                placeholder={t("auth.placeholderName") as string}
                                                required
                                                suppressHydrationWarning
                                                tabIndex={1}
                                            />
                                            {fieldErrors.name && (
                                                <p className="text-[12px] text-[#cf1414] font-medium mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{fieldErrors.name}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-medium text-slate-900 ml-1">{t("auth.company") as string}</label>
                                            <input
                                                type="text"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[15px] outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all placeholder:text-slate-300 hover:border-slate-300"
                                                placeholder={t("auth.placeholderCompany") as string}
                                                suppressHydrationWarning
                                                tabIndex={2}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-slate-900 ml-1">{t("auth.email") as string}</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" })
                                        }}
                                        className={`w-full h-12 px-4 bg-white border ${fieldErrors.email ? 'border-[#cf1414] ring-1 ring-[#cf1414] focus:ring-[#cf1414] focus:border-[#cf1414]' : 'border-slate-200 focus:border-violet-600 focus:ring-1 focus:ring-violet-600'} rounded-xl text-[15px] outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 ${shakingFields.email ? 'animate-shake' : ''}`}
                                        placeholder={t("auth.placeholderEmail") as string}
                                        required
                                        suppressHydrationWarning
                                        tabIndex={3}
                                    />
                                    {fieldErrors.email && (
                                        <p className="text-[12px] text-[#cf1414] font-medium mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{fieldErrors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                {mode !== 'forgot-password' && (
                                    <div className="space-y-1.5 relative">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[13px] font-medium text-slate-900">{t("auth.password") as string}</label>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value)
                                                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" })
                                                }}
                                                className={`w-full h-12 pl-4 pr-12 bg-white border ${fieldErrors.password ? 'border-[#cf1414] ring-1 ring-[#cf1414] focus:ring-[#cf1414] focus:border-[#cf1414]' : 'border-slate-200 focus:border-violet-600 focus:ring-1 focus:ring-violet-600'} rounded-xl text-[15px] outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 ${shakingFields.password ? 'animate-shake' : ''}`}
                                                placeholder={t("auth.placeholderPassword") as string}
                                                required
                                                tabIndex={4}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {mode === 'signin' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMode('forgot-password');
                                                    resetForm();
                                                }}
                                                className="absolute top-0 right-1 text-[13px] font-medium text-slate-500 hover:text-violet-600 transition-colors"
                                                tabIndex={6}
                                            >
                                                {t("auth.forgotPassword") as string}
                                            </button>
                                        )}
                                        {fieldErrors.password && (
                                            <p className="text-[12px] text-[#cf1414] font-medium mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{fieldErrors.password}</p>
                                        )}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading || isGoogleLoading}
                                    className="w-full h-12 bg-[#B01E2E] hover:bg-[#8E1825] text-white font-medium rounded-xl shadow-lg shadow-[#B01E2E]/20 hover:shadow-[#B01E2E]/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
                                    tabIndex={5}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        mode === 'signup' ? (t("auth.signup") as string) : mode === 'forgot-password' ? (t("auth.sendResetLink") as string) : (t("auth.signin") as string)
                                    )}
                                </button>

                                {/* Google Auth + Divider */}
                                {mode !== 'forgot-password' && (
                                    <>
                                        <div className="relative my-6">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-200" />
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="bg-[#FDFDFD] px-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
                                                    {t("auth.or") as string}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleGoogleAuth}
                                            disabled={isLoading || isGoogleLoading}
                                            className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 hover:border-slate-300 active:scale-[0.98]"
                                        >
                                            {isGoogleLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                            ) : (
                                                <>
                                                    <GoogleIcon />
                                                    {t("auth.continueWithGoogle") as string}
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}

                                {/* Mode Switcher */}
                                <p className="text-center text-[14px] text-slate-500 mt-8">
                                    {mode === 'forgot-password' ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMode('signin');
                                                resetForm();
                                            }}
                                            className="text-violet-700 font-semibold hover:text-violet-900 transition-colors hover:underline"
                                        >
                                            {(t("auth.backToLogin") as string) || "Giriş Yap'a Dön"}
                                        </button>
                                    ) : (
                                        <>
                                            {mode === 'signup' ? (t("auth.alreadyHaveAccount") as string) : (t("auth.dontHaveAccount") as string)}{" "}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMode(mode === 'signup' ? 'signin' : 'signup');
                                                    resetForm();
                                                }}
                                                className="text-violet-700 font-semibold hover:text-violet-900 transition-colors hover:underline"
                                            >
                                                {mode === 'signup' ? (t("auth.signin") as string) : (t("auth.signup") as string)}
                                            </button>
                                        </>
                                    )}
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
