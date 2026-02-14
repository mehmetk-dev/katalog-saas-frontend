import { AlertCircle, RefreshCw } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { TranslationFn } from "@/components/auth/auth-form/types"

interface ErrorAlertProps {
    error: string | null
    showRetry: boolean
    onRetry: () => void
    t: TranslationFn
}

export function ErrorAlert({ error, showRetry, onRetry, t }: ErrorAlertProps) {
    if (!error) {
        return null
    }

    return (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-sm leading-relaxed">{error}</span>
                {showRetry && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="shrink-0 h-7 px-2 text-xs bg-transparent border-destructive/50 hover:bg-destructive/10 w-full sm:w-auto mt-1 sm:mt-0"
                    >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {t("auth.retry")}
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    )
}
