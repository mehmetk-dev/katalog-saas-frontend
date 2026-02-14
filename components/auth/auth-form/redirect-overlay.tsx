import { Loader2, BookOpen } from "lucide-react"

import type { TranslationFn } from "@/components/auth/auth-form/types"

interface RedirectOverlayProps {
    t: TranslationFn
}

export function RedirectOverlay({ t }: RedirectOverlayProps) {
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
                    <p className="text-sm text-muted-foreground">Panele yönlendiriliyorsunuz...</p>
                </div>
            </div>
        </div>
    )
}
