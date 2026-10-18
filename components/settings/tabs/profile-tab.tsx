"use client"

import type React from "react"
import NextImage from "next/image"
import { Building2, Globe, Instagram, Loader2, Trash2, Youtube } from "lucide-react"

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

import { PasswordCard } from "@/components/settings/password-card"
import { SocialUrlField } from "@/components/settings/social-url-field"
import { validateInstagramUrl, validateWebsiteUrl, validateYoutubeUrl } from "@/components/settings/social-url-validators"

type TFunction = (key: string, params?: Record<string, unknown>) => string

interface ImageUploadRowProps {
  inputId: string
  title: string
  description: string
  buttonLabel: string
  isUploading: boolean
  preview: React.ReactNode
  onBeforeOpen: () => Promise<void>
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

/** Görsel önizleme + açıklama + "Yükle" düğmesi (eskiden yükleme yalnızca fareyle üzerine gelince görünüyordu) */
function ImageUploadRow({ inputId, title, description, buttonLabel, isUploading, preview, onBeforeOpen, onChange }: ImageUploadRowProps) {
  return (
    <div className="flex items-center gap-4">
      {preview}
      <div className="min-w-0 space-y-1.5">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline" size="sm" className={cn("h-8", isUploading && "pointer-events-none opacity-60")}>
          <label htmlFor={inputId} onClick={() => void onBeforeOpen()} className="cursor-pointer">
            {isUploading && <Loader2 className="size-3.5 animate-spin" />}
            {buttonLabel}
          </label>
        </Button>
        <input id={inputId} type="file" accept="image/*" onChange={onChange} className="hidden" disabled={isUploading} />
      </div>
    </div>
  )
}

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
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">{t("settings.personalInfo")}</CardTitle>
          <CardDescription>{t("settings.personalInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void handleSaveProfile(event)} className="space-y-6">
            {/* Profil fotoğrafı ve şirket logosu yan yana; yükleme dokunmatikte de görünür düğmeyle */}
            <div className="grid gap-4 border-b pb-6 sm:grid-cols-2">
              <ImageUploadRow
                inputId="avatar-upload"
                title={t("settings.profilePhoto")}
                description={t("settings.photoDesc")}
                buttonLabel={displayAvatarUrl ? t("common.change") : t("common.upload")}
                isUploading={isUploadingAvatar}
                onBeforeOpen={ensureSession}
                onChange={handleAvatarUpload}
                preview={
                  <Avatar className="size-16 border">
                    <AvatarImage src={displayAvatarUrl || undefined} alt={user?.name} />
                    <AvatarFallback className="bg-muted text-lg font-medium text-muted-foreground">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                }
              />
              <ImageUploadRow
                inputId="logo-upload"
                title={t("settings.companyLogo")}
                description={t("settings.logoDesc")}
                buttonLabel={displayLogoUrl ? t("common.change") : t("common.upload")}
                isUploading={isUploadingLogo}
                onBeforeOpen={ensureSession}
                onChange={handleLogoUpload}
                preview={
                  <div className={cn("relative flex size-16 items-center justify-center overflow-hidden rounded-lg border bg-muted/40", !displayLogoUrl && "border-dashed")}>
                    {displayLogoUrl ? (
                      <NextImage src={displayLogoUrl} alt={t("settings.companyLogo")} fill className="object-contain p-1" unoptimized />
                    ) : (
                      <Building2 className="size-6 text-muted-foreground/50" />
                    )}
                  </div>
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.name")}</Label>
                <Input id="fullName" name="fullName" defaultValue={user?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t("auth.company")}</Label>
                <Input id="company" name="company" defaultValue={user?.company} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" type="email" defaultValue={user?.email} disabled className="bg-muted text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="text-sm font-medium text-foreground">
                {t("settings.socialAndWeb")} <span className="font-normal text-muted-foreground">{t("productForm.optional")}</span>
              </h3>
              <SocialUrlField
                id="instagramUrl"
                name="instagramUrl"
                label="Instagram"
                icon={<Instagram className="size-4" />}
                placeholder={t("settings.instagramPlaceholder")}
                defaultValue={user?.instagram_url}
                validate={(value) => validateInstagramUrl(value, language)}
              />
              <SocialUrlField
                id="youtubeUrl"
                name="youtubeUrl"
                label="YouTube"
                icon={<Youtube className="size-4" />}
                placeholder={t("settings.youtubePlaceholder")}
                defaultValue={user?.youtube_url}
                validate={(value) => validateYoutubeUrl(value, language)}
              />
              <SocialUrlField
                id="websiteUrl"
                name="websiteUrl"
                label={t("settings.website")}
                icon={<Globe className="size-4" />}
                placeholder={t("settings.websitePlaceholder")}
                defaultValue={user?.website_url}
                validate={(value) => validateWebsiteUrl(value, language)}
              />
            </div>

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {isSaving ? t("settings.saving") : t("common.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <PasswordCard email={user?.email} t={t} />

      {/* Tehlikeli bölge: tek satır, sağda düğme */}
      <Card className="gap-0 border-destructive/30 py-0">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">{t("settings.dangerZone")}</h3>
            <p className="text-sm text-muted-foreground">{t("settings.deleteWarning")}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="size-4" />
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
