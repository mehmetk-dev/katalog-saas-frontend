"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { AuthMode, AuthState, AuthHandlers } from "./types"

const DEFAULT_API_URL = "http://localhost:4000/api/v1"
const DEFAULT_APP_URL = "http://localhost:3000"
const API_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SHAKE_DURATION_MS = 500
const REDIRECT_DELAY_MS = 800
const PASSWORD_MIN_LENGTH = 6
const GOOGLE_PROVIDER = "google"
const RESET_REDIRECT_PATH = "/auth/confirm-recovery"
const CALLBACK_PATH = "/auth/callback"
const DASHBOARD_PATH = "/dashboard"
const AUTH_VERIFY_PATH = "/auth/verify"
const LOGGED_OUT_PARAM = "logged_out"
const LOGGED_OUT_VALUE = "1"
const PROVIDER_CACHE_TTL_MS = 10_000

type ProviderInfo = {
    exists?: boolean
    isOAuth?: boolean
    provider?: string | null
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

function sanitizeProviderInfo(data: unknown): ProviderInfo {
    if (!data || typeof data !== "object") {
        return { exists: false, isOAuth: false, provider: null }
    }

    const source = data as Record<string, unknown>
    return {
        exists: source.exists === true,
        isOAuth: source.isOAuth === true,
        provider: sanitizeText(source.provider),
    }
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

    const translate = useCallback((key: string, fallback: string): string => {
        const result = t(key)
        return typeof result === "string" && result.trim() ? result : fallback
    }, [t])

    const [mode, setMode] = useState<AuthMode>('signin')
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [showGoogleWarning, setShowGoogleWarning] = useState(false)
    const [shakingFields, setShakingFields] = useState<Record<string, boolean>>({})

    const [name, setName] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const supabase = useMemo(() => createClient(), [])

    const getSiteUrl = useCallback(() => {
        if (typeof window !== "undefined") {
            const origin = window.location.origin
            if (origin.includes("0.0.0.0")) {
                return origin.replace("0.0.0.0", "localhost")
            }
            return origin
        }
        return process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL
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

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (session) {
                setIsRedirecting(true)
                router.replace(DASHBOARD_PATH)
            }
        } catch {
            setIsRedirecting(false)
        }
    }, [router, searchParams, supabase])

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
        }

        const isOtpExpired = params.errorCode === "otp_expired" || (params.urlError === "access_denied" && params.errorCode === "otp_expired")
        if (isOtpExpired) {
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
            } else if (currentPassword.length < PASSWORD_MIN_LENGTH) {
                validationErrors.password = translate("auth.passwordLength", "Şifre en az 6 karakter olmalıdır.")
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
                message: "Yönlendirme URL'i geçersiz. Lütfen yöneticiye bildirin.",
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

    const providerCacheRef = useRef<{ email: string; result: ProviderInfo; ts: number } | null>(null)

    const checkProvider = useCallback(async (emailAddr: string): Promise<ProviderInfo> => {
        const sanitizedEmail = sanitizeText(emailAddr)

        // Return cached result if same email within TTL
        const cached = providerCacheRef.current
        if (cached && cached.email === sanitizedEmail && Date.now() - cached.ts < PROVIDER_CACHE_TTL_MS) {
            return cached.result
        }

        try {
            const response = await fetch(`${API_URL}/auth/check-provider`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: sanitizedEmail }),
            })

            if (!response.ok) {
                return { exists: false, isOAuth: false, provider: null }
            }

            const data: unknown = await response.json()
            const result = sanitizeProviderInfo(data)
            providerCacheRef.current = { email: sanitizedEmail, result, ts: Date.now() }
            return result
        } catch {
            return { exists: false, isOAuth: false, provider: null }
        }
    }, [])

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

    const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
        // Note: e.preventDefault() and setError(null) already called by handleSubmit

        const sanitizedEmail = sanitizeText(email)
        if (!isValidEmail(sanitizedEmail)) {
            setError(translate("auth.invalidEmail", "Geçerli bir e-posta adresi giriniz."))
            return
        }

        setIsLoading(true)
        setShowGoogleWarning(false)

        try {
            const providerInfo = await checkProvider(sanitizedEmail)

            if (!providerInfo.exists) {
                setError(translate("auth.userNotFound", "Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı."))
                return
            }

            if (providerInfo.isOAuth && providerInfo.provider?.toLowerCase() === GOOGLE_PROVIDER) {
                setShowGoogleWarning(true)
                return
            }

            await sendPasswordResetEmail(sanitizedEmail)
            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : translate("auth.errorGeneric", "Bir hata oluştu."))
        } finally {
            setIsLoading(false)
        }
    }, [checkProvider, email, sendPasswordResetEmail, translate])

    const handleSignUp = useCallback(async (sanitizedEmail: string, currentPassword: string, sanitizedName: string, sanitizedCompanyName: string) => {
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
            router.replace(DASHBOARD_PATH)
            return
        }

        if (data.user) {
            router.push(AUTH_VERIFY_PATH)
        }
    }, [getSiteUrl, router, supabase])

    const handleSignIn = useCallback(async (sanitizedEmail: string, currentPassword: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email: sanitizedEmail, password: currentPassword })
        if (error) throw error

        setIsRedirecting(true)
        await new Promise(resolve => setTimeout(resolve, REDIRECT_DELAY_MS))
        router.replace(DASHBOARD_PATH)
    }, [router, supabase])

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
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: GOOGLE_PROVIDER,
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
    }, [getSiteUrl, supabase, translate])

    const handleContinueAnyway = useCallback(async () => {
        setIsLoading(true)
        setShowGoogleWarning(false)

        const sanitizedEmail = sanitizeText(email)
        if (!isValidEmail(sanitizedEmail)) {
            setError(translate("auth.invalidEmail", "Geçerli bir e-posta adresi giriniz."))
            setIsLoading(false)
            return
        }

        try {
            await sendPasswordResetEmail(sanitizedEmail)
            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : translate("auth.errorGeneric", "Bir hata oluştu."))
        } finally {
            setIsLoading(false)
        }
    }, [email, sendPasswordResetEmail, translate])

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
            showPassword, isRedirecting, showGoogleWarning, shakingFields,
            name, companyName, email, password,
        },
        handlers: {
            setMode, setName, setCompanyName, setEmail, setPassword,
            setShowPassword, setError, setFieldErrors, setSuccess,
            handleSubmit, handleGoogleAuth, handleContinueAnyway, resetForm,
        },
        showOnboarding,
        setShowOnboarding,
    }
}
