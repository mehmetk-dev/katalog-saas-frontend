"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { LoadingPhase } from "@/components/auth/auth-form/types"

const getSiteUrl = () => {
    if (typeof window !== "undefined") {
        const origin = window.location.origin
        if (origin.includes("0.0.0.0")) {
            return origin.replace("0.0.0.0", "localhost")
        }
        return origin
    }
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

export function useAuthFormController() {
    const router = useRouter()
    const { t, language } = useTranslation()
    const searchParams = useSearchParams()
    const defaultTab: "signin" | "signup" = searchParams.get("tab") === "signup" ? "signup" : "signin"

    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle")
    const [isSlowConnection, setIsSlowConnection] = useState(false)
    const [showRetry, setShowRetry] = useState(false)
    const [isOnline, setIsOnline] = useState(true)
    const [isRedirecting, setIsRedirecting] = useState(false)

    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const slowConnectionRef = useRef<NodeJS.Timeout | null>(null)
    const isRedirectingRef = useRef(false)

    const SITE_URL = getSiteUrl()
    const SLOW_CONNECTION_THRESHOLD = 5000
    const TIMEOUT_THRESHOLD = 30000

    const [signInEmail, setSignInEmail] = useState("")
    const [signInPassword, setSignInPassword] = useState("")

    const [signUpName, setSignUpName] = useState("")
    const [signUpCompany, setSignUpCompany] = useState("")
    const [signUpEmail, setSignUpEmail] = useState("")
    const [signUpPassword, setSignUpPassword] = useState("")

    useEffect(() => {
        const urlError = searchParams.get("error")
        if (urlError) {
            const errorMessages: Record<string, string> = {
                auth_failed: t("auth.authFailed"),
                code_expired: t("auth.sessionExpired"),
                invalid_code: t("auth.invalidCode"),
                network_error: t("auth.networkError"),
                unexpected_error: t("auth.unexpectedError"),
                missing_code: t("auth.missingCode"),
                could_not_authenticate: t("auth.couldNotAuthenticate"),
                access_denied: t("auth.accessDenied"),
            }
            setError(errorMessages[urlError] || t("auth.unexpectedError"))
            setShowRetry(true)

            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete("error")
            newUrl.searchParams.delete("error_description")
            window.history.replaceState({}, "", newUrl.toString())
        }
    }, [searchParams, t])

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            setError(null)
        }
        const handleOffline = () => {
            setIsOnline(false)
            setError(t("auth.offlineUser"))
            setIsLoading(false)
            setLoadingPhase("idle")
        }

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)
        setIsOnline(navigator.onLine)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [t])

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            if (slowConnectionRef.current) clearTimeout(slowConnectionRef.current)
        }
    }, [])

    const startLoadingTimers = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (slowConnectionRef.current) clearTimeout(slowConnectionRef.current)

        setIsSlowConnection(false)
        setShowRetry(false)

        slowConnectionRef.current = setTimeout(() => {
            setIsSlowConnection(true)
            setLoadingPhase("slow_connection")
        }, SLOW_CONNECTION_THRESHOLD)

        timeoutRef.current = setTimeout(() => {
            setShowRetry(true)
            setError(t("auth.slowOperation"))
            setIsLoading(false)
            setLoadingPhase("idle")
        }, TIMEOUT_THRESHOLD)
    }, [t])

    const clearLoadingTimers = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        if (slowConnectionRef.current) {
            clearTimeout(slowConnectionRef.current)
            slowConnectionRef.current = null
        }
        setIsSlowConnection(false)
    }, [])

    useEffect(() => {
        const handleFocus = () => {
            setIsGoogleLoading(false)
        }

        window.addEventListener("focus", handleFocus)
        setIsGoogleLoading(false)

        return () => {
            window.removeEventListener("focus", handleFocus)
        }
    }, [])

    const handleSignIn = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!isOnline) {
            setError(t("auth.offlineUser"))
            return
        }

        setIsLoading(true)
        setError(null)
        setShowRetry(false)
        setLoadingPhase("connecting")
        startLoadingTimers()

        const supabase = createClient()

        try {
            setLoadingPhase("authenticating")

            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: signInEmail,
                password: signInPassword,
            })

            if (signInError) {
                clearLoadingTimers()
                if (signInError.message.includes("Invalid login credentials")) {
                    throw new Error(t("auth.invalidCredentials"))
                }
                if (signInError.message.includes("Email not confirmed")) {
                    throw new Error(t("auth.emailNotConfirmed"))
                }
                if (signInError.message.includes("fetch") || signInError.message.includes("network")) {
                    throw new Error(t("auth.networkError"))
                }
                throw signInError
            }

            if (signInData?.user) {
                try {
                    await supabase.from("activity_logs").insert({
                        user_id: signInData.user.id,
                        user_email: signInData.user.email || signInEmail,
                        activity_type: "user_login",
                        description: "Kullanıcı sisteme giriş yaptı",
                    })
                } catch (logError) {
                    console.error("Activity log error:", logError)
                }
            }

            clearLoadingTimers()
            setLoadingPhase("success")

            await new Promise((resolve) => setTimeout(resolve, 500))

            setLoadingPhase("redirecting")
            setIsRedirecting(true)
            isRedirectingRef.current = true

            await new Promise((resolve) => setTimeout(resolve, 300))

            router.push("/dashboard")
            router.refresh()
        } catch (err) {
            clearLoadingTimers()
            const errorMessage = err instanceof Error ? err.message : t("auth.loginError")
            setError(errorMessage)

            if (errorMessage.includes("bağlantı") || errorMessage.includes("network") || errorMessage.includes("fetch")) {
                setShowRetry(true)
            }
            setLoadingPhase("idle")
        } finally {
            if (!isRedirectingRef.current) {
                setIsLoading(false)
            }
        }
    }

    const handleSignUp = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!isOnline) {
            setError(t("auth.offlineUser"))
            return
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailRegex.test(signUpEmail)) {
            setError(t("auth.invalidEmail"))
            return
        }

        setIsLoading(true)
        setError(null)
        setShowRetry(false)
        setLoadingPhase("connecting")
        startLoadingTimers()

        const supabase = createClient()

        try {
            setLoadingPhase("creating_account")

            const { data, error: signUpError } = await supabase.auth.signUp({
                email: signUpEmail,
                password: signUpPassword,
                options: {
                    emailRedirectTo: `${SITE_URL}/auth/callback`,
                    data: {
                        full_name: signUpName,
                        company: signUpCompany,
                    },
                },
            })

            if (signUpError) {
                clearLoadingTimers()
                if (signUpError.message.includes("already registered")) {
                    throw new Error(t("auth.alreadyRegistered"))
                }
                if (signUpError.message.includes("Password should be")) {
                    throw new Error(t("auth.passwordLength"))
                }
                if (signUpError.message.includes("fetch") || signUpError.message.includes("network")) {
                    throw new Error(t("auth.networkError"))
                }
                throw signUpError
            }

            clearLoadingTimers()
            setLoadingPhase("success")

            if (data.user) {
                try {
                    await supabase.from("activity_logs").insert({
                        user_id: data.user.id,
                        user_email: data.user.email || signUpEmail,
                        user_name: signUpName,
                        activity_type: "user_signup",
                        description: "Yeni hesap oluşturuldu",
                    })
                } catch (logError) {
                    console.error("Activity log error:", logError)
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 500))

            if (data.session) {
                setLoadingPhase("redirecting")
                setIsRedirecting(true)
                await new Promise((resolve) => setTimeout(resolve, 300))
                router.push("/dashboard")
                router.refresh()
            } else if (data.user && !data.session) {
                setLoadingPhase("idle")
                setIsLoading(false)
                router.push("/auth/verify")
            }
        } catch (err) {
            clearLoadingTimers()
            const errorMessage = err instanceof Error ? err.message : t("auth.signupError")
            setError(errorMessage)

            if (errorMessage.includes("bağlantı") || errorMessage.includes("network") || errorMessage.includes("fetch")) {
                setShowRetry(true)
            }
            setLoadingPhase("idle")
            setIsLoading(false)
        }
    }

    const handleGoogleAuth = async () => {
        setIsGoogleLoading(true)
        setError(null)

        const supabase = createClient()

        try {
            const { error: googleError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${SITE_URL}/auth/callback`,
                },
            })

            if (googleError) throw googleError
        } catch (err) {
            setError(err instanceof Error ? err.message : t("auth.googleAuthError"))
            setIsGoogleLoading(false)
        }
    }

    const clearError = () => {
        setError(null)
        setShowRetry(false)
    }

    return {
        t,
        language,
        defaultTab,
        isLoading,
        isGoogleLoading,
        error,
        loadingPhase,
        isSlowConnection,
        showRetry,
        isOnline,
        isRedirecting,
        signInEmail,
        signInPassword,
        signUpName,
        signUpCompany,
        signUpEmail,
        signUpPassword,
        setSignInEmail,
        setSignInPassword,
        setSignUpName,
        setSignUpCompany,
        setSignUpEmail,
        setSignUpPassword,
        handleSignIn,
        handleSignUp,
        handleGoogleAuth,
        clearError,
    }
}
