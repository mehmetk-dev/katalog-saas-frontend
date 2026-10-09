"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Eye, EyeOff, Loader2, Shield } from "lucide-react"

import { AuthShell } from "@/components/auth/auth-shell"
import { GoogleIcon } from "@/components/auth/google-icon"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { createClient } from "@/lib/supabase/client"

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

export default function AdminLoginPage() {
    const { t: baseT } = useTranslation()
    const t = (key: string) => baseT(key) as string
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const router = useRouter()

    // Admin girişi açılınca mevcut (müşteri) oturumu kapatılır
    useEffect(() => {
        createClient()
            .auth.signOut()
            .finally(() => setIsReady(true))
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const supabase = createClient()
            const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

            if (authError || !data.user) {
                // Ağ hatası da hata nesnesiyle döner; "şifre hatalı" demek yanıltıcı olur
                const isNetworkError = authError?.name === "AuthRetryableFetchError" || authError?.status === 0
                setError(t(isNetworkError ? "auth.networkError" : "auth.invalidCredentials"))
                return
            }

            const { data: profile } = await supabase.from("users").select("is_admin").eq("id", data.user.id).single()

            if (!profile?.is_admin) {
                await supabase.auth.signOut()
                setError(t("admin.loginNotAdmin"))
                return
            }

            router.push("/admin")
            router.refresh()
        } catch {
            setError(t("auth.unexpectedError"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true)
        setError("")

        try {
            const { error: googleError } = await createClient().auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${getSiteUrl()}/auth/callback?next=/admin` },
            })
            if (googleError) throw googleError
        } catch {
            setError(t("auth.googleAuthError"))
            setIsGoogleLoading(false)
        }
    }

    const busy = isLoading || isGoogleLoading

    return (
        <AuthShell icon={<Shield />} iconTone="brand" title={t("admin.loginTitle")} description={t("admin.loginDesc")}>
            {!isReady ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <form onSubmit={handleLogin} className="space-y-5" noValidate>
                        {error && (
                            <Alert variant="destructive" role="alert" className="border-destructive/30 bg-destructive/5">
                                <AlertCircle />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="admin-email">{t("auth.email")}</Label>
                            <Input
                                id="admin-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                disabled={busy}
                                className="h-11 bg-card"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="admin-password">{t("auth.password")}</Label>
                            <div className="relative">
                                <Input
                                    id="admin-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    disabled={busy}
                                    className="h-11 bg-card pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" size="lg" disabled={busy} className="h-11 w-full text-[15px]">
                            {isLoading && <Loader2 className="size-4 animate-spin" />}
                            {t("auth.signin")}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-background px-3 text-xs text-muted-foreground">{t("auth.or")}</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={handleGoogleLogin}
                        disabled={busy}
                        className="h-11 w-full bg-card text-[15px]"
                    >
                        {isGoogleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                        {t("auth.continueWithGoogle")}
                    </Button>

                    <p className="mt-8 text-center text-xs text-muted-foreground">{t("admin.loginFooter")}</p>
                </>
            )}
        </AuthShell>
    )
}
