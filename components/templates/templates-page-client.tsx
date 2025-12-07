"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Palette } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { type CatalogTemplate, createCatalog } from "@/lib/actions/catalogs"
import { toast } from "sonner"
import { useState, useTransition } from "react"

// Default template images mapping
const templateImages: Record<string, string> = {
  grid: "/minimalist-product-catalog-template.jpg",
  cards: "/elegant-grid-fashion-catalog-template.jpg",
  list: "/classic-list-wholesale-catalog-template.jpg",
  masonry: "/modern-cards-electronics-catalog-template.jpg",
  magazine: "/bold-magazine-style-catalog-template.jpg",
}

interface TemplatesPageClientProps {
  templates: CatalogTemplate[]
}

export function TemplatesPageClient({ templates }: TemplatesPageClientProps) {
  const router = useRouter()
  const { user } = useUser()
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const isFreeUser = user?.plan === "free"

  const handleUseTemplate = (template: CatalogTemplate) => {
    if (template.is_premium && isFreeUser) {
      toast.error("Upgrade to Pro to use premium templates")
      return
    }

    setLoadingId(template.id)
    startTransition(async () => {
      try {
        const catalog = await createCatalog({
          name: `New ${template.name} Catalog`,
          template_id: template.id,
          layout: template.layout,
        })
        toast.success("Catalog created!")
        router.push(`/dashboard/builder?id=${catalog.id}`)
      } catch {
        toast.error("Failed to create catalog")
      }
      setLoadingId(null)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-muted-foreground">Choose a template to start building your catalog</p>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <Palette className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No templates available yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden group">
              <div className="relative aspect-[3/2] bg-muted">
                <img
                  src={
                    template.thumbnail_url ||
                    templateImages[template.layout] ||
                    "/placeholder.svg?height=200&width=300&query=catalog template"
                  }
                  alt={template.name}
                  className="object-cover w-full h-full"
                />
                {template.is_premium && isFreeUser && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Pro Template</p>
                    </div>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{template.layout} layout</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.is_premium && <Badge variant="secondary">Pro</Badge>}
                    <Button
                      size="sm"
                      disabled={(template.is_premium && isFreeUser) || isPending}
                      onClick={() => handleUseTemplate(template)}
                    >
                      {loadingId === template.id ? "Creating..." : "Use"}
                    </Button>
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
