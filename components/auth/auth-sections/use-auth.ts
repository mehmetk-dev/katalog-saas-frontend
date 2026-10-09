"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
    AUTH_NEXT_COOKIE,
    AUTH_NEXT_COOKIE_MAX_AGE_SECONDS,
    DEFAULT_AFTER_LOGIN_PATH,
    sanitizeNextPath,
} from "@/lib/auth/next-path"
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { AuthMode, AuthState, AuthHandlers } from "./types"

const DEFAULT_APP_URL = "http://localhost:3000"
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SHAKE_DURATION_MS = 500
const REDIRECT_DELAY_MS = 800
const RESET_REDIRECT_PATH = "/auth/confirm-recovery"
const CALLBACK_PATH = "/auth/callback"
const AUTH_VERIFY_PATH = "/auth/verify"
const LOGGED_OUT_PARAM = "logged_out"
const LOGGED_OUT_VALUE = "1"
const SESSION_PARAM = "session"
const SESSION_EXPIRED_VALUE = "expired"

function parseAuthMode(value: string | null): AuthMode {
    return value === "signup" || value === "forgot-password" ? value : "signin"
}

type AuthUrlErrorParams = {
    urlError: string
    errorCode: string
    errorDescription: string
}

function sanitizeText(value: unknown): string {
    return typeof value === "string" ? value.trim() : ""
}

function sanitizeErrorToken(value: unknown): string {
    return sanitizeText(value).toLowerCase()
}

function safeDecodeURIComponent(value: string): string {
    try {
        return decodeURIComponent(value)
    } catch {
        return value
    }
}

function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email)
}

function includesAny(text: string, terms: string[]): boolean {
    return terms.some(term => text.includes(term))
}

/** OAuth/e-posta doğrulaması callback'e döndüğünde hedef sayfayı callback route'u okur */
function rememberNextPath(nextPath: string): void {
    if (typeof document === "undefined") return
    if (nextPath === DEFAULT_AFTER_LOGIN_PATH) {
        document.cookie = `${AUTH_NEXT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`
        return
    }
    document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(nextPath)}; Max-Age=${AUTH_NEXT_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
}

function extractAuthErrorParams(url: URL, searchParams: ReturnType<typeof useSearchParams>): AuthUrlErrorParams {
    const hashParams = new URLSearchParams(url.hash.substring(1))

    return {
        urlError: sanitizeErrorToken(url.searchParams.get("error") || hashParams.get("error") || searchParams.get("error")),
        errorCode: sanitizeErrorToken(url.searchParams.get("error_code") || hashParams.get("error_code") || searchParams.get("error_code")),
        errorDescription: sanitizeText(url.searchParams.get("error_description") || hashParams.get("error_description") || searchParams.get("error_description")),
    }
}

function removeAuthErrorParamsFromUrl(url: URL): void {
    const keys = ["error", "error_code", "error_description"]
    keys.forEach(key => url.searchParams.delete(key))

    if (!url.hash) return

    const hashParams = new URLSearchParams(url.hash.substring(1))
    keys.forEach(key => hashParams.delete(key))
    const nextHash = hashParams.toString()
    url.hash = nextHash ? `#${nextHash}` : ""
}

