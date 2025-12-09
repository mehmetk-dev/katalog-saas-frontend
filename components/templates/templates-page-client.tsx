"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Palette, FileText } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { type CatalogTemplate, createCatalog } from "@/lib/actions/catalogs"
import { toast } from "sonner"
import { useState, useTransition } from "react"
import { CatalogPreview } from "../catalogs/catalog-preview"
import { PREVIEW_PRODUCTS } from "./preview-data"
import { ResponsiveContainer } from "@/components/ui/responsive-container"
import Image from "next/image"

interface TemplatesPageClientProps {
  templates: CatalogTemplate[]
}

export function TemplatesPageClient({ templates }: TemplatesPageClientProps) {
  const router = useRouter()
  const { user } = useUser()
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState<Record<string, boolean>>({})

  const isFreeUser = user?.plan === "free"

  const handleUseTemplate = (template: CatalogTemplate) => {
    if (template.is_premium && isFreeUser) {
      toast.error("Premium şablonları kullanmak için Pro'ya geçin")
      return
    }

    setLoadingId(template.id)
    startTransition(async () => {
      try {
        const catalog = await createCatalog({
          name: `Yeni ${template.name} Kataloğu`,
          template_id: template.id,
          layout: template.layout,
        })
        toast.success("Katalog oluşturuldu!")
        router.push(`/dashboard/builder?id=${catalog.id}`)
      } catch {
        toast.error("Katalog oluşturulamadı")
      }
      setLoadingId(null)
    })
  }

  const togglePreview = (id: string) => {
    setShowPreview(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Şablonlar</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Kataloğunuzu oluşturmaya başlamak için bir şablon seçin</p>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Palette className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">Henüz şablon bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden group hover:shadow-md transition-shadow ring-1 ring-gray-200 border-0">
              {/* Template Preview / Image */}
              <div className="relative border-b group-hover:opacity-95 transition-opacity bg-gray-50/50">
                {/* Fotoğraf varsa göster, yoksa preview */}
                {template.thumbnail_url && !showPreview[template.id] ? (
                  <div className="aspect-[4/3] relative">
                    <img
                      src={template.thumbnail_url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fotoğraf yüklenemezse preview'a geç
                        setShowPreview(prev => ({ ...prev, [template.id]: true }))
                      }}
                    />
                    {/* Preview toggle button */}
                    <button
                      onClick={() => togglePreview(template.id)}
                      className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Önizleme
                    </button>
                  </div>
                ) : (
                  <ResponsiveContainer>
                    <CatalogPreview
                      layout={template.layout}
                      name={template.name}
                      products={PREVIEW_PRODUCTS}
                    />
                    {template.thumbnail_url && (
                      <button
                        onClick={() => togglePreview(template.id)}
                        className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Fotoğraf
                      </button>
                    )}
                  </ResponsiveContainer>
                )}

                {/* Pro Lock Overlay */}
                {template.is_premium && isFreeUser && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
                    <div className="text-center">
                      <Lock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs sm:text-sm font-medium">Pro Şablon</p>
                    </div>
                  </div>
                )}

                {/* Hover overlay button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 duration-300">
                  <Button variant="secondary" size="default" className="rounded-full px-4 sm:px-8 font-semibold shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                    disabled={(template.is_premium && isFreeUser) || isPending}
                    onClick={() => handleUseTemplate(template)}
                  >
                    {template.is_premium && isFreeUser ? "Pro Gerekli" : loadingId === template.id ? "Oluşturuluyor..." : "Kullan"}
                  </Button>
                </div>
              </div>

              <CardContent className="p-3 sm:p-4 bg-white relative z-20">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm sm:text-base truncate">{template.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground capitalize">{template.layout} düzeni</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {template.is_premium && <Badge variant="secondary" className="bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 border-0 text-xs">Premium</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
