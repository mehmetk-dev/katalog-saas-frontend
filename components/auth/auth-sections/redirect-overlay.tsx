import { Loader2 } from "lucide-react"

import type { TranslateFn } from "./types"

export function RedirectOverlay({ t }: { t: TranslateFn }) {
    return (
        <div role="status" className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                    <Loader2 className="size-6 animate-spin text-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{t("auth.redirecting")}</p>
            </div>
        </div>
    )
}
