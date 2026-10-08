import { Loader2, CheckCircle2 } from "lucide-react"

import type { LoadingPhase, TranslationFn } from "@/components/auth/auth-form/types"
import { getLoadingMessage } from "@/components/auth/auth-form/types"
import { cn } from "@/lib/utils"

interface LoadingStatusProps {
    isLoading: boolean
    loadingPhase: LoadingPhase
    isSlowConnection: boolean
    t: TranslationFn
}

export function LoadingStatus({ isLoading, loadingPhase, isSlowConnection, t }: LoadingStatusProps) {
    if (!isLoading || loadingPhase === "idle") {
        return null
    }

    return (
        <div
            className={cn(
                "rounded-lg p-3 sm:p-4 transition-all duration-300",
                isSlowConnection
                    ? "bg-warning-soft border border-warning/30"
                    : loadingPhase === "success"
                        ? "bg-success-soft border border-success/20"
                        : "bg-info-soft border border-info/20"
            )}
        >
            <div className="flex items-center gap-2 sm:gap-3">
                {loadingPhase === "success" ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success shrink-0" />
                ) : (
                    <Loader2
                        className={cn(
                            "h-4 w-4 sm:h-5 sm:w-5 animate-spin shrink-0",
                            isSlowConnection ? "text-warning-soft-foreground" : "text-info"
                        )}
                    />
                )}
                <div className="flex-1 min-w-0">
                    <p
                        className={cn(
                            "text-xs sm:text-sm font-medium truncate",
                            isSlowConnection
                                ? "text-warning-soft-foreground"
                                : loadingPhase === "success"
                                    ? "text-success-soft-foreground"
                                    : "text-info-soft-foreground"
                        )}
                    >
                        {getLoadingMessage(loadingPhase, t)}
                    </p>
                    {isSlowConnection && (
                        <p className="text-[10px] sm:text-xs text-warning-soft-foreground mt-0.5 sm:mt-1">
                            {t("auth.slowOperationShort")}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
