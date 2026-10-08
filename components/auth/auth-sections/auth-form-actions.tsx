import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/auth/google-icon"
import type { AuthMode, TranslateFn } from "./types"

interface AuthFormActionsProps {
    mode: AuthMode
    isLoading: boolean
    isGoogleLoading: boolean
    onGoogleAuth: () => void
    onModeSwitch: (mode: AuthMode) => void
    onResetForm: () => void
    t: TranslateFn
}

const SUBMIT_LABEL_KEY: Record<AuthMode, string> = {
    signin: "auth.signin",
    signup: "auth.signup",
    "forgot-password": "auth.sendResetLink",
}

export function AuthFormActions({
    mode, isLoading, isGoogleLoading, onGoogleAuth, onModeSwitch, onResetForm, t,
}: AuthFormActionsProps) {
    const busy = isLoading || isGoogleLoading
    const switchTo = (next: AuthMode) => {
        onModeSwitch(next)
        onResetForm()
    }

    return (
        <>
            <Button type="submit" size="lg" disabled={busy} className="mt-2 h-11 w-full text-[15px]">
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {t(SUBMIT_LABEL_KEY[mode])}
            </Button>

            {mode !== "forgot-password" && (
                <>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-background px-3 text-xs text-muted-foreground">{t("auth.or")}</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={onGoogleAuth}
                        disabled={busy}
                        className="h-11 w-full bg-card text-[15px]"
                    >
                        {isGoogleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                        {t("auth.continueWithGoogle")}
                    </Button>
                </>
            )}

            <p className="mt-8 text-center text-sm text-muted-foreground">
                {mode === "forgot-password" ? (
                    <button type="button" onClick={() => switchTo("signin")} className="font-semibold text-foreground hover:underline">
                        {t("auth.backToLogin")}
                    </button>
                ) : (
                    <>
                        {mode === "signup" ? t("auth.alreadyHaveAccount") : t("auth.dontHaveAccount")}{" "}
                        <button
                            type="button"
                            onClick={() => switchTo(mode === "signup" ? "signin" : "signup")}
                            className="font-semibold text-foreground hover:underline"
                        >
                            {mode === "signup" ? t("auth.signin") : t("auth.signup")}
                        </button>
                    </>
                )}
            </p>
        </>
    )
}
