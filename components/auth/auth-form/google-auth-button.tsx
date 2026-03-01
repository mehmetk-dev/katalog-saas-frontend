import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/auth/google-icon"
import type { TranslationFn } from "@/components/auth/auth-form/types"

interface GoogleAuthButtonProps {
    isLoading: boolean
    isGoogleLoading: boolean
    isOnline: boolean
    onClick: () => void
    t: TranslationFn
}

export function GoogleAuthButton({ isLoading, isGoogleLoading, isOnline, onClick, t }: GoogleAuthButtonProps) {
    return (
        <Button
            variant="outline"
            className="w-full h-12 bg-white dark:bg-background border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 text-sm font-medium rounded-xl transition-colors"
            onClick={onClick}
            disabled={isLoading || isGoogleLoading || !isOnline}
        >
            {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
            ) : (
                <GoogleIcon className="w-4 h-4 mr-2 shrink-0" />
            )}
            <span className="truncate">{t("auth.continueWithGoogle")}</span>
        </Button>
    )
}
