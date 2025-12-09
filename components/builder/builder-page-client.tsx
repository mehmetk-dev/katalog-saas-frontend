"use client"

import { useState, useTransition, useId, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CatalogEditor } from "@/components/builder/catalog-editor"
import { CatalogPreview } from "@/components/builder/catalog-preview"
import { UpgradeModal } from "@/components/builder/upgrade-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Share2, Save, ArrowLeft, Eye, Pencil, Globe, MoreVertical, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/lib/user-context"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Catalog, createCatalog, updateCatalog, publishCatalog } from "@/lib/actions/catalogs"
import { type Product } from "@/lib/actions/products"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BuilderPageClientProps {
  catalog: Catalog | null
  products: Product[]
}

export function BuilderPageClient({ catalog, products }: BuilderPageClientProps) {
  const router = useRouter()
  const { user, canExport, refreshUser } = useUser()
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
  const [isMobile, setIsMobile] = useState(false)
  // Yeni kişiselleştirme state'leri
  const [columnsPerRow, setColumnsPerRow] = useState(catalog?.columns_per_row || 3)
  const [backgroundColor, setBackgroundColor] = useState(catalog?.background_color || '#ffffff')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(catalog?.background_image || null)
  const [backgroundImageFit, setBackgroundImageFit] = useState<string>(catalog?.background_image_fit || 'cover')
  const [backgroundGradient, setBackgroundGradient] = useState<string | null>(catalog?.background_gradient || null)
  const [logoUrl, setLogoUrl] = useState<string | null>(catalog?.logo_url || null)
  const [logoPosition, setLogoPosition] = useState<string>(catalog?.logo_position || 'top-left')
  const [logoSize, setLogoSize] = useState<string>(catalog?.logo_size || 'medium')
  const tabsId = useId()

  // Ürünleri selectedProductIds sırasına göre sırala (kullanıcının belirlediği sıra)
  const selectedProducts = selectedProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined)

  // Ekran boyutunu takip et
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 // md breakpoint
      setIsMobile(mobile)
      // Mobilde varsayılan olarak editor görünümü
      if (mobile && view === "split") {
        setView("editor")
      } else if (!mobile && view !== "split") {
        setView("split")
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, []) // Only run on mount

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
            columns_per_row: columnsPerRow,
            background_color: backgroundColor,
            background_image: backgroundImage,
            background_image_fit: backgroundImageFit as any,
            background_gradient: backgroundGradient,
            logo_url: logoUrl,
            logo_position: logoPosition as any,
            logo_size: logoSize as any,
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
            columns_per_row: columnsPerRow,
            background_color: backgroundColor,
            background_image: backgroundImage,
            background_image_fit: backgroundImageFit as any,
            background_gradient: backgroundGradient,
            logo_url: logoUrl,
            logo_position: logoPosition as any,
            logo_size: logoSize as any,
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

  const handleDownloadPDF = async () => {
    try {
      toast.info("İndirme işlemi başlatılıyor...", { id: "pdf-process" })

      if (!canExport()) {
        toast.dismiss("pdf-process")
        setShowUpgradeModal(true)
        return
      }

      // Mobilde önizleme görünümüne geç
      const previousView = view
      if (view === 'editor') {
        setView('preview')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      toast.loading("Görseller işleniyor ve PDF hazırlanıyor...", { id: "pdf-process" })

      const { toPng } = await import("html-to-image")
      const { jsPDF } = await import("jspdf")

      let container = document.getElementById('catalog-preview-container')
      if (!container) {
        setView('split')
        await new Promise(resolve => setTimeout(resolve, 1000))
        container = document.getElementById('catalog-preview-container')
      }

      if (!container) throw new Error("Önizleme alanı bulunamadı.")

      // Find Pages
      const pages = container.querySelectorAll('.catalog-page')
      if (pages.length === 0) throw new Error("Sayfa yapısı bulunamadı. Lütfen sayfayı yenileyin.")

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Process Each Page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement
        toast.loading(`Sayfa ${i + 1} / ${pages.length} hazırlanıyor...`, { id: "pdf-process" })

        // Clone Page individually
        const clone = page.cloneNode(true) as HTMLElement
        document.body.appendChild(clone)

        // Reset styles for capture
        clone.style.position = 'fixed'
        clone.style.top = '0'
        clone.style.left = '0'
        clone.style.zIndex = '-9999'
        clone.style.transform = 'none'
        clone.style.margin = '0'
        clone.style.boxShadow = 'none'
        clone.style.width = '794px'
        clone.style.height = '1123px'

        try {
          // Process Images
          const images = clone.querySelectorAll('img')
          const imagePromises = Array.from(images).map(async (img) => {
            try {
              if (!img.src || img.src.startsWith('data:')) return

              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 8000)

              const response = await fetch(img.src, {
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit'
              })
              clearTimeout(timeoutId)

              if (!response.ok) throw new Error('Network error')

              const blob = await response.blob()
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })

              img.src = base64
              img.style.display = 'block'
              img.removeAttribute('crossOrigin')
              img.removeAttribute('srcset')
              img.removeAttribute('loading')

            } catch (e) {
              console.warn("Image skipped:", img.src)
              img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              img.style.objectFit = 'contain'
            }
          })

          await Promise.allSettled(imagePromises)
          await new Promise(r => setTimeout(r, 500))

          const imgData = await toPng(clone, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            cacheBust: true,
          })

          if (i > 0) pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

        } finally {
          if (document.body.contains(clone)) {
            document.body.removeChild(clone)
          }
        }
      }

      pdf.save(`${catalogName || 'Katalog'}.pdf`)

      // PDF başarıyla indirildikten SONRA export hakkını kullan
      const { incrementUserExports } = await import("@/lib/actions/user")
      const result = await incrementUserExports()

      if (!result.error) {
        // Kullanıcı limitini güncelle
        await refreshUser()
      }

      // Önceki görünüme dön
      setView(previousView)

      toast.dismiss("pdf-process")
      toast.success("PDF başarıyla indirildi!")

    } catch (err: any) {
      console.error("PDF Fail:", err)
      const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      toast.dismiss("pdf-process")
      toast.error("PDF Başarısız: " + msg)
    }
  }

  const handleShare = () => {
    if (!currentCatalogId || !catalog?.share_slug) {
      toast.error("Lütfen önce katalogu kaydedin")
      return
    }

    const shareUrl = `${window.location.origin}/catalog/${catalog.share_slug}`
    navigator.clipboard.writeText(shareUrl)

    if (!isPublished) {
      toast.success("Link kopyalandı! (Katalog henüz yayında değil)")
    } else {
      toast.success("Paylaşım linki kopyalandı!")
    }
  }

  // Görünüm modunu mobil için kontrol et
  const effectiveView = isMobile ? (view === "split" ? "editor" : view) : view

  return (
    <div className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] flex flex-col -m-3 sm:-m-4 md:-m-6 overflow-hidden">
      {/* Header */}
      <div className="h-12 sm:h-14 border-b bg-background flex items-center justify-between px-2 sm:px-4 shrink-0 gap-2">
        {/* Sol taraf - Geri ve Input */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <Input
            value={catalogName}
            onChange={(e) => setCatalogName(e.target.value)}
            className="h-8 sm:h-9 font-medium text-sm min-w-0 flex-1 max-w-[180px] sm:max-w-[240px] md:max-w-[300px]"
            placeholder="Katalog Başlığı"
          />
          {isPublished && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full shrink-0">
              <Globe className="w-3 h-3" />
              Yayında
            </span>
          )}
        </div>

        {/* Sağ taraf - Aksiyonlar */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobil görünüm seçici */}
          {isMobile && (
            <Tabs value={effectiveView} onValueChange={(v) => setView(v as typeof view)} id={`${tabsId}-mobile`}>
              <TabsList className="h-8">
                <TabsTrigger value="editor" className="text-xs px-2 gap-1" suppressHydrationWarning>
                  <Pencil className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs px-2 gap-1" suppressHydrationWarning>
                  <Eye className="w-3 h-3" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Masaüstü görünüm seçici */}
          {!isMobile && (
            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="hidden md:block" id={tabsId}>
              <TabsList className="h-9">
                <TabsTrigger value="split" className="text-xs px-3" suppressHydrationWarning>
                  Bölünmüş
                </TabsTrigger>
                <TabsTrigger value="editor" className="text-xs px-3 gap-1" suppressHydrationWarning>
                  <Pencil className="w-3 h-3" />
                  Düzenleyici
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs px-3 gap-1" suppressHydrationWarning>
                  <Eye className="w-3 h-3" />
                  Önizleme
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="h-6 w-px bg-border mx-1 hidden md:block" />

          {/* Masaüstünde görünen butonlar */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
              onClick={handleSave}
              disabled={isPending}
            >
              <Save className="w-4 h-4" />
              <span className="hidden md:inline">{isPending ? "Kaydediliyor..." : "Kaydet"}</span>
            </Button>

            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              <span className="hidden lg:inline">Paylaş</span>
            </Button>

            <Button
              variant={isPublished ? "outline" : "default"}
              size="sm"
              className="gap-2"
              onClick={handlePublish}
              disabled={isPending || !currentCatalogId}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden lg:inline">{isPublished ? "Yayından Kaldır" : "Yayınla"}</span>
            </Button>

            {isPublished && catalog?.share_slug && (
              <Button variant="ghost" size="sm" className="gap-2" asChild>
                <a href={`/catalog/${catalog.share_slug}`} target="_blank">
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden xl:inline">Görüntüle</span>
                </a>
              </Button>
            )}
          </div>

          <Button size="sm" className="gap-2" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>

          {/* Mobil menü */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSave} disabled={isPending}>
                <Save className="w-4 h-4 mr-2" />
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Paylaş
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePublish} disabled={isPending || !currentCatalogId}>
                <Globe className="w-4 h-4 mr-2" />
                {isPublished ? "Yayından Kaldır" : "Yayınla"}
              </DropdownMenuItem>
              {isPublished && catalog?.share_slug && (
                <DropdownMenuItem asChild>
                  <a href={`/catalog/${catalog.share_slug}`} target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Kataloğu Görüntüle
                  </a>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(effectiveView === "split" || effectiveView === "editor") && (
          <div className={`${effectiveView === "split" ? "w-1/2" : "w-full"} border-r overflow-auto`}>
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
              userPlan={user?.plan || "free"}
              onUpgrade={() => setShowUpgradeModal(true)}
              columnsPerRow={columnsPerRow}
              onColumnsPerRowChange={setColumnsPerRow}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={setBackgroundColor}
              backgroundImage={backgroundImage}
              onBackgroundImageChange={setBackgroundImage}
              backgroundImageFit={backgroundImageFit}
              onBackgroundImageFitChange={setBackgroundImageFit}
              backgroundGradient={backgroundGradient}
              onBackgroundGradientChange={setBackgroundGradient}
              logoUrl={logoUrl}
              onLogoUrlChange={setLogoUrl}
              logoPosition={logoPosition}
              onLogoPositionChange={setLogoPosition}
              logoSize={logoSize}
              onLogoSizeChange={setLogoSize}
            />
          </div>
        )}

        {/* Preview */}
        {(effectiveView === "split" || effectiveView === "preview") && (
          <div id="catalog-preview-container" className={`${effectiveView === "split" ? "w-1/2" : "w-full"} bg-muted/30 overflow-auto`}>
            <CatalogPreview
              catalogName={catalogName}
              products={selectedProducts}
              layout={layout}
              primaryColor={primaryColor}
              showPrices={showPrices}
              showDescriptions={showDescriptions}
              columnsPerRow={columnsPerRow}
              backgroundColor={backgroundColor}
              backgroundImage={backgroundImage}
              backgroundImageFit={backgroundImageFit as any}
              backgroundGradient={backgroundGradient}
              logoUrl={logoUrl}
              logoPosition={logoPosition}
              logoSize={logoSize}
            />
          </div>
        )}
      </div>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  )
}
