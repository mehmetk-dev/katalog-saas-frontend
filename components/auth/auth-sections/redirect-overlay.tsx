import { Loader2 } from "lucide-react"
import type { TranslateFn } from "./types"

interface RedirectOverlayProps {
    t: TranslateFn
}

export function RedirectOverlay({ t }: RedirectOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                </div>
                <p className="text-slate-500 font-medium">{t("auth.redirecting") as string}</p>
            </div>
        </div>
    )
}
