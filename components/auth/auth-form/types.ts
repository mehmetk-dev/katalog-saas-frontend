export type LoadingPhase =
    | "idle"
    | "connecting"
    | "authenticating"
    | "creating_account"
    | "redirecting"
    | "slow_connection"
    | "success"

export type TranslationFn = (key: string, params?: Record<string, unknown>) => string

export const getLoadingMessage = (phase: LoadingPhase, t: TranslationFn): string => {
    switch (phase) {
        case "connecting":
            return t("auth.connecting")
        case "authenticating":
            return t("auth.authenticating")
        case "creating_account":
            return t("auth.creatingAccount")
        case "redirecting":
            return t("auth.redirecting")
        case "slow_connection":
            return t("auth.slowConnection")
        case "success":
            return t("auth.success")
        default:
            return ""
    }
}
