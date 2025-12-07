"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CatalogEditor } from "@/components/builder/catalog-editor"
import { CatalogPreview } from "@/components/builder/catalog-preview"
import { UpgradeModal } from "@/components/builder/upgrade-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Share2, Save, ArrowLeft, Eye, Pencil, Globe, Check } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/lib/user-context"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Catalog, type Product, createCatalog, updateCatalog, publishCatalog } from "@/lib/actions/catalogs"
import { toast } from "sonner"

interface BuilderPageClientProps {
  catalog: Catalog | null
  products: Product[]
}

export function BuilderPageClient({ catalog, products }: BuilderPageClientProps) {
  const router = useRouter()
  const { user, canExport } = useUser()
  const [isPending, startTransition] = useTransition()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [catalogName, setCatalogName] = useState(catalog?.name || "Yeni Katalog")
  const [catalogDescription, setCatalogDescription] = useState(catalog?.description || "")
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(catalog?.product_ids || [])
  const [layout, setLayout] = useState(catalog?.layout || "grid")
  const [primaryColor, setPrimaryColor] = useState(catalog?.primary_color || "#7c3aed")
  const [showPrices, setShowPrices] = useState(catalog?.show_prices ?? true)
  const [showDescriptions, setShowDescriptions] = useState(catalog?.show_descriptions ?? true)
  const [view, setView] = useState<"split" | "editor" | "preview">("split")
  const [currentCatalogId, setCurrentCatalogId] = useState(catalog?.id || null)
  const [isPublished, setIsPublished] = useState(catalog?.is_published || false)

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id))

  const handleSave = () => {
    startTransition(async () => {
      try {
        if (currentCatalogId) {
          await updateCatalog(currentCatalogId, {
            name: catalogName,
            description: catalogDescription,
            product_ids: selectedProductIds,
            layout,
            primary_color: primaryColor,
            show_prices: showPrices,
            show_descriptions: showDescriptions,
          })
          toast.success("Katalog kaydedildi!")
        } else {
          const newCatalog = await createCatalog({
            name: catalogName,
            description: catalogDescription,
            layout,
          })
          setCurrentCatalogId(newCatalog.id)
          await updateCatalog(newCatalog.id, {
            product_ids: selectedProductIds,
            primary_color: primaryColor,
            show_prices: showPrices,
            show_descriptions: showDescriptions,
          })
          router.replace(`/dashboard/builder?id=${newCatalog.id}`)
          toast.success("Katalog oluşturuldu!")
        }
      } catch {
        toast.error("Katalog kaydedilemedi")
      }
    })
  }

  const handlePublish = () => {
    if (!currentCatalogId) {
      toast.error("Lütfen önce katalogu kaydedin")
      return
    }

    startTransition(async () => {
      try {
        await publishCatalog(currentCatalogId, !isPublished)
        setIsPublished(!isPublished)
        toast.success(isPublished ? "Katalog yayından kaldırıldı" : "Katalog yayınlandı!")
      } catch {
        toast.error("Yayın durumu güncellenemedi")
      }
    })
  }

  const handleDownloadPDF = () => {
    if (!canExport()) {
      setShowUpgradeModal(true)
      return
    }
    toast.info("PDF indirme yakında!")
  }

  const handleShare = () => {
    if (!currentCatalogId) {
      toast.error("Lütfen önce katalogu kaydedin")
      return
    }

    if (!isPublished) {
      toast.error("Lütfen önce katalogu yayınlayın")
      return
    }

    const shareUrl = `${window.location.origin}/catalog/${catalog?.share_slug}`
    navigator.clipboard.writeText(shareUrl)
    toast.success("Paylaşım linki kopyalandı!")
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6">
      {/* Builder Header */}
      <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <Input
            value={catalogName}
            onChange={(e) => setCatalogName(e.target.value)}
            className="w-64 h-9 font-medium"
          />
          {isPublished && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full">
              <Globe className="w-3 h-3" />
              Yayında
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle - Only on larger screens */}
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="hidden lg:block">
            <TabsList className="h-9">
              <TabsTrigger value="split" className="text-xs px-3">
                Bölünmüş
              </TabsTrigger>
              <TabsTrigger value="editor" className="text-xs px-3 gap-1">
                <Pencil className="w-3 h-3" />
                Düzenleyici
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs px-3 gap-1">
                <Eye className="w-3 h-3" />
                Önizleme
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="h-6 w-px bg-border mx-2 hidden lg:block" />

          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
            onClick={handleSave}
            disabled={isPending}
          >
            <Save className="w-4 h-4" />
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button
            variant={isPublished ? "secondary" : "outline"}
            size="sm"
            className="gap-2"
            onClick={handlePublish}
            disabled={isPending || !currentCatalogId}
          >
            {isPublished ? <Check className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
            {isPublished ? "Yayında" : "Yayınla"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Paylaş
          </Button>
          <Button size="sm" className="gap-2" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        {(view === "split" || view === "editor") && (
          <div className={`${view === "split" ? "w-1/2" : "w-full"} border-r overflow-auto`}>
            <CatalogEditor
              products={products}
              selectedProductIds={selectedProductIds}
              onSelectedProductIdsChange={setSelectedProductIds}
              catalogName={catalogName}
              onCatalogNameChange={setCatalogName}
              description={catalogDescription}
              onDescriptionChange={setCatalogDescription}
              layout={layout}
              onLayoutChange={setLayout}
              primaryColor={primaryColor}
              onPrimaryColorChange={setPrimaryColor}
              showPrices={showPrices}
              onShowPricesChange={setShowPrices}
              showDescriptions={showDescriptions}
              onShowDescriptionsChange={setShowDescriptions}
            />
          </div>
        )}

        {/* Preview Panel */}
        {(view === "split" || view === "preview") && (
          <div className={`${view === "split" ? "w-1/2" : "w-full"} bg-muted/30 overflow-auto`}>
            <CatalogPreview
              catalogName={catalogName}
              products={selectedProducts}
              layout={layout}
              primaryColor={primaryColor}
              showPrices={showPrices}
              showDescriptions={showDescriptions}
            />
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  )
}
