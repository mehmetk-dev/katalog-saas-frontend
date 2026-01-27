"use client"

import type React from "react"
import { useState, useTransition, useRef } from "react"
import { toast } from "sonner"
import NextImage from "next/image"
import { User, CreditCard, Globe, Trash2, CheckCircle2, Building2, Mail, Camera, Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUser } from "@/lib/user-context"
import { useTranslation } from "@/lib/i18n-provider"
import { updateProfile, deleteAccount } from "@/lib/actions/auth"
import { UpgradeModal } from "@/components/builder/upgrade-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { storage } from "@/lib/storage"

export default function SettingsPage() {
  const { user, isLoading, refreshUser } = useUser()
  const { language, setLanguage, t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const supabase = createClient()

  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null)
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)

  // Upload işlemlerini iptal etmek için ref'ler
  const avatarAbortController = useRef<AbortController | null>(null)
  const logoAbortController = useRef<AbortController | null>(null)
  const avatarTimeoutId = useRef<NodeJS.Timeout | null>(null)
  const logoTimeoutId = useRef<NodeJS.Timeout | null>(null)

  // YENİ: Tekil dosya yükleme ve Retry (Yeniden Deneme) mantığı - Avatar
  const uploadAvatarWithRetry = async (file: File, userId: string, signal?: AbortSignal): Promise<string> => {
    const MAX_RETRIES = 3
    const TIMEOUT_MS = 30000 // 30 Saniye

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // İptal kontrolü
      if (signal?.aborted) {
        console.log(`[Settings] 🛑 Avatar upload cancelled`)
        throw new Error('Upload cancelled')
      }

      let timeoutId: NodeJS.Timeout | null = null

      try {
        // 1. Bekleme Süresi (Exponential Backoff - İlk denemede beklemez)
        if (attempt > 0) {
          const waitTime = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s...
          console.log(`[Settings] 🔄 Retry attempt ${attempt + 1}/${MAX_RETRIES} for avatar. Waiting ${waitTime}ms`)
          toast.loading(`Bağlantı yoğun, tekrar deneniyor (${attempt + 1}/${MAX_RETRIES})...`)

          // Bekleme sırasında da iptal kontrolü
          await new Promise<void>((resolve, reject) => {
            const checkInterval = setInterval(() => {
              if (signal?.aborted) {
                clearInterval(checkInterval)
                reject(new Error('Upload cancelled'))
              }
            }, 100)

            setTimeout(() => {
              clearInterval(checkInterval)
              resolve()
            }, waitTime)
          })
        }

        // İptal kontrolü (bekleme sonrası)
        if (signal?.aborted) {
          console.log(`[Settings] 🛑 Avatar upload cancelled after wait`)
          throw new Error('Upload cancelled')
        }

        // 2. Dosya adı oluştur
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`

        // 3. YARIŞ BAŞLASIN: Upload vs Timeout
        const uploadPromise = storage.upload(file, {
          path: 'avatars', // Yeni klasör yapısı: avatars klasörü
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
          fileName,
        })

        // Timeout promise'i (temizlenebilir)
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            console.error(`[Settings] ⏱️ Avatar upload timeout after ${TIMEOUT_MS / 1000} seconds`)
            reject(new Error('UPLOAD_TIMEOUT'))
          }, TIMEOUT_MS)

          // Timeout ID'yi kaydet (temizlemek için)
          avatarTimeoutId.current = timeoutId
        })

        const result: any = await Promise.race([uploadPromise, timeoutPromise])

        // Timeout'u temizle (başarılı olduysa)
        if (timeoutId) {
          clearTimeout(timeoutId)
          avatarTimeoutId.current = null
          timeoutId = null
        }

        // 4. Sonuç Kontrolü
        if (result && result.url) {
          return result.url // Başarılı! URL'i döndür ve fonksiyondan çık.
        } else {
          throw new Error('Upload successful but URL is missing')
        }

      } catch (error: any) {
        // Timeout'u temizle (hata durumunda)
        if (timeoutId) {
          clearTimeout(timeoutId)
          avatarTimeoutId.current = null
          timeoutId = null
        }

        // İptal hatası ise direkt fırlat
        if (error.message === 'Upload cancelled' || signal?.aborted) {
          console.log(`[Settings] 🛑 Avatar upload cancelled`)
          throw error
        }

        console.error(`[Settings] ❌ Avatar attempt ${attempt + 1} failed:`, error.message)

        // Eğer son denemeyse hatayı fırlat ki ana fonksiyon yakalasın
        if (attempt === MAX_RETRIES - 1) {
          throw error
        }
        // Değilse döngü başa döner ve tekrar dener
      }
    }
    throw new Error('Unexpected retry loop exit')
  }

  // YENİ: Tekil dosya yükleme ve Retry (Yeniden Deneme) mantığı - Logo
  const uploadLogoWithRetry = async (file: File, userId: string, signal?: AbortSignal): Promise<string> => {
    const MAX_RETRIES = 3
    const TIMEOUT_MS = 30000 // 30 Saniye

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // İptal kontrolü
      if (signal?.aborted) {
        console.log(`[Settings] 🛑 Logo upload cancelled`)
        throw new Error('Upload cancelled')
      }

      let timeoutId: NodeJS.Timeout | null = null

      try {
        // 1. Bekleme Süresi (Exponential Backoff - İlk denemede beklemez)
        if (attempt > 0) {
          const waitTime = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s...
          console.log(`[Settings] 🔄 Retry attempt ${attempt + 1}/${MAX_RETRIES} for logo. Waiting ${waitTime}ms`)
          toast.loading(`Bağlantı yoğun, tekrar deneniyor (${attempt + 1}/${MAX_RETRIES})...`)

          // Bekleme sırasında da iptal kontrolü
          await new Promise<void>((resolve, reject) => {
            const checkInterval = setInterval(() => {
              if (signal?.aborted) {
                clearInterval(checkInterval)
                reject(new Error('Upload cancelled'))
              }
            }, 100)

            setTimeout(() => {
              clearInterval(checkInterval)
              resolve()
            }, waitTime)
          })
        }

        // İptal kontrolü (bekleme sonrası)
        if (signal?.aborted) {
          console.log(`[Settings] 🛑 Logo upload cancelled after wait`)
          throw new Error('Upload cancelled')
        }

        // 2. Dosya adı oluştur
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const fileName = `logo-${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`

        // 3. YARIŞ BAŞLASIN: Upload vs Timeout
        const uploadPromise = storage.upload(file, {
          path: 'company-logos', // Yeni klasör yapısı: company-logos klasörü
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
          fileName,
        })

        // Timeout promise'i (temizlenebilir)
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            console.error(`[Settings] ⏱️ Logo upload timeout after ${TIMEOUT_MS / 1000} seconds`)
            reject(new Error('UPLOAD_TIMEOUT'))
          }, TIMEOUT_MS)

          // Timeout ID'yi kaydet (temizlemek için)
          logoTimeoutId.current = timeoutId
        })

        const result: any = await Promise.race([uploadPromise, timeoutPromise])

        // Timeout'u temizle (başarılı olduysa)
        if (timeoutId) {
          clearTimeout(timeoutId)
          logoTimeoutId.current = null
          timeoutId = null
        }

        // 4. Sonuç Kontrolü
        if (result && result.url) {
          return result.url // Başarılı! URL'i döndür ve fonksiyondan çık.
        } else {
          throw new Error('Upload successful but URL is missing')
        }

      } catch (error: any) {
        // Timeout'u temizle (hata durumunda)
        if (timeoutId) {
          clearTimeout(timeoutId)
          logoTimeoutId.current = null
          timeoutId = null
        }

        // İptal hatası ise direkt fırlat
        if (error.message === 'Upload cancelled' || signal?.aborted) {
          console.log(`[Settings] 🛑 Logo upload cancelled`)
          throw error
        }

        console.error(`[Settings] ❌ Logo attempt ${attempt + 1} failed:`, error.message)

        // Eğer son denemeyse hatayı fırlat ki ana fonksiyon yakalasın
        if (attempt === MAX_RETRIES - 1) {
          throw error
        }
        // Değilse döngü başa döner ve tekrar dener
      }
    }
    throw new Error('Unexpected retry loop exit')
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error(t('toasts.invalidImageFile'))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('toasts.imageSizeLimit', { size: 2 }))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewAvatarUrl(objectUrl)
    setPendingAvatarFile(file)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error(t('toasts.invalidImageFile'))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('toasts.imageSizeLimit', { size: 2 }))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewLogoUrl(objectUrl)
    setPendingLogoFile(file)
  }

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        let dbUpdateNeeded = false
        const dbUpdates: Record<string, string> = {}

        // 1. Upload Avatar if pending
        if (pendingAvatarFile) {
          setIsUploadingAvatar(true)

          // Önceki upload'ı iptal et
          if (avatarAbortController.current) {
            avatarAbortController.current.abort()
          }
          if (avatarTimeoutId.current) {
            clearTimeout(avatarTimeoutId.current)
            avatarTimeoutId.current = null
          }

          // Yeni AbortController oluştur
          const abortController = new AbortController()
          avatarAbortController.current = abortController

          try {
            // YUKARIDAKİ AKILLI FONKSİYONU ÇAĞIRIYORUZ
            const publicUrl = await uploadAvatarWithRetry(pendingAvatarFile, user.id, abortController.signal)

            dbUpdates.avatar_url = publicUrl
            dbUpdateNeeded = true
          } catch (error: any) {
            // İptal hatası ise sessizce geç
            if (error.message === 'Upload cancelled' || abortController.signal.aborted) {
              console.log(`[Settings] 🛑 Avatar upload cancelled, silently ignoring`)
              return
            }

            console.error("Avatar upload error:", error)
            let msg = t('toasts.imageUploadFailed')
            if (error.message === 'UPLOAD_TIMEOUT' || error.message?.includes('timeout')) {
              msg = 'Avatar yükleme zaman aşımına uğradı (tüm denemeler başarısız). Lütfen tekrar deneyin.'
            } else if (error.message) {
              msg = `Avatar yükleme hatası: ${error.message.substring(0, 50)}`
            }
            toast.error(msg)
            throw error
          } finally {
            // Cleanup
            avatarAbortController.current = null
            if (avatarTimeoutId.current) {
              clearTimeout(avatarTimeoutId.current)
              avatarTimeoutId.current = null
            }

            setIsUploadingAvatar(false)
          }
        }

        // 2. Upload Logo if pending
        if (pendingLogoFile) {
          setIsUploadingLogo(true)

          // Önceki upload'ı iptal et
          if (logoAbortController.current) {
            logoAbortController.current.abort()
          }
          if (logoTimeoutId.current) {
            clearTimeout(logoTimeoutId.current)
            logoTimeoutId.current = null
          }

          // Yeni AbortController oluştur
          const abortController = new AbortController()
          logoAbortController.current = abortController

          try {
            // YUKARIDAKİ AKILLI FONKSİYONU ÇAĞIRIYORUZ
            const publicUrl = await uploadLogoWithRetry(pendingLogoFile, user.id, abortController.signal)

            dbUpdates.logo_url = publicUrl
            dbUpdateNeeded = true
          } catch (error: any) {
            // İptal hatası ise sessizce geç
            if (error.message === 'Upload cancelled' || abortController.signal.aborted) {
              console.log(`[Settings] 🛑 Logo upload cancelled, silently ignoring`)
              return
            }

            console.error("Logo upload error:", error)
            let msg = t('toasts.imageUploadFailed')
            if (error.message === 'UPLOAD_TIMEOUT' || error.message?.includes('timeout')) {
              msg = 'Logo yükleme zaman aşımına uğradı (tüm denemeler başarısız). Lütfen tekrar deneyin.'
            } else if (error.message) {
              msg = `Logo yükleme hatası: ${error.message.substring(0, 50)}`
            }
            toast.error(msg)
            throw error
          } finally {
            // Cleanup
            logoAbortController.current = null
            if (logoTimeoutId.current) {
              clearTimeout(logoTimeoutId.current)
              logoTimeoutId.current = null
            }

            setIsUploadingLogo(false)
          }
        }

        // 3. Update DB for images if needed
        if (dbUpdateNeeded) {
          const { error: updateError } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', user.id)

          if (updateError) throw updateError
        }

        // 4. Update Profile Text Data
        await updateProfile(formData)

        await refreshUser()

        // Reset pending states
        setPendingAvatarFile(null)
        setPendingLogoFile(null)
        // Clear local preview state so it falls back to user data from refreshUser
        if (previewAvatarUrl) URL.revokeObjectURL(previewAvatarUrl)
        if (previewLogoUrl) URL.revokeObjectURL(previewLogoUrl)
        setPreviewAvatarUrl(null)
        setPreviewLogoUrl(null)

        toast.success(t('toasts.profileUpdated'))
      } catch (error: unknown) {
        console.error("Save profile error:", error)
        let msg = t('toasts.profileUpdateFailed')
        if (error instanceof Error) msg += `: ${error.message}`
        toast.error(msg)
      } finally {
        setIsUploadingAvatar(false)
        setIsUploadingLogo(false)
      }
    })
  }

  // Helper to get display source
  const displayAvatarUrl = previewAvatarUrl || user?.avatar_url
  const displayLogoUrl = previewLogoUrl || user?.logo_url

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await deleteAccount()
      toast.success(t('toasts.accountDeleted'))
      window.location.href = "/auth"
    } catch {
      toast.error(t('toasts.accountDeleteFailed'))
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="grid gap-6">
          <div className="h-64 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 md:pb-10">
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("settings.managePreferences")}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-muted/50 dark:bg-muted/30 p-1">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-background dark:data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">
            <User className="w-4 h-4" />
            {t("settings.profile")}
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2 data-[state=active]:bg-background dark:data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            {t("settings.subscription")}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 data-[state=active]:bg-background dark:data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground">
            <Globe className="w-4 h-4" />
            {t("settings.preferences")}
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300 pb-6">
          <Card className="border-0 shadow-md ring-1 ring-border bg-card">
            <CardHeader className="pb-4 border-b bg-muted/30 dark:bg-muted/10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">{t("settings.personalInfo")}</CardTitle>
                  <CardDescription className="text-muted-foreground">{t("settings.personalInfoDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-center gap-6 pb-6 border-b">
                  <div className="relative group">
                    <Avatar className="w-20 h-20 border-4 border-white dark:border-background shadow-lg">
                      <AvatarImage src={displayAvatarUrl || undefined} alt={user?.name} className="dark:brightness-100" />
                      <AvatarFallback className="text-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t("settings.profilePhoto")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.photoDesc")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2 text-foreground">
                      <User className="w-3.5 h-3.5" /> {t("auth.name")}
                    </Label>
                    <Input id="fullName" name="fullName" defaultValue={user?.name} className="bg-background border-input focus:bg-background transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-2 text-foreground">
                      <Building2 className="w-3.5 h-3.5" /> {t("auth.company")}
                    </Label>
                    <Input id="company" name="company" defaultValue={user?.company} className="bg-background border-input focus:bg-background transition-colors" />
                  </div>
                </div>

                {/* Company Logo Upload */}
                <div className="flex items-center gap-6 pb-6 border-b">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/20 overflow-hidden group-hover:border-primary/50 transition-colors relative">
                      {displayLogoUrl ? (
                        <NextImage src={displayLogoUrl} alt="Company Logo" fill className="object-contain" unoptimized />
                      ) : (
                        <Building2 className="w-8 h-8 text-muted-foreground/30" />
                      )}
                    </div>
                    <label
                      htmlFor="logo-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={isUploadingLogo}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t("settings.companyLogo")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.logoDesc")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-foreground">
                    <Mail className="w-3.5 h-3.5" /> {t("auth.email")}
                  </Label>
                  <Input id="email" type="email" defaultValue={user?.email} disabled className="bg-muted text-muted-foreground" />
                </div>

                <div className="flex justify-end pt-4 pb-2 md:pb-0">
                  <Button type="submit" disabled={isPending} className="min-w-[120px]">
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("settings.saving")}
                      </div>
                    ) : (
                      t("common.save")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 shadow-sm ring-1 ring-destructive/10 bg-card">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                <CardTitle className="text-lg text-foreground">{t("settings.dangerZone")}</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">{t("settings.deleteWarning")}</CardDescription>
            </CardHeader>
            <CardContent className="pb-4 md:pb-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="bg-destructive/90 hover:bg-destructive">
                    {t("settings.deleteAccount")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">{t("settings.deleteConfirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      {t("settings.deleteConfirmDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? t("settings.deleting") : t("settings.yesDelete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBSCRIPTION TAB */}
        <TabsContent value="subscription" className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300 pb-6">
          <Card className="border-0 shadow-md ring-1 ring-border bg-card overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
              <CreditCard className="w-64 h-64 -rotate-12 transform translate-x-16 -translate-y-16" />
            </div>
            <CardHeader className="bg-gradient-to-r from-muted/50 via-muted/30 to-background dark:from-muted/20 dark:to-transparent border-b">
              <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                {t("settings.currentPlanTitle")}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${user?.plan === "pro" ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white" :
                  user?.plan === "plus" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" :
                    "bg-secondary text-secondary-foreground"}`}>
                  {user?.plan === "pro" ? t("plans.pro") : user?.plan === "plus" ? t("plans.plus") : t("plans.free")}
                </span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {user?.plan === "pro"
                  ? t("settings.planDescPro")
                  : user?.plan === "plus"
                    ? t("settings.planDescPlus")
                    : t("settings.planDescFree")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    {t("settings.planFeatures")}
                  </h3>
                  <ul className="space-y-3 pl-2">
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className={`w-2 h-2 rounded-full ${user?.plan === "pro" ? "bg-green-500" : user?.plan === "plus" ? "bg-green-500" : "bg-yellow-500"}`} />
                      {user?.plan === "pro" ? t("plans.features.unlimitedCatalogs") : user?.plan === "plus" ? t("plans.features.catalogsCount", { count: 10 }) : t("plans.features.catalogsCount", { count: 1 })}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className={`w-2 h-2 rounded-full ${user?.plan !== "free" ? "bg-green-500" : "bg-yellow-500"}`} />
                      {user?.plan !== "free" ? t("plans.features.unlimitedProducts") : t("plans.features.productLimit", { count: 50 })}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className={`w-2 h-2 rounded-full ${user?.plan !== "free" ? "bg-green-500" : "bg-muted"}`} />
                      {user?.plan !== "free" ? t("plans.features.categoryManagement") : t("plans.features.noCategoryManagement")}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className={`w-2 h-2 rounded-full ${user?.plan !== "free" ? "bg-green-500" : "bg-yellow-500"}`} />
                      {user?.plan !== "free" ? t("plans.features.premiumTemplates") : t("plans.features.basicTemplates")}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className={`w-2 h-2 rounded-full ${user?.plan === "pro" ? "bg-green-500" : user?.plan === "plus" ? "bg-green-500" : "bg-muted"}`} />
                      {user?.plan === "pro" ? t("plans.features.advancedAnalytics") : user?.plan === "plus" ? t("plans.features.basicExport") : t("plans.features.noAnalytics")}
                    </li>
                  </ul>
                </div>

                {(user?.plan === "free" || user?.plan === "plus") && (
                  <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl border border-indigo-100 dark:border-indigo-500/20 text-center space-y-4">
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-lg">
                      {user?.plan === "plus" ? t("plans.upgradeToPro") : t("plans.upgrade")}
                    </h3>
                    <p className="text-sm text-indigo-700/80 dark:text-indigo-200/60">
                      {user?.plan === "plus" ? t("plans.upgradeDescPro") : t("plans.upgradeDescPlus")}
                    </p>
                    <Button size="lg" onClick={() => setShowUpgrade(true)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/20 text-white font-semibold">
                      {user?.plan === "plus" ? t("plans.upgradeToProBtn") : t("plans.viewPlans")}
                    </Button>
                  </div>
                )}
                {user?.plan === "pro" && (
                  <div className="flex flex-col items-center justify-center p-6 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-100 dark:border-green-500/20 text-center space-y-4">
                    <h3 className="font-bold text-green-900 dark:text-green-300 text-lg">{t("settings.greatChoice")}</h3>
                    <p className="text-sm text-green-700/80 dark:text-green-200/60">{t("settings.planDescPro")}</p>
                    <Button variant="outline" className="w-full border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40">
                      {t("settings.billingHistory")}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300 pb-6">
          <Card className="border-0 shadow-md ring-1 ring-border bg-card">
            <CardHeader className="pb-4 border-b bg-muted/30 dark:bg-muted/10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">{t("settings.language")}</CardTitle>
                  <CardDescription className="text-muted-foreground">{t("settings.selectLanguage")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant={language === 'tr' ? 'default' : 'outline'}
                  onClick={() => setLanguage('tr')}
                  className={`flex-1 h-auto py-4 justify-start px-4 gap-3 relative overflow-hidden transition-all duration-300 ${language === 'tr'
                      ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background'
                      : 'hover:bg-muted/50 dark:hover:bg-muted/20'
                    }`}
                >
                  <span className="text-2xl">🇹🇷</span>
                  <div className="flex flex-col items-start">
                    <span className={`font-semibold ${language === 'tr' ? 'text-primary-foreground' : 'text-foreground'}`}>Türkçe</span>
                    <span className={`text-xs opacity-70 ${language === 'tr' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{t("settings.defaultLanguage")}</span>
                  </div>
                  {language === 'tr' && <CheckCircle2 className="w-5 h-5 ml-auto text-primary-foreground" />}
                </Button>

                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  onClick={() => setLanguage('en')}
                  className={`flex-1 h-auto py-4 justify-start px-4 gap-3 relative overflow-hidden transition-all duration-300 ${language === 'en'
                      ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background'
                      : 'hover:bg-muted/50 dark:hover:bg-muted/20'
                    }`}
                >
                  <span className="text-2xl">🇺🇸</span>
                  <div className="flex flex-col items-start">
                    <span className={`font-semibold ${language === 'en' ? 'text-primary-foreground' : 'text-foreground'}`}>English</span>
                    <span className={`text-xs opacity-70 ${language === 'en' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{t("settings.international")}</span>
                  </div>
                  {language === 'en' && <CheckCircle2 className="w-5 h-5 ml-auto text-primary-foreground" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
