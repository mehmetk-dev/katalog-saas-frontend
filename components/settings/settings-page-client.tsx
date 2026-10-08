"use client"

import { useCallback, useState } from "react"
import { CreditCard, Globe, User } from "lucide-react"

import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"
import { ProfileTab } from "@/components/settings/tabs/profile-tab"
import { PreferencesTab } from "@/components/settings/tabs/preferences-tab"
import { SubscriptionTab } from "@/components/settings/tabs/subscription-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useUser } from "@/lib/contexts/user-context"
import { cn } from "@/lib/utils"

import { useSettingsProfile } from "@/components/settings/hooks/use-settings-profile"

export default function SettingsPageClient() {
  const { user, setUser, isLoading, refreshUser } = useUser()
  const { language, setLanguage, t: baseT } = useTranslation()
  const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

  const [showUpgrade, setShowUpgrade] = useState(false)

  const {
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
  } = useSettingsProfile({
    user,
    setUser,
    refreshUser,
    t,
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-accent rounded" />
        <div className="grid gap-6">
          <div className="h-64 bg-muted rounded-xl" />
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
        <TabsList
          className={cn(
            "grid w-full grid-cols-3 lg:w-[480px] h-12",
            "bg-muted/80 p-1 rounded-full",
            "border border-border/50",
            "shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]",
          )}
        >
          <TabsTrigger
            value="profile"
            className={cn(
              "h-full rounded-full gap-2 font-bold",
              "text-[11px] sm:text-xs uppercase tracking-tight",
              "transition-all duration-300",
              "data-[state=active]:bg-card",
              "data-[state=active]:shadow-sm data-[state=active]:text-primary",
              "text-muted-foreground hover:text-foreground",
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
              "data-[state=active]:bg-card",
              "data-[state=active]:shadow-sm data-[state=active]:text-primary",
              "text-muted-foreground hover:text-foreground",
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
              "data-[state=active]:bg-card",
              "data-[state=active]:shadow-sm data-[state=active]:text-primary",
              "text-muted-foreground hover:text-foreground",
            )}
          >
            <Globe className="w-4 h-4" />
            <span className="truncate">{t("settings.preferences")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300 pb-6">
          <ProfileTab
            displayAvatarUrl={displayAvatarUrl}
            displayLogoUrl={displayLogoUrl}
            ensureSession={ensureSession}
            handleAvatarUpload={handleAvatarUpload}
            handleDeleteAccount={handleDeleteAccount}
            handleLogoUpload={handleLogoUpload}
            handleSaveProfile={handleSaveProfile}
            isDeleting={isDeleting}
            isSaving={isSaving}
            isUploadingAvatar={isUploadingAvatar}
            isUploadingLogo={isUploadingLogo}
            language={language}
            t={t}
            user={user}
          />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300 pb-6">
          <SubscriptionTab onUpgradeClick={() => setShowUpgrade(true)} t={t} user={user} />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300 pb-6">
          <PreferencesTab language={language} setLanguage={setLanguage} t={t} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
