"use client"

import { Lock, Palette } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/lib/contexts/user-context"
import { type CatalogTemplate, createCatalog } from "@/lib/actions/catalogs"
import { getPlanLimits } from "@/lib/constants"
import { ResponsiveContainer } from "@/components/ui/responsive-container"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"

import { CatalogPreview } from "../catalogs/catalog-preview"

import { getPreviewProductsByLayout } from "./preview-data"
import { PageHeader } from "@/components/ui/page-header"

interface TemplatesPageClientProps {
  templates: CatalogTemplate[]
}

export function TemplatesPageClient({ templates }: TemplatesPageClientProps) {
  const { user, refreshUser, adjustCatalogsCount } = useUser()
  const { t } = useTranslation()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const isFreeUser = user?.plan === "free"
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const catalogLimit = getPlanLimits(user?.plan).maxCatalogs
  const isLimitReached = (user?.catalogsCount || 0) >= catalogLimit

  const handleUseTemplate = (template: CatalogTemplate) => {
    if (template.is_premium && isFreeUser) {
      setShowUpgradeModal(true)
      return
    }

    if (isLimitReached) {
      setShowUpgradeModal(true)
      return
    }

    setLoadingId(template.id)
    void (async () => {
      try {
        const catalog = await createCatalog({
          name: t('builder.newCatalog'),
          template_id: template.id,
          layout: template.layout,
        })

        adjustCatalogsCount(1)
        toast.success(t('toasts.catalogCreated'))

        // Kullanıcı limit bilgilerini arka planda güncelle; navigasyonu bekletme
        refreshUser().catch(() => { })

        // Bu akışta zaman zaman push beklemede kalabildiği için hard navigation
        window.location.href = `/dashboard/builder?id=${catalog.id}`
      } catch (error) {
        console.error("Template create error:", error)
        toast.error((error instanceof Error ? error.message : typeof error === 'string' ? error : t('toasts.catalogSaveFailed')))
        setLoadingId(null)
      }
    })()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title={t("sidebar.templates")} description={t("dashboard.templatesSubtitle")} />

      {templates.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Palette className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">{t('common.noTemplates')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden group hover:shadow-md transition-shadow ring-1 ring-border border-0 bg-card">
              {/* Template Preview - Her şablon kendi temasına uygun ürünlerle */}
              <div className="relative border-b group-hover:opacity-95 transition-opacity bg-muted/30 dark:bg-muted/50">
                <ResponsiveContainer>
                  <CatalogPreview
                    layout={template.layout}
                    catalogName={template.name}
                    products={getPreviewProductsByLayout(template.layout)}
                  />
                </ResponsiveContainer>

                {/* Pro Lock Overlay */}
                {template.is_premium && isFreeUser && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
                    <div className="text-center">
                      <Lock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs sm:text-sm font-medium text-foreground">{t("templatesPage.premiumTemplate")}</p>
                    </div>
                  </div>
                )}

                {/* Hover overlay button - Fixed Layout */}
                {/* Dokunmatik ekranda her zaman, farede üzerine gelince görünür */}
                <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 bg-gradient-to-t from-foreground/60 to-transparent p-4 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
                  <div className="flex w-full flex-col items-center gap-2 text-center">
                    <Button
                      variant="secondary"
                      size="default"
                      className="min-w-32"
                      disabled={loadingId === template.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUseTemplate(template)
                      }}
                    >
                      {loadingId === template.id
                        ? t("templatesPage.preparing")
                        : (template.is_premium && isFreeUser)
                          ? t("templatesPage.premiumRequired")
                          : isLimitReached ? t("templatesPage.limitReached") : t("templatesPage.use")}
                    </Button>

                    {(isLimitReached || (template.is_premium && isFreeUser)) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowUpgradeModal(true)
                        }}
                        className="text-xs font-medium text-background underline underline-offset-4"
                      >
                        {t("templatesPage.viewPlans")}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="p-3 sm:p-4 bg-card relative z-20">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm sm:text-base truncate text-foreground">{template.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{template.description || t("templatesPage.defaultDescription")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {template.is_premium && <Badge variant="secondary" className="text-xs">{t("templatesPage.premiumBadge")}</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  )
}
