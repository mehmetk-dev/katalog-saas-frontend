"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
import NextImage from "next/image"
import { User, CreditCard, Globe, Trash2, CheckCircle2, Building2, Mail, Camera, Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUser } from "@/lib/contexts/user-context"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { updateProfile, deleteAccount } from "@/lib/actions/auth"
import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"
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
import { cn } from "@/lib/utils"

export default function SettingsPageClient() {
    const { user, setUser, isLoading, refreshUser } = useUser()
    const { language, setLanguage, t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
    const [isDeleting, setIsDeleting] = useState(false)
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)
    const supabase = createClient()

    const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null)
    const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null)

    // Cleanup effect for object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (previewAvatarUrl) URL.revokeObjectURL(previewAvatarUrl)
            if (previewLogoUrl) URL.revokeObjectURL(previewLogoUrl)
        }
    }, [previewAvatarUrl, previewLogoUrl])

    // FORCE SESSION REFRESH ON MOUNT
    // Bu, client-side gezinmelerde middleware tetiklenmediği için oluşabilecek "stale token" sorununu çözer.
    useEffect(() => {
        const checkAndRefreshSession = async () => {
            // Mevcut oturumu kontrol et
            const { data: { session }, error } = await supabase.auth.getSession()

            // Eğer session yoksa veya hata varsa, ya da token süresi dolmak üzereyse (burada basitçe session kontrolü yapıyoruz)
            if (error || !session) {
                const { error: refreshError } = await supabase.auth.refreshSession()

                if (refreshError) {
                    console.error("[SettingsPage] Oturum yenileme başarısız:", refreshError)
                }
            }
        }

        checkAndRefreshSession()
    }, [supabase.auth])

    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)

    // Upload işlemlerini iptal etmek için ref'ler
    const avatarAbortController = useRef<AbortController | null>(null)
    const logoAbortController = useRef<AbortController | null>(null)

    // Fotoğraf yükleme alanına tıklandığında (daha dosya seçilmeden) oturumu tazele
    // Bu "Just-in-Time" kontrolü sağlar
    // Fotoğraf yükleme alanına tıklandığında (daha dosya seçilmeden) oturumu tazele (Just-in-Time)
    const handleUploadClick = async () => {
        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { error } = await supabase.auth.refreshSession()
            if (error) console.error('[Settings] Pre-upload session refresh failed:', error)
        } catch (e) {
            console.error('[Settings] handleUploadClick error:', e)
        }
    }

    // YENİ: Component unmount olduğunda tüm toast'ları ve upload'ları temizle
    useEffect(() => {
        return () => {
            if (avatarAbortController.current) avatarAbortController.current.abort()
            if (logoAbortController.current) logoAbortController.current.abort()
            toast.dismiss()
        }
    }, [])

    // Ortak Upload Fonksiyonu (DRY Prensibi)
    const uploadFileWithRetry = async (
        file: File,
        bucketPath: string,
        customFileName: string,
        signal?: AbortSignal
    ): Promise<string> => {
        const MAX_RETRIES = 3
        const TIMEOUT_MS = 30000 // 30 Saniye (Daha yüksek limit)

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            if (signal?.aborted) throw new Error('Upload cancelled')

            let timeoutId: NodeJS.Timeout | null = null
            let retryToastId: string | number | null = null

            try {
                if (attempt > 0) {
                    const waitTime = 1000 * Math.pow(2, attempt - 1)
                    retryToastId = toast.loading(`Bağlantı yoğun, tekrar deneniyor (${attempt + 1}/${MAX_RETRIES})...`)
                    await new Promise<void>((resolve, reject) => {
                        const checkInterval = setInterval(() => {
                            if (signal?.aborted) {
                                clearInterval(checkInterval)
                                if (retryToastId) toast.dismiss(retryToastId)
                                reject(new Error('Upload cancelled'))
                            }
                        }, 100)
                        setTimeout(() => {
                            clearInterval(checkInterval)
                            if (retryToastId) toast.dismiss(retryToastId)
                            resolve()
                        }, waitTime)
                    })
                }

                if (signal?.aborted) throw new Error('Upload cancelled')

                const uploadPromise = storage.upload(file, {
                    path: bucketPath,
                    contentType: file.type || 'image/jpeg',
                    cacheControl: '3600',
                    fileName: customFileName,
                    signal,
                })

                const timeoutPromise = new Promise<never>((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error('UPLOAD_TIMEOUT'))
                    }, TIMEOUT_MS)
                })

                const result = await Promise.race([uploadPromise, timeoutPromise]) as { url: string } | never

                if (timeoutId) clearTimeout(timeoutId)
                if (retryToastId) {
                    toast.dismiss(retryToastId)
                    retryToastId = null
                }

                if (result && 'url' in result && result.url) return result.url
                else throw new Error('Upload successful but URL is missing')

            } catch (error) {
                if (timeoutId) clearTimeout(timeoutId)
                if (retryToastId) {
                    toast.dismiss(retryToastId)
                    retryToastId = null
                }
                if (error instanceof Error && (error.message === 'Upload cancelled' || signal?.aborted)) throw error
                const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
                console.error(`[Settings] ❌ ${bucketPath} attempt ${attempt + 1} failed:`, errorMessage)
                if (attempt === MAX_RETRIES - 1) throw error
            }
        }
        throw new Error('Unexpected retry loop exit')
    }

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Dosya seçildiği an da bir refresh yapalım (garanti olsun)
        handleUploadClick()

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
        // Dosya seçildiği an da bir refresh yapalım
        handleUploadClick()

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

    const [isSaving, setIsSaving] = useState(false)

    const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!user) return

        const formData = new FormData(e.currentTarget)

        // startTransition'ı kaldırıyoruz, direkt async execute ediyoruz
        // Bu, React concurrent features ile async/await flow arasındaki potansiyel race condition'ı engeller
        const executeSave = async () => {
            setIsSaving(true) // UI loading durumunu aktif et

            try {
                // Oturum kontrolünü kaldırdık - zaten upload işleminde veya server action'da hata verirse yakalayacağız.
                // Buradaki getSession bazen hang olabiliyor.

                let avatarUrlToSave = user.avatar_url
                let logoUrlToSave = user.logo_url

                // 1. Upload Avatar if pending
                if (pendingAvatarFile) {
                    setIsUploadingAvatar(true)

                    if (avatarAbortController.current) avatarAbortController.current.abort()
                    const abortController = new AbortController()
                    avatarAbortController.current = abortController

                    try {
                        const fileExtension = pendingAvatarFile.name.split('.').pop() || 'jpg'
                        const fileName = `${user.id}-${Date.now()}.${fileExtension}`
                        const publicUrl = await uploadFileWithRetry(pendingAvatarFile, 'avatars', fileName, abortController.signal)
                        avatarUrlToSave = publicUrl
                    } catch (error) {
                        if (error instanceof Error && (error.message === 'Upload cancelled' || abortController.signal.aborted)) {
                            return
                        }
                        console.error('[Settings] Avatar upload failed:', error)
                        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
                        toast.error(`Avatar yüklenemedi: ${errorMessage}`)
                        throw error // İşlemi durdur
                    } finally {
                        avatarAbortController.current = null
                        setIsUploadingAvatar(false)
                    }
                }

                // 2. Upload Logo if pending
                if (pendingLogoFile) {
                    setIsUploadingLogo(true)

                    if (logoAbortController.current) logoAbortController.current.abort()
                    const abortController = new AbortController()
                    logoAbortController.current = abortController

                    try {
                        const fileExtension = pendingLogoFile.name.split('.').pop() || 'jpg'
                        const fileName = `logo-${user.id}-${Date.now()}.${fileExtension}`
                        const publicUrl = await uploadFileWithRetry(pendingLogoFile, 'company-logos', fileName, abortController.signal)
                        logoUrlToSave = publicUrl
                    } catch (error) {
                        if (error instanceof Error && (error.message === 'Upload cancelled' || abortController.signal.aborted)) {
                            return
                        }
                        console.error('[Settings] Logo upload failed:', error)
                        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
                        toast.error(`Logo yüklenemedi: ${errorMessage}`)
                        throw error // İşlemi durdur
                    } finally {
                        logoAbortController.current = null
                        setIsUploadingLogo(false)
                    }
                }

                // 3. Update Profile Server Action
                await updateProfile(formData, avatarUrlToSave, logoUrlToSave)

                // OPTIMISTIC UPDATE: Hemen UI'ı yeni bilgilerle güncelle (refreshUser'ı bekleme)
                // Bu sayede eski fotoğraf geri gelmez
                if (user) {
                    setUser({
                        ...user,
                        name: (formData.get('fullName') as string) || user.name,
                        company: (formData.get('company') as string) || user.company,
                        avatar_url: avatarUrlToSave || user.avatar_url,
                        logo_url: logoUrlToSave || user.logo_url
                    })
                }

                // 4. Force refresh (Background - Fire & Forget)
                // Kullanıcıyı bekletmemek için refresh işlemini arka planda başlatıyoruz ve beklemiyoruz.
                refreshUser().catch(() => { })

                // Cleanup
                setPendingAvatarFile(null)
                setPendingLogoFile(null)
                if (previewAvatarUrl) URL.revokeObjectURL(previewAvatarUrl)
                if (previewLogoUrl) URL.revokeObjectURL(previewLogoUrl)
                setPreviewAvatarUrl(null)
                setPreviewLogoUrl(null)

                toast.success(t('toasts.profileUpdated'))
            } catch (error: unknown) {
                console.error("[Settings] Save profile error:", error)
                let msg = t('toasts.profileUpdateFailed')
                if (error instanceof Error) msg += `: ${error.message}`
                toast.error(msg)
            } finally {
                setIsUploadingAvatar(false)
                setIsUploadingLogo(false)
                setIsSaving(false)
            }
        }

        // Manually manage pending state since we removed startTransition
        // startTransition hook'u yerine kendi state'imizi kullanıyoruz (gerçi isPending hook'tan geliyor ama effect olarak wrap edebiliriz)
        // Ama en temizi startTransition hook'unu çağırmak yerine direkt execute etmek

        // Geçici olarak isPending kontrolü için:
        executeSave()
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
                <TabsList className={cn(
                    "grid w-full grid-cols-3 lg:w-[480px] h-12",
                    "bg-slate-100/80 dark:bg-slate-950/50 p-1 rounded-full",
                    "border border-slate-200/50 dark:border-slate-800/50",
                    "shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]"
                )}>
                    <TabsTrigger
                        value="profile"
                        className={cn(
                            "h-full rounded-full gap-2 font-bold",
                            "text-[11px] sm:text-xs uppercase tracking-tight",
                            "transition-all duration-300",
                            "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800",
                            "data-[state=active]:shadow-sm data-[state=active]:text-indigo-600",
                            "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <User className="w-4 h-4" />
                        <span className="truncate">{t("settings.profile")}</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="subscription"
                        className={cn(
                            "h-full rounded-full gap-2 font-bold",
                            "text-[11px] sm:text-xs uppercase tracking-tight",
                            "transition-all duration-300",
                            "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800",
                            "data-[state=active]:shadow-sm data-[state=active]:text-indigo-600",
                            "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <CreditCard className="w-4 h-4" />
                        <span className="truncate">{t("settings.subscription")}</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="preferences"
                        className={cn(
                            "h-full rounded-full gap-2 font-bold",
                            "text-[11px] sm:text-xs uppercase tracking-tight",
                            "transition-all duration-300",
                            "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800",
                            "data-[state=active]:shadow-sm data-[state=active]:text-indigo-600",
                            "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <Globe className="w-4 h-4" />
                        <span className="truncate">{t("settings.preferences")}</span>
                    </TabsTrigger>
                </TabsList>

                {/* PROFILE TAB */}
                <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300 pb-6">
                    <Card className="border-0 shadow-md ring-1 ring-border bg-card">
                        <CardHeader className="pb-4 border-b bg-muted/30 dark:bg-muted/10">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "p-2 bg-blue-100 dark:bg-blue-500/10",
                                    "text-blue-600 dark:text-blue-400 rounded-lg"
                                )}>
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
                                            <AvatarFallback className={cn(
                                                "text-xl bg-gradient-to-br",
                                                "from-violet-500 to-indigo-600 text-white"
                                            )}>
                                                {user?.name?.charAt(0).toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <label
                                            htmlFor="avatar-upload"
                                            onClick={handleUploadClick}
                                            className={cn(
                                                "absolute inset-0 flex items-center justify-center",
                                                "bg-black/50 rounded-full opacity-0",
                                                "group-hover:opacity-100 transition-opacity cursor-pointer"
                                            )}
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
                                        <Input id="fullName" name="fullName" defaultValue={user?.name} className={cn(
                                            "bg-background border-input",
                                            "focus:bg-background transition-colors"
                                        )} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="company" className="flex items-center gap-2 text-foreground">
                                            <Building2 className="w-3.5 h-3.5" /> {t("auth.company")}
                                        </Label>
                                        <Input id="company" name="company" defaultValue={user?.company} className={cn(
                                            "bg-background border-input",
                                            "focus:bg-background transition-colors"
                                        )} />
                                    </div>
                                </div>

                                {/* Company Logo Upload */}
                                <div className="flex items-center gap-6 pb-6 border-b">
                                    <div className="relative group">
                                        <div className={cn(
                                            "w-20 h-20 rounded-lg border-2 border-dashed",
                                            "border-border flex items-center justify-center",
                                            "bg-muted/20 overflow-hidden",
                                            "group-hover:border-primary/50 transition-colors relative"
                                        )}>
                                            {displayLogoUrl ? (
                                                <NextImage src={displayLogoUrl} alt="Company Logo" fill className="object-contain" unoptimized />
                                            ) : (
                                                <Building2 className="w-8 h-8 text-muted-foreground/30" />
                                            )}
                                        </div>
                                        <label
                                            htmlFor="logo-upload"
                                            onClick={handleUploadClick}
                                            className={cn(
                                                "absolute inset-0 flex items-center justify-center",
                                                "bg-black/50 rounded-lg opacity-0",
                                                "group-hover:opacity-100 transition-opacity cursor-pointer"
                                            )}
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
                                            onChange={(e) => {
                                                handleUploadClick()
                                                handleLogoUpload(e)
                                            }}
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
                                    <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                                        {isSaving ? (
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "w-4 h-4 border-2 border-white/30 border-t-white",
                                                    "rounded-full animate-spin"
                                                )} />
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
                                <CardTitle className="text-lg text-foreground">{t("settings.dangerZone") as string}</CardTitle>
                            </div>
                            <CardDescription className="text-muted-foreground">{t("settings.deleteWarning") as string}</CardDescription>
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
                        <CardHeader className={cn(
                            "bg-gradient-to-r from-muted/50 via-muted/30 to-background",
                            "dark:from-muted/20 dark:to-transparent border-b"
                        )}>
                            <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                                {t("settings.currentPlanTitle")}
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-sm font-semibold shadow-sm",
                                    user?.plan === "pro"
                                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                                        : user?.plan === "plus"
                                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                                            : "bg-secondary text-secondary-foreground"
                                )}>
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
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                user?.plan !== "free" ? "bg-green-500" : "bg-yellow-500"
                                            )} />
                                            {user?.plan === "pro"
                                                ? t("plans.features.unlimitedCatalogs")
                                                : user?.plan === "plus"
                                                    ? t("plans.features.catalogsCount", { count: 10 })
                                                    : t("plans.features.catalogsCount", { count: 1 })}
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                user?.plan !== "free" ? "bg-green-500" : "bg-yellow-500"
                                            )} />
                                            {user?.plan !== "free"
                                                ? t("plans.features.unlimitedProducts")
                                                : t("plans.features.productLimit", { count: 50 })}
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                user?.plan !== "free" ? "bg-green-500" : "bg-muted"
                                            )} />
                                            {user?.plan !== "free"
                                                ? t("plans.features.categoryManagement")
                                                : t("plans.features.noCategoryManagement")}
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                user?.plan !== "free" ? "bg-green-500" : "bg-yellow-500"
                                            )} />
                                            {user?.plan !== "free"
                                                ? t("plans.features.premiumTemplates")
                                                : t("plans.features.basicTemplates")}
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                user?.plan === "pro"
                                                    ? "bg-green-500"
                                                    : user?.plan === "plus" ? "bg-green-500" : "bg-muted"
                                            )} />
                                            {user?.plan === "pro"
                                                ? t("plans.features.advancedAnalytics")
                                                : user?.plan === "plus"
                                                    ? t("plans.features.basicExport")
                                                    : t("plans.features.noAnalytics")}
                                        </li>
                                    </ul>
                                </div>

                                {(user?.plan === "free" || user?.plan === "plus") && (
                                    <div className={cn(
                                        "flex flex-col items-center justify-center p-6",
                                        "bg-gradient-to-br from-indigo-50 to-purple-50",
                                        "dark:from-indigo-950/20 dark:to-purple-950/20",
                                        "rounded-xl border border-indigo-100",
                                        "dark:border-indigo-500/20 text-center space-y-4"
                                    )}>
                                        <h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-lg">
                                            {user?.plan === "plus" ? t("plans.upgradeToPro") : t("plans.upgrade")}
                                        </h3>
                                        <p className="text-sm text-indigo-700/80 dark:text-indigo-200/60">
                                            {user?.plan === "plus" ? t("plans.upgradeDescPro") : t("plans.upgradeDescPlus")}
                                        </p>
                                        <Button
                                            size="lg"
                                            onClick={() => setShowUpgrade(true)}
                                            className={cn(
                                                "w-full bg-gradient-to-r from-indigo-600 to-purple-600",
                                                "hover:from-indigo-700 hover:to-purple-700",
                                                "shadow-lg shadow-indigo-500/20 text-white font-semibold"
                                            )}
                                        >
                                            {user?.plan === "plus" ? t("plans.upgradeToProBtn") : t("plans.viewPlans")}
                                        </Button>
                                    </div>
                                )}
                                {user?.plan === "pro" && (
                                    <div className={cn(
                                        "flex flex-col items-center justify-center p-6",
                                        "bg-green-50 dark:bg-green-950/20 rounded-xl",
                                        "border border-green-100 dark:border-green-500/20",
                                        "text-center space-y-4"
                                    )}>
                                        <h3 className="font-bold text-green-900 dark:text-green-300 text-lg">{t("settings.greatChoice")}</h3>
                                        <p className="text-sm text-green-700/80 dark:text-green-200/60">{t("settings.planDescPro")}</p>
                                        <Button variant="outline" className={cn(
                                            "w-full border-green-200 dark:border-green-500/30",
                                            "text-green-700 dark:text-green-400",
                                            "hover:bg-green-100 dark:hover:bg-green-900/40"
                                        )}>
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
                                <div className={cn(
                                    "p-2 bg-orange-100 dark:bg-orange-500/10",
                                    "text-orange-600 dark:text-orange-400 rounded-lg"
                                )}>
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
                                    className={cn(
                                        "flex-1 h-auto py-4 justify-start px-4 gap-3",
                                        "relative overflow-hidden transition-all duration-300",
                                        language === 'tr'
                                            ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background'
                                            : 'hover:bg-muted/50 dark:hover:bg-muted/20'
                                    )}
                                >
                                    <span className="text-2xl">🇹🇷</span>
                                    <div className="flex flex-col items-start">
                                        <span className={cn(
                                            "font-semibold",
                                            language === 'tr' ? 'text-primary-foreground' : 'text-foreground'
                                        )}>Türkçe</span>
                                        <span className={cn(
                                            "text-xs opacity-70",
                                            language === 'tr' ? 'text-primary-foreground' : 'text-muted-foreground'
                                        )}>{t("settings.defaultLanguage")}</span>
                                    </div>
                                    {language === 'tr' && <CheckCircle2 className="w-5 h-5 ml-auto text-primary-foreground" />}
                                </Button>

                                <Button
                                    variant={language === 'en' ? 'default' : 'outline'}
                                    onClick={() => setLanguage('en')}
                                    className={cn(
                                        "flex-1 h-auto py-4 justify-start px-4 gap-3",
                                        "relative overflow-hidden transition-all duration-300",
                                        language === 'en'
                                            ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background'
                                            : 'hover:bg-muted/50 dark:hover:bg-muted/20'
                                    )}
                                >
                                    <span className="text-2xl">🇺🇸</span>
                                    <div className="flex flex-col items-start">
                                        <span className={cn(
                                            "font-semibold",
                                            language === 'en' ? 'text-primary-foreground' : 'text-foreground'
                                        )}>English</span>
                                        <span className={cn(
                                            "text-xs opacity-70",
                                            language === 'en' ? 'text-primary-foreground' : 'text-muted-foreground'
                                        )}>{t("settings.international")}</span>
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
