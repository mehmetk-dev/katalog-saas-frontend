"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isPasswordLongEnough } from "@/lib/auth/password-policy"
import { createClient } from "@/lib/supabase/client"

type TFunction = (key: string, params?: Record<string, unknown>) => string

/**
 * Giriş yapmış kullanıcı için şifre değiştirme. E-posta/şifre hesabında mevcut şifre önce
 * doğrulanır (açık kalmış bir oturumla şifre ele geçirilemesin). Yalnızca Google ile kayıtlı
 * hesapta mevcut şifre yoktur; bu durumda şifre belirlenir ve e-postayla da giriş açılır.
 */
export function PasswordCard({ email, t }: { email?: string | null; t: TFunction }) {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!mounted) return
        const identities = data.user?.identities
        // Kimlik listesi okunamazsa güvenli taraf: mevcut şifre istenir
        setHasPassword(!identities || identities.length === 0 || identities.some((identity) => identity.provider === "email"))
      })
      .catch(() => mounted && setHasPassword(true))
    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    if (hasPassword && !currentPassword) {
      setError(t("settings.currentPasswordRequired"))
      return
    }
    if (!isPasswordLongEnough(password)) {
      setError(t("auth.passwordLength"))
      return
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"))
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      if (hasPassword) {
        if (!email) throw new Error("missing email")
        // Yanlış şifrede mevcut oturum olduğu gibi kalır
        const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
        if (verifyError) {
          setError(t("settings.currentPasswordWrong"))
          return
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      setCurrentPassword("")
      setPassword("")
      setConfirmPassword("")
      setHasPassword(true)
      setSuccess(true)
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : ""
      if (message.includes("different")) setError(t("auth.passwordSameAsOld"))
      else if (message.includes("reauthentication")) setError(t("settings.passwordReauthRequired"))
      else setError(t("auth.passwordUpdateError"))
    } finally {
      setIsSaving(false)
    }
  }

  const clearStatus = () => {
    setError(null)
    setSuccess(false)
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-muted p-2 text-muted-foreground">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-xl text-foreground">
              {hasPassword === false ? t("settings.setPassword") : t("settings.changePassword")}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {hasPassword === false ? t("settings.setPasswordDesc") : t("settings.changePasswordDesc")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {hasPassword === null ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert role="status" className="border-success/30 bg-success-soft text-success-soft-foreground">
                <CheckCircle2 />
                <AlertDescription className="text-success-soft-foreground">{t("settings.passwordChanged")}</AlertDescription>
              </Alert>
            )}

            {hasPassword && (
              <div className="space-y-1.5">
                <Label htmlFor="current-password">{t("settings.currentPassword")}</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    clearStatus()
                  }}
                  disabled={isSaving}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="settings-new-password">{t("auth.newPassword")}</Label>
                <Input
                  id="settings-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearStatus()
                  }}
                  disabled={isSaving}
                  aria-describedby="settings-new-password-hint"
                />
                <p id="settings-new-password-hint" className="text-xs text-muted-foreground">
                  {t("auth.passwordHint")}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-confirm-password">{t("auth.confirmPassword")}</Label>
                <Input
                  id="settings-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    clearStatus()
                  }}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {hasPassword ? t("settings.changePassword") : t("settings.setPassword")}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
