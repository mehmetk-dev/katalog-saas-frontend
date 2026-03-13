"use client"

import type React from "react"
import NextImage from "next/image"
import { Building2, Camera, Globe, Instagram, Link2, Loader2, Mail, Trash2, User, Youtube } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { User as AppUser } from "@/lib/contexts/user-context"
import type { Language } from "@/lib/translations"
import { cn } from "@/lib/utils"

import { SocialUrlField } from "@/components/settings/social-url-field"
import { validateInstagramUrl, validateWebsiteUrl, validateYoutubeUrl } from "@/components/settings/social-url-validators"

type TFunction = (key: string, params?: Record<string, unknown>) => string

interface ProfileTabProps {
  displayAvatarUrl?: string | null
  displayLogoUrl?: string | null
  ensureSession: () => Promise<void>
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleDeleteAccount: () => Promise<void>
  handleLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleSaveProfile: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  isDeleting: boolean
  isSaving: boolean
  isUploadingAvatar: boolean
  isUploadingLogo: boolean
  language: Language
  t: TFunction
  user: AppUser | null
}

export function ProfileTab({
  displayAvatarUrl,
  displayLogoUrl,
  ensureSession,
  handleAvatarUpload,
  handleDeleteAccount,
  handleLogoUpload,
  handleSaveProfile,
  isDeleting,
  isSaving,
  isUploadingAvatar,
  isUploadingLogo,
  language,
  t,
  user,
}: ProfileTabProps) {
  return (
    <>
      <Card className="border-0 shadow-md ring-1 ring-border bg-card">
        <CardHeader className="pb-4 border-b bg-muted/30 dark:bg-muted/10">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 bg-blue-100 dark:bg-blue-500/10", "text-blue-600 dark:text-blue-400 rounded-lg")}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">{t("settings.personalInfo")}</CardTitle>
              <CardDescription className="text-muted-foreground">{t("settings.personalInfoDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={(event) => void handleSaveProfile(event)} className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b">
              <div className="relative group">
                <Avatar className="w-20 h-20 border-4 border-white dark:border-background shadow-lg">
                  <AvatarImage src={displayAvatarUrl || undefined} alt={user?.name} className="dark:brightness-100" />
                  <AvatarFallback className={cn("text-xl bg-gradient-to-br", "from-violet-500 to-indigo-600 text-white")}>
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  onClick={() => {
                    void ensureSession()
                  }}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    "bg-black/50 rounded-full opacity-0",
                    "group-hover:opacity-100 transition-opacity cursor-pointer",
                  )}
                >
                  {isUploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
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
                <p className="text-sm text-muted-foreground">{t("settings.photoDesc")}</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2 text-foreground">
                  <User className="w-3.5 h-3.5" />
                  {t("auth.name")}
                </Label>
                <Input id="fullName" name="fullName" defaultValue={user?.name} className={cn("bg-background border-input", "focus:bg-background transition-colors")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2 text-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  {t("auth.company")}
                </Label>
                <Input id="company" name="company" defaultValue={user?.company} className={cn("bg-background border-input", "focus:bg-background transition-colors")} />
              </div>
            </div>

            <div className="flex items-center gap-6 pb-6 border-b">
              <div className="relative group">
                <div
                  className={cn(
                    "w-20 h-20 rounded-lg border-2 border-dashed",
                    "border-border flex items-center justify-center",
                    "bg-muted/20 overflow-hidden",
                    "group-hover:border-primary/50 transition-colors relative",
                  )}
                >
                  {displayLogoUrl ? (
                    <NextImage src={displayLogoUrl} alt="Company Logo" fill className="object-contain" unoptimized />
                  ) : (
                    <Building2 className="w-8 h-8 text-muted-foreground/30" />
                  )}
                </div>
                <label
                  htmlFor="logo-upload"
                  onClick={() => {
                    void ensureSession()
                  }}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    "bg-black/50 rounded-lg opacity-0",
                    "group-hover:opacity-100 transition-opacity cursor-pointer",
                  )}
                >
                  {isUploadingLogo ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
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
                <p className="text-sm text-muted-foreground">{t("settings.logoDesc")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-foreground">
                <Mail className="w-3.5 h-3.5" />
                {t("auth.email")}
              </Label>
              <Input id="email" type="email" defaultValue={user?.email} disabled className="bg-muted text-muted-foreground" />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Sosyal Medya &amp; Web</h3>
                <span className="text-xs text-muted-foreground">(isteðe baðlý)</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-1">
                <SocialUrlField
                  id="instagramUrl"
                  name="instagramUrl"
                  label="Instagram"
                  icon={<Instagram className="w-3.5 h-3.5 text-pink-500" />}
                  placeholder="https://instagram.com/kullanici"
                  defaultValue={user?.instagram_url}
                  validate={(value) => validateInstagramUrl(value, language)}
                />

                <SocialUrlField
                  id="youtubeUrl"
                  name="youtubeUrl"
                  label="YouTube"
                  icon={<Youtube className="w-3.5 h-3.5 text-red-500" />}
                  placeholder="https://youtube.com/@kanal"
                  defaultValue={user?.youtube_url}
                  validate={(value) => validateYoutubeUrl(value, language)}
                />

                <SocialUrlField
                  id="websiteUrl"
                  name="websiteUrl"
                  label="Web Sitesi"
                  icon={<Globe className="w-3.5 h-3.5 text-blue-500" />}
                  placeholder="https://sirketiniz.com"
                  defaultValue={user?.website_url}
                  validate={(value) => validateWebsiteUrl(value, language)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 pb-2 md:pb-0">
              <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <span className={cn("w-4 h-4 border-2 border-white/30 border-t-white", "rounded-full animate-spin")} />
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
                <AlertDialogDescription className="text-muted-foreground">{t("settings.deleteConfirmDesc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    void handleDeleteAccount()
                  }}
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
    </>
  )
}
