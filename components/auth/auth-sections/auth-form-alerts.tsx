import { AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { GoogleIcon } from "@/components/auth/google-icon"
import type { AuthMode, AuthHandlers, TranslateFn } from "./types"

interface AuthFormAlertsProps {
    error: string | null
    success: boolean
    mode: AuthMode
    showGoogleWarning: boolean
    handlers: Pick<AuthHandlers, "setMode" | "setError" | "setSuccess" | "handleGoogleAuth" | "handleContinueAnyway">
    t: TranslateFn
}

export function AuthFormAlerts({
    error, success, mode, showGoogleWarning, handlers, t,
}: AuthFormAlertsProps) {
    const { setMode, setError, setSuccess, handleGoogleAuth, handleContinueAnyway } = handlers
    const isExpiredError = error?.includes("süresi dolmuş") ?? false

    if (error) {
        return (
            <div className={cn(
                "p-4 rounded-xl text-sm font-medium animate-in shake border-2",
                isExpiredError
                    ? "bg-amber-50 text-amber-800 border-amber-300 shadow-lg"
                    : "bg-red-50 text-red-600 border-red-300 shadow-lg"
            )}>
                <div className="flex items-start gap-2">
                    <AlertCircle className={cn(
                        "w-5 h-5 flex-shrink-0 mt-0.5",
                        isExpiredError ? "text-amber-600" : "text-red-500"
                    )} />
                    <div className="flex-1">
                        <p className="font-bold mb-2 text-base">
                            {isExpiredError
                                ? "⚠️ Link Süresi Dolmuş"
                                : "❌ Hata"}
                        </p>
                        <p className="mb-3">{error}</p>
                        {isExpiredError && (
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null)
                                    setMode('forgot-password')
                                }}
                                className={cn(
                                    "mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-700",
                                    "text-white text-sm font-medium",
                                    "rounded-lg transition-colors"
                                )}
                            >
                                Yeni şifre sıfırlama linki iste →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    if (success && mode === 'forgot-password') {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className={cn(
                    "w-full h-12 bg-green-50 text-green-700 rounded-xl",
                    "flex items-center justify-center gap-2 px-4",
                    "text-sm font-medium border border-green-100 italic"
                )}>
                    <CheckCircle2 className="w-5 h-5 animate-bounce-slow" />
                    <span>{(t("auth.emailSentTitle")) || "Bağlantı Gönderildi"}</span>
                </div>
                <button
                    type="button"
                    onClick={() => { setMode('signin'); setSuccess(false); }}
                    className={cn(
                        "w-full h-12 bg-[#B01E2E] hover:bg-[#8E1825]",
                        "text-white font-medium rounded-xl",
                        "shadow-lg transition-all active:scale-[0.98]"
                    )}
                >
                    {(t("auth.backToLogin")) || "Giriş Yapmaya Dön"}
                </button>
            </div>
        )
    }

    if (showGoogleWarning) {
        return (
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
                    className={cn(
                        "w-full h-12 bg-white border border-slate-200",
                        "hover:bg-slate-50 text-slate-900 font-medium",
                        "rounded-xl transition-all duration-200",
                        "flex items-center justify-center gap-3 active:scale-[0.98]"
                    )}
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
        )
    }

    return null
}
