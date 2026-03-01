// Re-export the unified RedirectOverlay with "minimal" variant as default for auth-sections
import { RedirectOverlay as BaseRedirectOverlay } from "@/components/auth/auth-form/redirect-overlay"
import type { TranslateFn } from "./types"

interface RedirectOverlayProps {
    t: TranslateFn
}

export function RedirectOverlay({ t }: RedirectOverlayProps) {
    return <BaseRedirectOverlay t={t} variant="minimal" />
}
