"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AuthFormProps {
  onSignUpComplete: () => void
}

const SITE_URL = "https://v0-katalogyap.vercel.app"

export function AuthForm({ onSignUpComplete }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin"

  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState("")
  const [signInPassword, setSignInPassword] = useState("")

  // Sign Up form state
  const [signUpName, setSignUpName] = useState("")
  const [signUpCompany, setSignUpCompany] = useState("")
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")

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
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("E-posta veya şifre hatalı")
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error("E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.")
        }
        throw error
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş yapılırken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
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
        if (error.message.includes("already registered")) {
          throw new Error("Bu e-posta adresi zaten kayıtlı")
        }
        if (error.message.includes("Password should be")) {
          throw new Error("Şifre en az 6 karakter olmalıdır")
        }
        throw error
      }

      if (data.session) {
        // Email confirmation kapalıysa direkt giriş yap
        router.push("/dashboard")
        router.refresh()
      } else if (data.user && !data.session) {
        router.push("/auth/verify")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt olurken bir hata oluştu")
    } finally {
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
      setError(err instanceof Error ? err.message : "Google ile giriş yapılırken bir hata oluştu")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Hoş geldiniz</h2>
        <p className="text-muted-foreground text-sm">Hesabınıza giriş yapın veya yeni bir hesap oluşturun</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button
        variant="outline"
        className="w-full h-11 bg-transparent"
        onClick={handleGoogleAuth}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
        Google ile devam et
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Veya</span>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Giriş Yap</TabsTrigger>
          <TabsTrigger value="signup">Kayıt Ol</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="space-y-4 mt-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">E-posta</Label>
              <Input
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
                <Label htmlFor="signin-password">Şifre</Label>
                <a href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  Şifremi unuttum
                </a>
              </div>
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Giriş Yap
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4 mt-4">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Ad Soyad</Label>
                <Input
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
                <Label htmlFor="signup-company">Şirket Adı</Label>
                <Input
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
              <Label htmlFor="signup-email">E-posta</Label>
              <Input
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
              <Label htmlFor="signup-password">Şifre</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">En az 6 karakter</p>
            </div>
            <Button type="submit" className="w-full h-11" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hesap Oluştur
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <p className="text-center text-xs text-muted-foreground">
        Devam ederek{" "}
        <a href="/terms" className="text-primary hover:underline">
          Kullanım Şartları
        </a>{" "}
        ve{" "}
        <a href="/privacy" className="text-primary hover:underline">
          Gizlilik Politikası
        </a>
        {"'"}nı kabul etmiş olursunuz.
      </p>
    </div>
  )
}
