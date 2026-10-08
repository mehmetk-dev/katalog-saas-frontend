export const DEFAULT_AFTER_LOGIN_PATH = "/dashboard"

/** OAuth/e-posta doğrulama dönüşünde hedef sayfayı taşıyan kısa ömürlü çerez */
export const AUTH_NEXT_COOKIE = "auth_next"
export const AUTH_NEXT_COOKIE_MAX_AGE_SECONDS = 10 * 60

const PROBE_ORIGIN = "http://next-path.invalid"
// Tarayıcılar URL'deki tab/satır sonlarını siler: "/\t/evil.com" → "//evil.com"
// eslint-disable-next-line no-control-regex -- kontrol karakterlerini bilerek reddediyoruz
const UNSAFE_CHARS = /[\\\u0000-\u001f\u007f]/

/**
 * Giriş sonrası yönlendirme hedefini yalnızca aynı origin'deki göreli bir yola izin verecek şekilde temizler.
 * /auth altındaki yollar döngü yaratacağı için kabul edilmez.
 */
export function sanitizeNextPath(raw: string | null | undefined, fallback = DEFAULT_AFTER_LOGIN_PATH): string {
    if (!raw) return fallback

    let value = raw.trim()
    try {
        // Çerezden/encode edilmiş parametreden gelebilir
        if (value.startsWith("%2F") || value.startsWith("%2f")) value = decodeURIComponent(value)
    } catch {
        return fallback
    }

    if (!value.startsWith("/") || value.startsWith("//") || UNSAFE_CHARS.test(value)) return fallback

    try {
        const url = new URL(value, PROBE_ORIGIN)
        if (url.origin !== PROBE_ORIGIN) return fallback
        if (url.pathname === "/auth" || url.pathname.startsWith("/auth/")) return fallback
        return `${url.pathname}${url.search}${url.hash}`
    } catch {
        return fallback
    }
}