export function useAuth(): { state: AuthState; handlers: AuthHandlers; showOnboarding: boolean; setShowOnboarding: (v: boolean) => void } {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useTranslation()
    const nextPath = useMemo(() => sanitizeNextPath(searchParams.get("next")), [searchParams])

    const translate = useCallback((key: string, fallback: string): string => {
        const result = t(key)
        return typeof result === "string" && result.trim() ? result : fallback
    }, [t])

    // /auth?tab=signup (landing CTA'ları) ve /auth?tab=forgot-password doğrudan ilgili formu açar
    const [mode, setMode] = useState<AuthMode>(() => parseAuthMode(searchParams.get("tab")))
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [shakingFields, setShakingFields] = useState<Record<string, boolean>>({})

    const [name, setName] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const supabase = useMemo(() => createClient(), [])

    const getSiteUrl = useCallback(() => {
        const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

        // In production, always prefer canonical app URL to avoid localhost redirects.
        if (process.env.NODE_ENV === "production" && envUrl) {
            return envUrl
        }

        if (typeof window !== "undefined") {
            const origin = window.location.origin
            if (origin.includes("0.0.0.0")) {
                return origin.replace("0.0.0.0", "localhost")
            }
            return origin
        }
        return envUrl || DEFAULT_APP_URL
    }, [])

    const handleAuthSessionRedirect = useCallback(async () => {
        if (searchParams.get(LOGGED_OUT_PARAM) === LOGGED_OUT_VALUE) {
            try {
                await supabase.auth.signOut()
            } catch {
                // Kullanıcı deneyimini bozmamak için sessizce devam edilir.
            }

            if (typeof window !== "undefined") {
                const cleanUrl = new URL(window.location.href)
                cleanUrl.searchParams.delete(LOGGED_OUT_PARAM)
                window.history.replaceState({}, "", cleanUrl.toString())
            }

            return
        }

        // Middleware veya backend oturumu geçersiz buldu: tarayıcıdaki kopyası da kapatılır,
        // yoksa aşağıdaki kontrol kullanıcıyı ölü oturumla tekrar panele gönderirdi.
        if (searchParams.get(SESSION_PARAM) === SESSION_EXPIRED_VALUE) {
            try {
                await supabase.auth.signOut({ scope: "local" })
            } catch {
                // Sunucuda zaten geçersiz olabilir; yerel oturum yine de temizlenir.
            }

            setError(translate("auth.sessionExpired", "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın."))

            if (typeof window !== "undefined") {
                const cleanUrl = new URL(window.location.href)
                cleanUrl.searchParams.delete(SESSION_PARAM)
                window.history.replaceState({}, "", cleanUrl.toString())
            }

            return
        }

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (session) {
                setIsRedirecting(true)
                router.replace(nextPath)
            }
        } catch {
            setIsRedirecting(false)
        }
    }, [nextPath, router, searchParams, supabase, translate])

    const resolveUrlErrorMessage = useCallback((params: AuthUrlErrorParams): { message: string; setForgotPasswordMode: boolean } | null => {
        const passwordResetExpiredMessage = translate(
            "auth.passwordResetLinkExpired",
            "Şifre sıfırlama linkinizin süresi dolmuş. Lütfen yeni bir şifre sıfırlama linki isteyin.",
        )
        const codeOrUrlErrorMap: Record<string, string> = {
            code_expired: translate("auth.sessionExpired", "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın."),
            auth_failed: translate("auth.authFailed", "Kimlik doğrulama başarısız oldu."),
            invalid_code: translate("auth.invalidCode", "Geçersiz kod."),
            network_error: translate("auth.networkError", "Ağ hatası oluştu."),
            missing_code: translate("auth.missingCode", "Kod bulunamadı."),
            rate_limited: translate("auth.tooManyAttempts", "Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin."),
            unexpected_error: translate("auth.unexpectedError", "Beklenmeyen bir hata oluştu."),
        }

        const isOtpExpired = params.errorCode === "otp_expired" || (params.urlError === "access_denied" && params.errorCode === "otp_expired")
        if (isOtpExpired || params.urlError === "invalid_link") {
            return { message: passwordResetExpiredMessage, setForgotPasswordMode: true }
        }

        const descriptionLower = params.errorDescription.toLowerCase()
        const hasExpiredOrInvalidDescription = includesAny(descriptionLower, ["expired", "invalid"])

        if (params.urlError === "access_denied" && hasExpiredOrInvalidDescription) {
            return { message: passwordResetExpiredMessage, setForgotPasswordMode: true }
        }

        const mappedCodeMessage = codeOrUrlErrorMap[params.errorCode]
        if (mappedCodeMessage) {
            return { message: mappedCodeMessage, setForgotPasswordMode: false }
        }

        const mappedUrlMessage = codeOrUrlErrorMap[params.urlError]
        if (mappedUrlMessage) {
            return { message: mappedUrlMessage, setForgotPasswordMode: false }
        }

        if (params.urlError === "access_denied") {
            return {
                message: translate("auth.accessDenied", "Erişim reddedildi."),
                setForgotPasswordMode: false,
            }
        }

        if (params.errorDescription) {
            return {
                message: safeDecodeURIComponent(params.errorDescription),
                setForgotPasswordMode: hasExpiredOrInvalidDescription,
            }
        }

        if (params.urlError) {
            return {
                message: `${translate("auth.errorPrefix", "Hata")} ${params.urlError}`,
                setForgotPasswordMode: false,
            }
        }

        return null
    }, [translate])

    const validateAuthFields = useCallback((currentMode: AuthMode, currentEmail: string, currentPassword: string, currentName: string): Record<string, string> => {
        const validationErrors: Record<string, string> = {}

        if (!isValidEmail(currentEmail)) {
            validationErrors.email = translate("auth.invalidEmail", "Geçerli bir e-posta adresi giriniz.")
        }

        if (currentMode !== "forgot-password") {
            if (!currentPassword) {
                validationErrors.password = translate("auth.passwordRequired", "Lütfen şifrenizi giriniz.")
            } else if (currentMode === "signup" && currentPassword.length < PASSWORD_MIN_LENGTH) {
                // Giriş ekranında uzunluk kontrolü yapılmaz: eski (daha kısa) şifreler de çalışmalı
                validationErrors.password = translate("auth.passwordLength", `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`)
            }
        }

        if (currentMode === "signup" && !currentName) {
            validationErrors.name = translate("auth.nameRequired", "Lütfen adınızı ve soyadınızı giriniz.")
        }

        return validationErrors
    }, [translate])

    const applyFieldValidationErrors = useCallback((validationErrors: Record<string, string>) => {
        setFieldErrors(validationErrors)

        const newShakingFields = Object.keys(validationErrors).reduce<Record<string, boolean>>((acc, key) => {
            acc[key] = true
            return acc
        }, {})

        setShakingFields(newShakingFields)
        window.setTimeout(() => {
            setShakingFields({})
        }, SHAKE_DURATION_MS)
    }, [])

    const buildResetPasswordErrorMessage = useCallback((errorMessage: string): string => {
        const loweredMessage = errorMessage.toLowerCase()
        const resetErrorStrategies: Array<{ matcher: (msg: string) => boolean; message: string }> = [
            {
                matcher: msg => includesAny(msg, ["rate limit", "too many"]),
                message: translate("auth.resetPasswordTooManyRequests", "Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin."),
            },
            {
                matcher: msg => msg.includes("email"),
                message: translate("auth.resetPasswordEmailSendFailed", "E-posta gönderilemedi. Lütfen e-posta adresinizi kontrol edin veya daha sonra tekrar deneyin."),
            },
            {
                matcher: msg => msg.includes("redirect"),
                message: translate("auth.resetPasswordRedirectInvalid", "Yönlendirme adresi geçersiz. Lütfen destek ile iletişime geçin."),
            },
        ]

        const matchedStrategy = resetErrorStrategies.find(strategy => strategy.matcher(loweredMessage))
        return matchedStrategy?.message || errorMessage || translate("auth.errorGeneric", "Bir hata oluştu.")
    }, [translate])

    const mapSubmitErrorMessage = useCallback((error: unknown): string => {
        const fallback = translate("auth.errorGeneric", "Bir hata oluştu.")
        if (!(error instanceof Error)) {
            return fallback
        }

        const lowered = error.message.toLowerCase()
        const submitErrorStrategies: Array<{ matcher: (msg: string) => boolean; message: string }> = [
            {
                matcher: msg => includesAny(msg, ["invalid login credentials", "invalid credentials"]),
                message: translate("auth.invalidCredentials", "E-posta veya şifre hatalı."),
            },
            {
                matcher: msg => includesAny(msg, ["user already registered", "already registered"]),
                message: translate("auth.alreadyRegistered", "Bu e-posta zaten kayıtlı."),
            },
            {
                matcher: msg => msg.includes("email not confirmed"),
                message: translate("auth.emailNotConfirmed", "E-posta adresinizi doğrulayın."),
            },
            {
                matcher: msg => includesAny(msg, ["failed to fetch", "fetch failed", "networkerror", "network request failed", "load failed"]),
                message: translate("auth.networkError", "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin."),
            },
            {
                matcher: msg => includesAny(msg, ["rate limit", "too many requests"]),
                message: translate("auth.tooManyAttempts", "Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyiniz."),
            },
        ]

        const matchedStrategy = submitErrorStrategies.find(strategy => strategy.matcher(lowered))
        return matchedStrategy?.message || error.message || fallback
    }, [translate])

    const sendPasswordResetEmail = useCallback(async (targetEmail: string) => {
        const redirectUrl = `${getSiteUrl()}${RESET_REDIRECT_PATH}`

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
            redirectTo: redirectUrl,
        })

        if (resetError) {
            throw new Error(buildResetPasswordErrorMessage(resetError.message))
        }
    }, [buildResetPasswordErrorMessage, getSiteUrl, supabase])

    useEffect(() => {
        handleAuthSessionRedirect()
    }, [handleAuthSessionRedirect])

    useEffect(() => {
        if (typeof window === "undefined") return

        const handleFocus = () => {
            setIsGoogleLoading(false)
            setIsLoading(false)
        }

        window.addEventListener("focus", handleFocus)

        return () => {
            window.removeEventListener("focus", handleFocus)
        }
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return

        const url = new URL(window.location.href)

        const authErrorParams = extractAuthErrorParams(url, searchParams)
        if (authErrorParams.urlError || authErrorParams.errorCode) {
            const resolvedError = resolveUrlErrorMessage(authErrorParams)

            if (resolvedError) {
                setError(resolvedError.message)
                if (resolvedError.setForgotPasswordMode) {
                    setMode("forgot-password")
                }
            }

            removeAuthErrorParamsFromUrl(url)
            window.history.replaceState({}, "", url.toString())
        }
    }, [resolveUrlErrorMessage, searchParams])

    const handleForgotPassword = useCallback(async (_e: React.FormEvent) => {
        // Note: e.preventDefault() and setError(null) already called by handleSubmit

        const sanitizedEmail = sanitizeText(email)
        if (!isValidEmail(sanitizedEmail)) {
            setError(translate("auth.invalidEmail", "Geçerli bir e-posta adresi giriniz."))
            return
        }

        setIsLoading(true)

        try {
            await sendPasswordResetEmail(sanitizedEmail)
            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : translate("auth.errorGeneric", "Bir hata oluştu."))
        } finally {
            setIsLoading(false)
        }
    }, [email, sendPasswordResetEmail, translate])

    const handleSignUp = useCallback(async (sanitizedEmail: string, currentPassword: string, sanitizedName: string, sanitizedCompanyName: string) => {
        rememberNextPath(nextPath)
        const { data, error } = await supabase.auth.signUp({
            email: sanitizedEmail,
            password: currentPassword,
            options: {
                emailRedirectTo: `${getSiteUrl()}${CALLBACK_PATH}`,
                data: {
                    full_name: sanitizedName,
                    company_name: sanitizedCompanyName,
                },
            },
        })
        if (error) throw error

        if (data.session) {
            setIsRedirecting(true)
            await new Promise(resolve => setTimeout(resolve, REDIRECT_DELAY_MS))
            router.replace(nextPath)
            return
        }

        if (data.user) {
            router.push(AUTH_VERIFY_PATH)
        }
    }, [getSiteUrl, nextPath, router, supabase])

    const handleSignIn = useCallback(async (sanitizedEmail: string, currentPassword: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email: sanitizedEmail, password: currentPassword })
        if (error) throw error

        setIsRedirecting(true)
        await new Promise(resolve => setTimeout(resolve, REDIRECT_DELAY_MS))
        router.replace(nextPath)
    }, [nextPath, router, supabase])

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setFieldErrors({})

        const sanitizedEmail = sanitizeText(email)
        const sanitizedName = sanitizeText(name)
        const sanitizedCompanyName = sanitizeText(companyName)
        const validationErrors = validateAuthFields(mode, sanitizedEmail, password, sanitizedName)

        if (Object.keys(validationErrors).length > 0) {
            applyFieldValidationErrors(validationErrors)
            return
        }

        if (mode === "forgot-password") {
            return handleForgotPassword(e)
        }

        setIsLoading(true)

        try {
            if (mode === "signup") {
                await handleSignUp(sanitizedEmail, password, sanitizedName, sanitizedCompanyName)
            } else {
                await handleSignIn(sanitizedEmail, password)
            }
        } catch (err: unknown) {
            setError(mapSubmitErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }, [
        applyFieldValidationErrors,
        companyName,
        email,
        handleForgotPassword,
        handleSignIn,
        handleSignUp,
        mapSubmitErrorMessage,
        mode,
        name,
        password,
        validateAuthFields,
    ])

    const handleGoogleAuth = useCallback(async () => {
        setIsGoogleLoading(true)
        setError(null)

        try {
            rememberNextPath(nextPath)
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${getSiteUrl()}${CALLBACK_PATH}`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                    },
                },
            })

            if (oauthError) {
                setError(oauthError.message)
                setIsGoogleLoading(false)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : translate("auth.googleAuthError", "Google ile giriş yaparken bir hata oluştu."))
            setIsGoogleLoading(false)
        }
    }, [getSiteUrl, nextPath, supabase, translate])

    const resetForm = useCallback(() => {
        setError(null)
        setFieldErrors({})
        setEmail("")
        setPassword("")
        setName("")
        setCompanyName("")
    }, [])

    return {
        state: {
            mode, isLoading, isGoogleLoading, error, fieldErrors, success,
            showPassword, isRedirecting, shakingFields,
            name, companyName, email, password,
        },
        handlers: {
            setMode, setName, setCompanyName, setEmail, setPassword,
            setShowPassword, setError, setFieldErrors, setSuccess,
            handleSubmit, handleGoogleAuth, resetForm,
        },
        showOnboarding,
        setShowOnboarding,
    }
}
