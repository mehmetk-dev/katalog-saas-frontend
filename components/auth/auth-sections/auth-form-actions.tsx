import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { GoogleIcon } from "@/components/auth/google-icon"
import type { AuthMode, TranslateFn } from "./types"

interface AuthFormActionsProps {
    mode: AuthMode
    isLoading: boolean
    isGoogleLoading: boolean
    onSubmitLabel?: string
    onGoogleAuth: () => void
    onModeSwitch: (mode: AuthMode) => void
    onResetForm: () => void
    t: TranslateFn
}

export function AuthFormActions({
    mode, isLoading, isGoogleLoading, onGoogleAuth, onModeSwitch, onResetForm, t,
}: AuthFormActionsProps) {
    return (
        <>
            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className={cn(
                    "w-full h-12 bg-[#B01E2E] hover:bg-[#8E1825]",
                    "text-white font-medium rounded-xl",
                    "shadow-lg shadow-[#B01E2E]/20 hover:shadow-[#B01E2E]/30",
                    "hover:scale-[1.01] active:scale-[0.99]",
                    "transition-all duration-200 disabled:opacity-70",
                    "flex items-center justify-center gap-2 mt-4"
                )}
                tabIndex={5}
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    mode === 'signup'
                        ? (t("auth.signup"))
                        : mode === 'forgot-password'
                            ? (t("auth.sendResetLink"))
                            : (t("auth.signin"))
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
                            <span className={cn(
                                "bg-[#FDFDFD] px-4 text-xs font-medium",
                                "text-slate-400 uppercase tracking-widest"
                            )}>
                                {t("auth.or")}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onGoogleAuth}
                        disabled={isLoading || isGoogleLoading}
                        className={cn(
                            "w-full h-12 bg-white border border-slate-200",
                            "hover:bg-slate-50 text-slate-900 font-medium",
                            "rounded-xl transition-all duration-200",
                            "flex items-center justify-center gap-3",
                            "hover:border-slate-300 active:scale-[0.98]"
                        )}
                    >
                        {isGoogleLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        ) : (
                            <>
                                <GoogleIcon />
                                {t("auth.continueWithGoogle")}
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
                            onModeSwitch('signin')
                            onResetForm()
                        }}
                        className="text-violet-700 font-semibold hover:text-violet-900 transition-colors hover:underline"
                    >
                        {(t("auth.backToLogin")) || "Giriş Yap'a Dön"}
                    </button>
                ) : (
                    <>
                        {mode === 'signup'
                            ? (t("auth.alreadyHaveAccount"))
                            : (t("auth.dontHaveAccount"))
                        }{" "}
                        <button
                            type="button"
                            onClick={() => {
                                onModeSwitch(mode === 'signup' ? 'signin' : 'signup')
                                onResetForm()
                            }}
                            className="text-violet-700 font-semibold hover:text-violet-900 transition-colors hover:underline"
                        >
                            {mode === 'signup' ? (t("auth.signin")) : (t("auth.signup"))}
                        </button>
                    </>
                )}
            </p>
        </>
    )
}
