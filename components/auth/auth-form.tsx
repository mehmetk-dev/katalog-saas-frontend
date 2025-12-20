"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle, WifiOff, RefreshCw, CheckCircle2 } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTranslation } from "@/lib/i18n-provider"
import { cn } from "@/lib/utils"

interface AuthFormProps {
  onSignUpComplete: () => void
}

const getSiteUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

// Loading state messages for better UX
type LoadingPhase = "idle" | "connecting" | "authenticating" | "creating_account" | "redirecting" | "slow_connection" | "success"

const getLoadingMessage = (phase: LoadingPhase, t: (key: string) => string): string => {
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

export function AuthForm({ onSignUpComplete }: AuthFormProps) {
  const router = useRouter()
  const { t, language } = useTranslation()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin"

  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle")
  const [isSlowConnection, setIsSlowConnection] = useState(false)
  const [showRetry, setShowRetry] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Handle URL error parameters from callback
  useEffect(() => {
    const urlError = searchParams.get("error")
    if (urlError) {
      const errorMessages: Record<string, string> = {
        "auth_failed": t("auth.authFailed"),
        "code_expired": t("auth.sessionExpired"),
        "invalid_code": t("auth.invalidCode"),
        "network_error": t("auth.networkError"),
        "unexpected_error": t("auth.unexpectedError"),
        "missing_code": t("auth.missingCode"),
        "could_not_authenticate": t("auth.couldNotAuthenticate"),
        "access_denied": t("auth.accessDenied"),
      }
      setError(errorMessages[urlError] || `${t("auth.errorPrefix")} ${urlError}`)
      setShowRetry(true)

      // Clean URL without refreshing
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("error")
      newUrl.searchParams.delete("error_description")
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams, t])

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const slowConnectionRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const SITE_URL = getSiteUrl()
  const SLOW_CONNECTION_THRESHOLD = 5000 // 5 seconds
  const TIMEOUT_THRESHOLD = 30000 // 30 seconds

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState("")
  const [signInPassword, setSignInPassword] = useState("")

  // Sign Up form state
  const [signUpName, setSignUpName] = useState("")
  const [signUpCompany, setSignUpCompany] = useState("")
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")

  // Monitor online status
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (slowConnectionRef.current) clearTimeout(slowConnectionRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  const startLoadingTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (slowConnectionRef.current) clearTimeout(slowConnectionRef.current)

    setIsSlowConnection(false)
    setShowRetry(false)

    // Slow connection warning after 5 seconds
    slowConnectionRef.current = setTimeout(() => {
      setIsSlowConnection(true)
      setLoadingPhase("slow_connection")
    }, SLOW_CONNECTION_THRESHOLD)

    // Timeout after 30 seconds
    timeoutRef.current = setTimeout(() => {
      setShowRetry(true)
      setError(t("auth.slowOperation"))
      setIsLoading(false)
      setLoadingPhase("idle")
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check online status
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

      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      })

      if (error) {
        clearLoadingTimers()
        if (error.message.includes("Invalid login credentials")) {
          throw new Error(t("auth.invalidCredentials"))
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error(t("auth.emailNotConfirmed"))
        }
        if (error.message.includes("fetch") || error.message.includes("network")) {
          throw new Error(t("auth.networkError"))
        }
        throw error
      }

      // Log activity after successful login
      if (signInData?.user) {
         // Debug log
        try {
          await supabase.from('activity_logs').insert({
            user_id: signInData.user.id,
            user_email: signInData.user.email || signInEmail,
            activity_type: 'user_login',
            description: `${signInData.user.email || signInEmail} sisteme giriş yaptı`,
          })
        } catch (logError) {
          console.error('Activity log error:', logError)
        }
      }

      clearLoadingTimers()
      setLoadingPhase("success")

      // Brief success indication before redirect
      await new Promise(resolve => setTimeout(resolve, 500))

      setLoadingPhase("redirecting")
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      clearLoadingTimers()
      const errorMessage = err instanceof Error ? err.message : t("auth.loginError")
      setError(errorMessage)

      // Show retry button for connection errors
      if (errorMessage.includes("bağlantı") || errorMessage.includes("network") || errorMessage.includes("fetch")) {
        setShowRetry(true)
      }
      setLoadingPhase("idle")
    } finally {
      if (loadingPhase !== "redirecting") {
        setIsLoading(false)
      }
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check online status
    if (!isOnline) {
      setError(t("auth.offlineUser"))
      return
    }

    // Email validation
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

      const { data, error } = await supabase.auth.signUp({
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

      if (error) {
        clearLoadingTimers()
        if (error.message.includes("already registered")) {
          throw new Error(t("auth.alreadyRegistered"))
        }
        if (error.message.includes("Password should be")) {
          throw new Error(t("auth.passwordLength"))
        }
        if (error.message.includes("fetch") || error.message.includes("network")) {
          throw new Error(t("auth.networkError"))
        }
        throw error
      }

      clearLoadingTimers()
      setLoadingPhase("success")

      // Log activity after successful signup
      if (data.user) {
         // Debug log
        try {
          await supabase.from('activity_logs').insert({
            user_id: data.user.id,
            user_email: data.user.email || signUpEmail,
            user_name: signUpName,
            activity_type: 'user_signup',
            description: `${data.user.email || signUpEmail} yeni hesap oluşturdu`,
          })
        } catch (logError) {
          console.error('Activity log error:', logError)
        }
      }

      // Brief success indication before redirect
      await new Promise(resolve => setTimeout(resolve, 500))

      if (data.session) {
        // Email confirmation kapalıysa direkt giriş yap
        setLoadingPhase("redirecting")
        router.push("/dashboard")
        router.refresh()
      } else if (data.user && !data.session) {
        // Email doğrulama gerekiyorsa
        setLoadingPhase("idle")
        setIsLoading(false)
        router.push("/auth/verify")
      }
    } catch (err) {
      clearLoadingTimers()
      const errorMessage = err instanceof Error ? err.message : t("auth.signupError")
      setError(errorMessage)

      // Show retry button for connection errors
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${SITE_URL}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.googleAuthError"))
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{t("auth.welcome")}</h2>
        <p className="text-muted-foreground text-sm">{t("auth.subtitle")}</p>
      </div>

      {/* Offline Status Banner */}
      {!isOnline && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <WifiOff className="h-4 w-4 shrink-0" />
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-sm">{t("auth.offlineTitle")}</span>
            <span className="text-xs opacity-75">{t("auth.offlineDesc")}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Status */}
      {isLoading && loadingPhase !== "idle" && (
        <div className={cn(
          "rounded-lg p-3 sm:p-4 transition-all duration-300",
          isSlowConnection
            ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
            : loadingPhase === "success"
              ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
              : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
        )}>
          <div className="flex items-center gap-2 sm:gap-3">
            {loadingPhase === "success" ? (
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 shrink-0" />
            ) : (
              <Loader2 className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 animate-spin shrink-0",
                isSlowConnection ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
              )} />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-xs sm:text-sm font-medium truncate",
                isSlowConnection
                  ? "text-amber-700 dark:text-amber-300"
                  : loadingPhase === "success"
                    ? "text-green-700 dark:text-green-300"
                    : "text-blue-700 dark:text-blue-300"
              )}>
                {getLoadingMessage(loadingPhase, t)}
              </p>
              {isSlowConnection && (
                <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">
                  {t("auth.slowOperationShort")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-sm leading-relaxed">{error}</span>
            {showRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null)
                  setShowRetry(false)
                }}
                className="shrink-0 h-7 px-2 text-xs bg-transparent border-destructive/50 hover:bg-destructive/10 w-full sm:w-auto mt-1 sm:mt-0"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {t("auth.retry")}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {message && (
        <Alert className="animate-in fade-in slide-in-from-top-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">{message}</AlertDescription>
        </Alert>
      )}

      <Button
        variant="outline"
        className="w-full h-10 sm:h-11 bg-transparent text-sm sm:text-base"
        onClick={handleGoogleAuth}
        disabled={isLoading || isGoogleLoading || !isOnline}
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
        ) : (
          <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span className="truncate">{t("auth.continueWithGoogle")}</span>
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t("auth.or")}</span>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">{t("auth.signin")}</TabsTrigger>
          <TabsTrigger value="signup">{t("auth.signup")}</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="space-y-4 mt-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">{t("auth.email")}</Label>
              <Input suppressHydrationWarning
                id="signin-email"
                type="email"
                placeholder="ornek@email.com"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">{t("auth.password")}</Label>
                <a href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </a>
              </div>
              <Input suppressHydrationWarning
                id="signin-password"
                type="password"
                placeholder="••••••••"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isLoading || isGoogleLoading || !isOnline}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
              <span className="truncate">
                {isLoading ? getLoadingMessage(loadingPhase, t) || t("auth.signin") : t("auth.signin")}
              </span>
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4 mt-4">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">{t("auth.name")}</Label>
                <Input suppressHydrationWarning
                  id="signup-name"
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-company">{t("auth.company")}</Label>
                <Input suppressHydrationWarning
                  id="signup-company"
                  type="text"
                  placeholder="Şirket A.Ş."
                  required
                  value={signUpCompany}
                  onChange={(e) => setSignUpCompany(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">{t("auth.email")}</Label>
              <Input suppressHydrationWarning
                id="signup-email"
                type="email"
                placeholder="ornek@email.com"
                required
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">{t("auth.password")}</Label>
              <Input suppressHydrationWarning
                id="signup-password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">{t("auth.passwordLength")}</p>
            </div>
            <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isLoading || isGoogleLoading || !isOnline}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
              <span className="truncate">
                {isLoading ? getLoadingMessage(loadingPhase, t) || t("auth.createAccount") : t("auth.createAccount")}
              </span>
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <p className="text-center text-xs text-muted-foreground">
        {language === "tr" ? (
          <>
            Devam ederek{" "}
            <a href="/terms" className="text-primary hover:underline">
              {t("auth.terms")}
            </a>{" "}
            ve{" "}
            <a href="/privacy" className="text-primary hover:underline">
              {t("auth.privacy")}
            </a>
            {"'"}nı kabul etmiş olursunuz.
          </>
        ) : (
          <>
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline">
              {t("auth.terms")}
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary hover:underline">
              {t("auth.privacy")}
            </a>.
          </>
        )}
      </p>
    </div>
  )
}
