import { Loader2, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface RedirectOverlayProps {
    t: (key: string, params?: Record<string, unknown>) => string
    /** "default" = full overlay with icon + description; "minimal" = simpler blur overlay */
    variant?: "default" | "minimal"
}

export function RedirectOverlay({ t, variant = "default" }: RedirectOverlayProps) {
    if (variant === "minimal") {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                    </div>
                    <p className="text-slate-500 font-medium">{t("auth.redirecting")}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <BookOpen className="w-10 h-10 text-primary" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-lg font-medium">{t("auth.redirecting")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t("auth.redirectingDesc")}</p>
                </div>
            </div>
        </div>
    )
}
