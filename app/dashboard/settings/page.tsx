"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUser } from "@/lib/user-context"
import { useTranslation } from "@/lib/i18n-provider"
import { updateProfile, deleteAccount } from "@/lib/actions/auth"
import { toast } from "sonner"
import Link from "next/link"
import { UpgradeModal } from "@/components/builder/upgrade-modal"
import { Skeleton } from "@/components/ui/skeleton"
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
import { User, CreditCard, Globe, Trash2, CheckCircle2, Building2, Mail, Camera, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error("Lütfen bir resim dosyası seçin")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dosya boyutu 2MB'dan küçük olmalı")
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
      toast.error("Lütfen bir resim dosyası seçin")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dosya boyutu 2MB'dan küçük olmalı")
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
        let avatarPublicUrl = user.avatar_url
        let logoPublicUrl = user.logo_url
        let dbUpdateNeeded = false
        const dbUpdates: any = {}

        // 1. Upload Avatar if pending
        if (pendingAvatarFile) {
          setIsUploadingAvatar(true)
          const fileExt = pendingAvatarFile.name.split('.').pop()
          const fileName = `${user.id}-${Date.now()}.${fileExt}`
          const filePath = `avatars/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, pendingAvatarFile, { upsert: true })

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

          avatarPublicUrl = publicUrl
          dbUpdates.avatar_url = publicUrl
          dbUpdateNeeded = true
          setIsUploadingAvatar(false)
        }

        // 2. Upload Logo if pending
        if (pendingLogoFile) {
          setIsUploadingLogo(true)
          const fileExt = pendingLogoFile.name.split('.').pop()
          const fileName = `logo-${user.id}-${Date.now()}.${fileExt}`
          const filePath = `company-logos/${fileName}`
          const bucketName = 'product-images'

          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, pendingLogoFile, { upsert: true })

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath)

          logoPublicUrl = publicUrl
          dbUpdates.logo_url = publicUrl
          dbUpdateNeeded = true
          setIsUploadingLogo(false)
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

        toast.success("Profil başarıyla güncellendi")
      } catch (error: any) {
        console.error("Save profile error:", error)
        let msg = "Profil güncellenemedi"
        if (error?.message) msg += `: ${error.message}`
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
      toast.success("Hesabınız silindi")
      window.location.href = "/auth"
    } catch {
      toast.error("Hesap silinemedi")
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
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">Hesabınızı ve tercihlerinizi yönetin.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-muted/50 p-1">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <User className="w-4 h-4" />
            {t("settings.profile")}
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard className="w-4 h-4" />
            Abonelik
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Globe className="w-4 h-4" />
            Tercihler
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300">
          <Card className="border-0 shadow-md ring-1 ring-gray-200">
            <CardHeader className="pb-4 border-b bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Kişisel Bilgiler</CardTitle>
                  <CardDescription>İsminiz ve şirket bilgileriniz.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-center gap-6 pb-6 border-b">
                  <div className="relative group">
                    <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                      <AvatarImage src={displayAvatarUrl || undefined} alt={user?.name} />
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
                    <h3 className="font-medium text-gray-900">Profil Fotoğrafı</h3>
                    <p className="text-sm text-muted-foreground">
                      Fotoğrafınızı değiştirmek için tıklayın. JPG, PNG (max 2MB)
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2 text-gray-700">
                      <User className="w-3.5 h-3.5" /> {t("auth.name")}
                    </Label>
                    <Input id="fullName" name="fullName" defaultValue={user?.name} className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-2 text-gray-700">
                      <Building2 className="w-3.5 h-3.5" /> {t("auth.company")}
                    </Label>
                    <Input id="company" name="company" defaultValue={user?.company} className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors" />
                  </div>
                </div>

                {/* Company Logo Upload */}
                <div className="flex items-center gap-6 pb-6 border-b">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden group-hover:border-primary/50 transition-colors">
                      {user?.logo_url ? (
                        <img src={user.logo_url} alt="Company Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-300" />
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
                    <h3 className="font-medium text-gray-900">Şirket Logosu</h3>
                    <p className="text-sm text-muted-foreground">
                      Kataloglarınızda kullanılacak şirket logosu. JPG, PNG (max 2MB)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-3.5 h-3.5" /> {t("auth.email")}
                  </Label>
                  <Input id="email" type="email" defaultValue={user?.email} disabled className="bg-muted text-muted-foreground" />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isPending} className="min-w-[120px]">
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Kaydediliyor
                      </div>
                    ) : (
                      t("common.save")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 shadow-sm ring-1 ring-destructive/10">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                <CardTitle className="text-lg">Tehlikeli Bölge</CardTitle>
              </div>
              <CardDescription>{t("settings.deleteWarning")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="bg-destructive/90 hover:bg-destructive">
                    {t("settings.deleteAccount")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">Hesabınızı silmek istediğinize emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600">
                      Bu işlem geri alınamaz. Tüm kataloglarınız, ürünleriniz ve verileriniz kalıcı olarak silinecektir.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Siliniyor..." : "Evet, Hesabı Sil"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBSCRIPTION TAB */}
        <TabsContent value="subscription" className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300">
          <Card className="border-0 shadow-md ring-1 ring-gray-200 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <CreditCard className="w-64 h-64 -rotate-12 transform translate-x-16 -translate-y-16" />
            </div>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                Mevcut Planınız:
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user?.plan === "pro" ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg" :
                  user?.plan === "plus" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg" :
                    "bg-gray-200 text-gray-700"}`}>
                  {user?.plan === "pro" ? "PRO" : user?.plan === "plus" ? "PLUS" : "ÜCRETSİZ"}
                </span>
              </CardTitle>
              <CardDescription>
                {user?.plan === "pro"
                  ? "Tüm özelliklere sınırsız erişiminiz var. Tadını çıkarın!"
                  : user?.plan === "plus"
                    ? "Harika özelliklere sahipsiniz. Sınırsız deneyim için Pro'yu inceleyin."
                    : "Şu anda sınırlı özelliklere sahip ücretsiz planı kullanıyorsunuz."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Plan Özellikleri
                  </h3>
                  <ul className="space-y-3 pl-2">
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                      <div className={`w-2 h-2 rounded-full ${user?.plan === "pro" ? "bg-green-500" : user?.plan === "plus" ? "bg-green-500" : "bg-yellow-500"}`} />
                      {user?.plan === "pro" ? "Sınırsız Katalog" : user?.plan === "plus" ? "10 Adet Katalog" : "1 Adet Katalog"}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                      <div className={`w-2 h-2 rounded-full ${user?.plan !== "free" ? "bg-green-500" : "bg-yellow-500"}`} />
                      {user?.plan !== "free" ? "Sınırsız Ürün" : "50 Ürün Limiti"}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                      <div className={`w-2 h-2 rounded-full ${user?.plan !== "free" ? "bg-green-500" : "bg-gray-300"}`} />
                      {user?.plan !== "free" ? "Kategori Yönetimi" : "Kategori Yönetimi Yok"}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                      <div className={`w-2 h-2 rounded-full ${user?.plan !== "free" ? "bg-green-500" : "bg-yellow-500"}`} />
                      {user?.plan !== "free" ? "Premium Şablonlar & Filigransız" : "Temel Şablonlar (Filigranlı)"}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                      <div className={`w-2 h-2 rounded-full ${user?.plan === "pro" ? "bg-green-500" : user?.plan === "plus" ? "bg-green-500" : "bg-gray-300"}`} />
                      {user?.plan === "pro" ? "Gelişmiş Analitik" : user?.plan === "plus" ? "Temel İhracat" : "Analitik Yok"}
                    </li>
                  </ul>
                </div>

                {(user?.plan === "free" || user?.plan === "plus") && (
                  <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 text-center space-y-4">
                    <h3 className="font-bold text-indigo-900 text-lg">
                      {user?.plan === "plus" ? "Pro'ya Geçin" : "Yükseltin"}
                    </h3>
                    <p className="text-sm text-indigo-700/80">
                      {user?.plan === "plus" ? "Sınırsız özgürlük için Pro planına geçin." : "İşinizi büyütmek için daha fazla özelliğe erişin."}
                    </p>
                    <Button size="lg" onClick={() => setShowUpgrade(true)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/20 text-white font-semibold">
                      {user?.plan === "plus" ? "Pro'ya Yükselt" : "Planları İncele"}
                    </Button>
                  </div>
                )}
                {user?.plan === "pro" && (
                  <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-xl border border-green-100 text-center space-y-4">
                    <h3 className="font-bold text-green-900 text-lg">Harika Seçim!</h3>
                    <p className="text-sm text-green-700/80">Pro üyelik ile tüm özelliklerin keyfini çıkarıyorsunuz.</p>
                    <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-100">
                      Fatura Geçmişi
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300">
          <Card className="border-0 shadow-md ring-1 ring-gray-200">
            <CardHeader className="pb-4 border-b bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t("settings.language")}</CardTitle>
                  <CardDescription>{t("settings.selectLanguage")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant={language === 'tr' ? 'default' : 'outline'}
                  onClick={() => setLanguage('tr')}
                  className={`flex-1 h-auto py-4 justify-start px-4 gap-3 ${language === 'tr' ? 'ring-2 ring-primary ring-offset-2' : 'hover:bg-gray-50'}`}
                >
                  <span className="text-2xl">🇹🇷</span>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">Türkçe</span>
                    <span className="text-xs opacity-70">Varsayılan dil</span>
                  </div>
                  {language === 'tr' && <CheckCircle2 className="w-5 h-5 ml-auto text-white" />}
                </Button>

                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  onClick={() => setLanguage('en')}
                  className={`flex-1 h-auto py-4 justify-start px-4 gap-3 ${language === 'en' ? 'ring-2 ring-primary ring-offset-2' : 'hover:bg-gray-50'}`}
                >
                  <span className="text-2xl">🇺🇸</span>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">English</span>
                    <span className="text-xs opacity-70">International</span>
                  </div>
                  {language === 'en' && <CheckCircle2 className="w-5 h-5 ml-auto text-white" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
