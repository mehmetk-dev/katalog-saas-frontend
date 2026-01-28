"use client"

import { useRouter } from "next/navigation"
import { Lock, Palette } from "lucide-react"
import { toast } from "sonner"
import { useState, useTransition } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/user-context"
import { type CatalogTemplate, createCatalog } from "@/lib/actions/catalogs"
import { ResponsiveContainer } from "@/components/ui/responsive-container"
import { useTranslation } from "@/lib/i18n-provider"
import { UpgradeModal } from "../builder/upgrade-modal"

import { CatalogPreview } from "../catalogs/catalog-preview"

import { getPreviewProductsByLayout } from "./preview-data"

interface TemplatesPageClientProps {
  templates: CatalogTemplate[]
}

export function TemplatesPageClient({ templates }: TemplatesPageClientProps) {
  const router = useRouter()
  const { user, refreshUser } = useUser()
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const isFreeUser = user?.plan === "free"
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Toplam katalog sayısı (dashboard'dan veya stats'tan gelmediği için user limit kontrolü)
  // userContext içinde totalCatalogs var mı kontrol edelim
  const catalogLimit = user?.plan === "pro" ? 999999 : (user?.plan === "plus" ? 10 : 1)
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
    startTransition(async () => {
      try {
        const catalog = await createCatalog({
          name: t('builder.newCatalog'),
          template_id: template.id,
          layout: template.layout,
        })
        // Katalog oluşturulduğu anda kullanıcı bilgilerini güncelle
        await refreshUser()
        toast.success(t('toasts.catalogCreated'))
        router.push(`/dashboard/builder?id=${catalog.id}`)
      } catch (error) {
        console.error("Template create error:", error)
        toast.error((error instanceof Error ? error.message : typeof error === 'string' ? error : t('toasts.catalogSaveFailed')))
      }
      setLoadingId(null)
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t('sidebar.templates')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{t('common.selectTemplate')}</p>
      </div>

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
                      <p className="text-xs sm:text-sm font-medium text-foreground">Pro Şablon</p>
                    </div>
                  </div>
                )}

                {/* Hover overlay button - Fixed Layout */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 z-30 invisible group-hover:visible">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex flex-col items-center gap-2 w-full px-4 text-center">
                    <Button
                      variant="secondary"
                      size="default"
                      className={cn(
                        "rounded-full px-8 font-bold shadow-2xl transition-all",
                        (isLimitReached || (template.is_premium && isFreeUser)) && "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                      )}
                      disabled={isPending}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUseTemplate(template)
                      }}
                    >
                      {loadingId === template.id ?
                        "Hazırlanıyor..." :
                        (template.is_premium && isFreeUser) ? "Pro Gerekli" :
                          isLimitReached ? "Limit Doldu" : "Kullan"
                      }
                    </Button>

                    {(isLimitReached || (template.is_premium && isFreeUser)) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowUpgradeModal(true)
                        }}
                        className="text-[11px] text-white/90 font-bold underline underline-offset-4 hover:text-white transition-colors bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
                      >
                        Planları İncele
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="p-3 sm:p-4 bg-card relative z-20">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm sm:text-base truncate text-foreground">{template.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground capitalize">{template.layout} düzeni</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {template.is_premium && <Badge variant="secondary" className="bg-gradient-to-r from-amber-200 to-yellow-400 dark:from-amber-900/30 dark:to-yellow-900/30 text-yellow-900 dark:text-yellow-200 border-0 text-xs">Premium</Badge>}
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
