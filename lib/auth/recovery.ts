export interface RecoveryRedirectTarget {
    accessToken: string
    refreshToken: string
    redirectPath: string
}

/** Implicit flow'da token'lar hash içinde gelir; reset sayfasına geçmeden önce oturuma çevrilir. */
export function buildRecoveryRedirectTarget(redirectPath: string, hash: string): RecoveryRedirectTarget | null {
    const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash
    const hashParams = new URLSearchParams(normalizedHash)
    const accessToken = hashParams.get("access_token")
    const refreshToken = hashParams.get("refresh_token")

    if (!accessToken || !refreshToken) return null

    return { accessToken, refreshToken, redirectPath }
}
