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
                    "w-full h-12 bg-brand/90 hover:bg-brand/90",
                    "text-white font-medium rounded-xl",
                    "shadow-lg shadow-brand/20 hover:shadow-brand/30",
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
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className={cn(
                                "bg-background px-4 text-xs font-medium",
                                "text-muted-foreground uppercase tracking-widest"
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
                            "w-full h-12 bg-card border border-border",
                            "hover:bg-muted/50 text-foreground font-medium",
                            "rounded-xl transition-all duration-200",
                            "flex items-center justify-center gap-3",
                            "hover:border-border active:scale-[0.98]"
                        )}
                    >
                        {isGoogleLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
            <p className="text-center text-[14px] text-muted-foreground mt-8">
                {mode === 'forgot-password' ? (
                    <button
                        type="button"
                        onClick={() => {
                            onModeSwitch('signin')
                            onResetForm()
                        }}
                        className="text-primary font-semibold hover:text-primary transition-colors hover:underline"
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
                            className="text-primary font-semibold hover:text-primary transition-colors hover:underline"
                        >
                            {mode === 'signup' ? (t("auth.signin")) : (t("auth.signup"))}
                        </button>
                    </>
                )}
            </p>
        </>
    )
}
