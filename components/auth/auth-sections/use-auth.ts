"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/i18n-provider"
import type { AuthMode, AuthState, AuthHandlers } from "./types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

export function useAuth(): { state: AuthState; handlers: AuthHandlers; showOnboarding: boolean; setShowOnboarding: (v: boolean) => void } {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useTranslation()

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

    // URL error handling + session check
    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setIsRedirecting(true)
                router.push("/dashboard")
                router.refresh()
            }
        }
        checkSession()

        const handleFocus = () => {
            setIsGoogleLoading(false)
            setIsLoading(false)
        }
        window.addEventListener("focus", handleFocus)

        if (typeof window === "undefined") return

        const url = new URL(window.location.href)
        const urlError = url.searchParams.get("error") || new URLSearchParams(url.hash.substring(1)).get("error") || searchParams.get("error")
        const errorCode = url.searchParams.get("error_code") || new URLSearchParams(url.hash.substring(1)).get("error_code") || searchParams.get("error_code")
        const errorDescription = url.searchParams.get("error_description") || new URLSearchParams(url.hash.substring(1)).get("error_description") || searchParams.get("error_description")

        if (typeof window !== "undefined") {
            (window as Window & { __authErrorCheck?: unknown }).__authErrorCheck = {
                urlError, errorCode, errorDescription,
                fullUrl: window.location.href, search: url.search, hash: url.hash, timestamp: Date.now()
            }
        }

        if (urlError || errorCode) {
            if (typeof window !== "undefined") {
                (window as Window & { __authError?: unknown }).__authError = { urlError, errorCode, errorDescription, timestamp: Date.now() }
            }

            let errorMessage: string | null = null

            if (errorCode === "otp_expired" || (urlError === "access_denied" && errorCode === "otp_expired")) {
                errorMessage = "Şifre sıfırlama linkinizin süresi dolmuş. Lütfen yeni bir şifre sıfırlama linki isteyin."
                setMode('forgot-password')
            } else if (urlError === "access_denied" && errorDescription && (errorDescription.includes("expired") || errorDescription.includes("invalid"))) {
                errorMessage = "Şifre sıfırlama linkinizin süresi dolmuş. Lütfen yeni bir şifre sıfırlama linki isteyin."
                setMode('forgot-password')
            } else if (errorCode === "code_expired" || urlError === "code_expired") {
                errorMessage = (t("auth.sessionExpired") as string) || "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın."
            } else if (urlError === "auth_failed") {
                errorMessage = (t("auth.authFailed") as string) || "Kimlik doğrulama başarısız oldu."
            } else if (urlError === "invalid_code") {
                errorMessage = (t("auth.invalidCode") as string) || "Geçersiz kod."
            } else if (urlError === "network_error") {
                errorMessage = (t("auth.networkError") as string) || "Ağ hatası oluştu."
            } else if (urlError === "missing_code") {
                errorMessage = (t("auth.missingCode") as string) || "Kod bulunamadı."
            } else if (urlError === "access_denied") {
                if (errorDescription && errorDescription.includes("expired")) {
                    errorMessage = "Şifre sıfırlama linkinizin süresi dolmuş. Lütfen yeni bir şifre sıfırlama linki isteyin."
                    setMode('forgot-password')
                } else {
                    errorMessage = (t("auth.accessDenied") as string) || "Erişim reddedildi."
                }
            } else if (errorDescription) {
                errorMessage = decodeURIComponent(errorDescription)
                if (errorDescription.toLowerCase().includes("expired") || errorDescription.toLowerCase().includes("invalid")) {
                    setMode('forgot-password')
                }
            } else if (urlError) {
                errorMessage = `${(t("auth.errorPrefix") as string) || "Hata"} ${urlError}`
            }

            if (errorMessage) {
                setError(String(errorMessage))
                if (typeof window !== "undefined") {
                    (window as Window & { __authErrorMessage?: string }).__authErrorMessage = String(errorMessage)
                }
            }

            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete("error")
            newUrl.searchParams.delete("error_code")
            newUrl.searchParams.delete("error_description")

            if (newUrl.hash) {
                const hashParams = new URLSearchParams(newUrl.hash.substring(1))
                hashParams.delete("error")
                hashParams.delete("error_code")
                hashParams.delete("error_description")
                const newHash = hashParams.toString()
                newUrl.hash = newHash ? `#${newHash}` : ""
            }

            window.history.replaceState({}, "", newUrl.toString())
        }

        return () => {
            window.removeEventListener("focus", handleFocus)
        }
    }, [searchParams, t, router])

    const getSiteUrl = () => {
        if (typeof window !== "undefined") {
            return window.location.origin
        }
        return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }

    const checkProvider = async (emailAddr: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/check-provider`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailAddr }),
            })
            const data = await response.json()
            return data
        } catch {
            return { isOAuth: false, provider: null }
        }
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!email) {
            setError(t("auth.invalidEmail") as string)
            return
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError(t("auth.invalidEmail") as string)
            return
        }

        setIsLoading(true)
        setShowGoogleWarning(false)

        const providerInfo = await checkProvider(email)

        if (!providerInfo.exists) {
            setError("Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.")
            setIsLoading(false)
            return
        }

        if (providerInfo.isOAuth && providerInfo.provider === "google") {
            setShowGoogleWarning(true)
            setIsLoading(false)
            return
        }

        const supabase = createClient()
        try {
            const SITE_URL = getSiteUrl()
            const redirectUrl = `${SITE_URL}/auth/confirm-recovery`

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            })

            if (error) {
                console.error("[AuthPageClient] Supabase error:", error)

                let errorMessage: string = (error instanceof Error ? error.message : null) || t("auth.errorGeneric")

                if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
                    errorMessage = "Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin."
                } else if (error.message?.includes('email')) {
                    errorMessage = "E-posta gönderilemedi. Lütfen e-posta adresinizi kontrol edin veya daha sonra tekrar deneyin."
                } else if (error.message?.includes('redirect')) {
                    errorMessage = "Yönlendirme URL'i geçersiz. Lütfen yöneticiye bildirin."
                }

                throw new Error(errorMessage as string)
            }

            setSuccess(true)
        } catch (err) {
            console.error("[AuthPageClient] Error:", err)
            setError(err instanceof Error ? err.message : (t("auth.errorGeneric") as string))
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setFieldErrors({})

        let hasError = false
        const newFieldErrors: Record<string, string> = {}

        if (!email) {
            newFieldErrors.email = t("auth.invalidEmail") as string
            hasError = true
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                newFieldErrors.email = t("auth.invalidEmail") as string
                hasError = true
            }
        }

        if (mode !== 'forgot-password') {
            if (!password) {
                newFieldErrors.password = "Lütfen şifrenizi giriniz."
                hasError = true
            } else if (password.length < 6) {
                newFieldErrors.password = t("auth.passwordLength") as string
                hasError = true
            }
        }

        if (mode === 'signup' && !name) {
            newFieldErrors.name = "Lütfen adınızı ve soyadınızı giriniz."
            hasError = true
        }

        if (hasError) {
            setFieldErrors(newFieldErrors)

            const newShakingFields: Record<string, boolean> = {}
            Object.keys(newFieldErrors).forEach(key => {
                newShakingFields[key] = true
            })
            setShakingFields(newShakingFields)

            setTimeout(() => {
                setShakingFields({})
            }, 500)
            return
        }

        if (mode === 'forgot-password') return handleForgotPassword(e)

        setIsLoading(true)
        const supabase = createClient()

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
                        data: {
                            full_name: name,
                            company_name: companyName
                        },
                    },
                })
                if (error) throw error

                if (data.session) {
                    setIsRedirecting(true)
                    await new Promise(r => setTimeout(r, 800))
                    router.push("/dashboard")
                    router.refresh()
                } else if (data.user) {
                    router.push("/auth/verify")
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error

                setIsRedirecting(true)
                await new Promise(r => setTimeout(r, 800))
                router.push("/dashboard")
                router.refresh()
            }
        } catch (err: any) {
            console.error("[AuthPageClient] Submit error:", err)
            let errorMessage = t("auth.errorGeneric") as string

            const message = err?.message?.toLowerCase() || ""

            if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
                errorMessage = t("auth.invalidCredentials") as string
            } else if (message.includes("user already registered") || message.includes("already registered")) {
                errorMessage = t("auth.alreadyRegistered") as string
            } else if (message.includes("email not confirmed")) {
                errorMessage = t("auth.emailNotConfirmed") as string
            } else if (message.includes("rate limit") || message.includes("too many requests")) {
                errorMessage = "Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyiniz."
            } else if (err?.message) {
                errorMessage = err.message
            }

            setError(errorMessage)
            setIsLoading(false)
        }
    }

    const handleGoogleAuth = async () => {
        setIsGoogleLoading(true)
        setError(null)
        const supabase = createClient()
        try {
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${getSiteUrl()}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                    }
                },
            })

            if (oauthError) {
                console.error("OAuth Error:", oauthError)
                setError(oauthError.message)
                setIsGoogleLoading(false)
            }
        } catch (err) {
            console.error("Google Auth Exception:", err)
            setError(err instanceof Error ? err.message : "Google ile giriş yaparken bir hata oluştu.")
            setIsGoogleLoading(false)
        }
    }

    const handleContinueAnyway = async () => {
        setIsLoading(true)
        setShowGoogleWarning(false)
        const supabase = createClient()
        try {
            const SITE_URL = getSiteUrl()
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${SITE_URL}/auth/confirm-recovery`,
            })
            if (error) throw error
            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : String(t("auth.errorGeneric")))
        } finally {
            setIsLoading(false)
        }
    }

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
