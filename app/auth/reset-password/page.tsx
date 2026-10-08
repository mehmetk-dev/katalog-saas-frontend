"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react"

import { AuthShell } from "@/components/auth/auth-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isPasswordLongEnough } from "@/lib/auth/password-policy"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { createClient } from "@/lib/supabase/client"

const INVALID_LINK_PATH = "/auth?tab=forgot-password&error=invalid_link"
const SUCCESS_REDIRECT_DELAY_MS = 1500

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t: baseT } = useTranslation()
  const t = (key: string) => baseT(key) as string
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      const supabase = createClient()
      let { data: { session } } = await supabase.auth.getSession()

      // confirm-recovery'den hemen sonra çerez yazımı bir an gecikebilir
      if (!session) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        session = (await supabase.auth.getSession()).data.session
      }

      if (!mounted) return
      if (!session) router.replace(INVALID_LINK_PATH)
      else setIsChecking(false)
    }

    checkSession()
    return () => { mounted = false }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordLongEnough(password)) {
      setError(t("auth.passwordLength"))
      return
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"))
      return
    }

    setIsLoading(true)
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password })
      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => router.replace("/dashboard"), SUCCESS_REDIRECT_DELAY_MS)
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : ""
      setError(message.includes("different") ? t("auth.passwordSameAsOld") : t("auth.passwordUpdateError"))
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <AuthShell icon={<Loader2 className="animate-spin" />} title={t("auth.verifyingSession")} description={t("auth.verifyingSessionDesc")} />
    )
  }

  if (success) {
    return (
      <AuthShell icon={<CheckCircle2 />} iconTone="success" title={t("auth.passwordUpdatedTitle")} description={t("auth.passwordUpdatedDesc")}>
        <div className="flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      icon={<KeyRound />}
      title={t("auth.resetPasswordTitle")}
      description={t("auth.resetPasswordSubtitle")}
      back={{ href: "/auth", label: t("auth.backToLogin") }}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <Alert variant="destructive" role="alert" className="border-destructive/30 bg-destructive/5">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="h-11 bg-card"
            aria-describedby="new-password-hint"
          />
          <p id="new-password-hint" className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className="h-11 bg-card"
          />
        </div>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          {t("auth.updatePassword")}
        </Button>
      </form>
    </AuthShell>
  )
}
