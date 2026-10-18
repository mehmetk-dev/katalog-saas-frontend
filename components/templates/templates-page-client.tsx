"use client"

import { Lock, Palette } from "lucide-react"
import { toast } from "sonner"
import { useMemo, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/lib/contexts/user-context"
import { type CatalogTemplate, createCatalog } from "@/lib/actions/catalogs"
import { TEMPLATES, getPlanLimits } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ResponsiveContainer } from "@/components/ui/responsive-container"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"

import { CatalogPreview } from "../catalogs/catalog-preview"

import { getPreviewProductsByLayout } from "./preview-data"
import { PageHeader } from "@/components/ui/page-header"

interface TemplatesPageClientProps {
  templates: CatalogTemplate[]
}

type TemplateFilter = "all" | "free" | "premium"

/** DB'de açıklaması boş şablonlar için yedek açıklama (sabit liste yalnızca Türkçe) */
const FALLBACK_DESCRIPTIONS = new Map(TEMPLATES.map((template) => [template.id, template.description]))

export function TemplatesPageClient({ templates }: TemplatesPageClientProps) {
  const { user, refreshUser, adjustCatalogsCount } = useUser()
  const { t, language } = useTranslation()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<TemplateFilter>("all")

  const counts = useMemo(() => {
    const premium = templates.filter((template) => template.is_premium).length
    return { all: templates.length, free: templates.length - premium, premium }
  }, [templates])
  const visibleTemplates = templates.filter((template) =>
    filter === "all" || (filter === "premium" ? template.is_premium : !template.is_premium))

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

      {templates.length > 0 && counts.premium > 0 && counts.free > 0 && (
        // Kataloglar sayfasındaki durum seçiciyle aynı görünüm
        <div role="radiogroup" aria-label={t("templatesPage.filterLabel")} className="flex w-fit rounded-md border bg-card p-0.5">
          {(["all", "free", "premium"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded px-3 text-sm transition-colors",
                filter === value ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(value === "all" ? "templatesPage.filterAll" : value === "free" ? "templatesPage.filterFree" : "templatesPage.filterPremium")}
              <span className="text-xs tabular-nums text-muted-foreground">{counts[value]}</span>
            </button>
          ))}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Palette className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">{t('common.noTemplates')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] sm:gap-4">
          {visibleTemplates.map((template) => {
            const locked = template.is_premium && isFreeUser
            const description = template.description || (language === "tr" ? FALLBACK_DESCRIPTIONS.get(template.id) : undefined)
            return (
            <Card key={template.id} className="group gap-0 overflow-hidden py-0 transition-[box-shadow,border-color] hover:border-foreground/20 hover:shadow-md">
              {/* Template Preview - Her şablon kendi temasına uygun ürünlerle */}
              <div className="relative border-b group-hover:opacity-95 transition-opacity bg-muted/30 dark:bg-muted/50">
                <ResponsiveContainer>
                  <CatalogPreview
                    layout={template.layout}
                    catalogName={template.name}
                    products={getPreviewProductsByLayout(template.layout)}
                  />
                </ResponsiveContainer>

                {/* Kilitli şablon: tasarım görünür kalır (eskiden önizlemenin tamamı örtülüyordu), köşede kilit */}
                {locked && (
                  <span className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-full border bg-background/95 px-2 py-0.5 text-xs font-medium text-foreground shadow-sm">
                    <Lock className="size-3" />
                    {t("templatesPage.premiumTemplate")}
                  </span>
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
                        : locked
                          ? t("templatesPage.premiumRequired")
                          : isLimitReached ? t("templatesPage.limitReached") : t("templatesPage.use")}
                    </Button>

                    {(isLimitReached || locked) && (
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

              <CardContent className="relative z-20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-foreground">{template.name}</h3>
                    {description && <p className="line-clamp-1 text-xs text-muted-foreground" title={description}>{description}</p>}
                  </div>
                  {template.is_premium
                    ? <Badge variant="secondary" className="shrink-0">{t("templatesPage.premiumBadge")}</Badge>
                    : <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">{t("templatesPage.freeBadge")}</Badge>}
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  )
}
