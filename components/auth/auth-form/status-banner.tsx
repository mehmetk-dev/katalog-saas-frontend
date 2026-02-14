import { WifiOff } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import type { TranslationFn } from "@/components/auth/auth-form/types"

interface StatusBannerProps {
    isOnline: boolean
    t: TranslationFn
}

export function StatusBanner({ isOnline, t }: StatusBannerProps) {
    if (isOnline) {
        return null
    }

    return (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-sm">{t("auth.offlineTitle")}</span>
                <span className="text-xs opacity-75">{t("auth.offlineDesc")}</span>
            </AlertDescription>
        </Alert>
    )
}
