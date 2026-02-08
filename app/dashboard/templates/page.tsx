import { Metadata } from "next"
import { getTemplates } from "@/lib/actions/catalogs"
import { TemplatesPageClient } from "@/components/templates/templates-page-client"

export const metadata: Metadata = {
  title: "Şablonlar",
  description: "Kataloglarınız için profesyonel şablonlar seçin.",
}

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return <TemplatesPageClient templates={templates} />
}
