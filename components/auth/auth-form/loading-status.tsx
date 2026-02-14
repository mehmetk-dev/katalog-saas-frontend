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
                    ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                    : loadingPhase === "success"
                        ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                        : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
            )}
        >
            <div className="flex items-center gap-2 sm:gap-3">
                {loadingPhase === "success" ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 shrink-0" />
                ) : (
                    <Loader2
                        className={cn(
                            "h-4 w-4 sm:h-5 sm:w-5 animate-spin shrink-0",
                            isSlowConnection ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                        )}
                    />
                )}
                <div className="flex-1 min-w-0">
                    <p
                        className={cn(
                            "text-xs sm:text-sm font-medium truncate",
                            isSlowConnection
                                ? "text-amber-700 dark:text-amber-300"
                                : loadingPhase === "success"
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-blue-700 dark:text-blue-300"
                        )}
                    >
                        {getLoadingMessage(loadingPhase, t)}
                    </p>
                    {isSlowConnection && (
                        <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">
                            {t("auth.slowOperationShort")}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
