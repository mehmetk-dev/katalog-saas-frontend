import { AlertCircle, CheckCircle2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { AuthHandlers, TranslateFn } from "./types"

/** Form alanlarının üstünde gösterilir; alanlar gizlenmez, kullanıcı hemen tekrar deneyebilir. */
export function AuthFormError({ error }: { error: string | null }) {
    if (!error) return null
    return (
        <Alert variant="destructive" role="alert" className="border-destructive/30 bg-destructive/5 animate-in fade-in">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    )
}

interface ResetLinkSentProps {
    email: string
    handlers: Pick<AuthHandlers, "setMode" | "setSuccess">
    t: TranslateFn
}

export function ResetLinkSent({ email, handlers, t }: ResetLinkSentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <Alert variant="success" role="status">
                <CheckCircle2 />
                <AlertTitle>{t("auth.emailSentTitle")}</AlertTitle>
                <AlertDescription>
                    <p>{t("auth.emailSentText", { email })}</p>
                    <p>{t("auth.checkSpam")}</p>
                </AlertDescription>
            </Alert>
            <Button
                type="button"
                size="lg"
                className="h-11 w-full"
                onClick={() => {
                    handlers.setSuccess(false)
                    handlers.setMode("signin")
                }}
            >
                {t("auth.backToLogin")}
            </Button>
        </div>
    )
}
