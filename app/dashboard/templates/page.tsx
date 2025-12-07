import { getTemplates } from "@/lib/actions/catalogs"
import { TemplatesPageClient } from "@/components/templates/templates-page-client"

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return <TemplatesPageClient templates={templates} />
}
