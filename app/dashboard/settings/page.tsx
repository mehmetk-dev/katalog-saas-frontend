import { Metadata } from "next"
import SettingsPageClient from "@/components/settings/settings-page-client"

export const metadata: Metadata = {
  title: "Ayarlar",
  description: "Hesap tercihlerinizi ve aboneliğinizi yönetin.",
}

export default function SettingsPage() {
  return <SettingsPageClient />
}
