"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Search, MoreVertical, Pencil, Trash2, Eye, Share2, Lock, QrCode, Download, Shield, Zap, Sparkles } from "lucide-react"
import { toast } from "sonner"
import NextImage from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteCatalog, type Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import { ResponsiveContainer } from "@/components/ui/responsive-container"
import { UpgradeModal } from "@/components/builder/upgrade-modal"
import { useTranslation } from "@/lib/i18n-provider"

import { CatalogPreview } from "./catalog-preview"



interface CatalogsPageClientProps {
  initialCatalogs: Catalog[]
  userProducts: Product[]
  userPlan?: "free" | "plus" | "pro"
}

// Plan limitleri
const CATALOG_LIMITS = {
  free: 1,
  plus: 10,
  pro: Infinity,
}


export function CatalogsPageClient({ initialCatalogs, userProducts, userPlan = "free" }: CatalogsPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [catalogs, setCatalogs] = useState(initialCatalogs)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(searchParams.get("limit_reached") === "true")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [qrCatalog, setQrCatalog] = useState<{ name: string; slug: string } | null>(null)

  // URL'deki "limit_reached=true" parametresini modal açıldıktan sonra temizle
  useEffect(() => {
    if (searchParams.get("limit_reached") === "true") {
      const newPath = window.location.pathname
      // window.history.replaceState Next.js router'ı tetiklemeden URL'i sessizce temizler
      window.history.replaceState({}, "", newPath)
    }
  }, [searchParams])

  const maxCatalogs = CATALOG_LIMITS[userPlan]
  const isAtLimit = catalogs.length >= maxCatalogs
  const isFreeUser = userPlan === "free"
  const { t } = useTranslation()

  const filteredCatalogs = catalogs.filter(
    (catalog) =>
      catalog.name.toLowerCase().includes(search.toLowerCase()) ||
      catalog.description?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async () => {
    if (!deleteId) return

    const result = await deleteCatalog(deleteId)
    if (result.success) {
      setCatalogs(catalogs.filter((c) => c.id !== deleteId))
      toast.success(t('toasts.catalogDeleted'))
    } else {
      toast.error((result as { error?: string }).error || t('catalogs.deleteFailed'))
    }
    setDeleteId(null)
  }

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/catalog/${slug}`
    navigator.clipboard.writeText(url)
    toast.success(t('toasts.linkCopied'))
  }

  const handleNewCatalog = () => {
    if (isAtLimit) {
      setShowLimitModal(true)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("catalogs.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("catalogs.subtitle")}
            {isFreeUser && (
              <Badge variant="secondary" className="ml-2 font-normal">
                {t("catalogs.catalogCount", { count: catalogs.length, max: maxCatalogs })}
              </Badge>
            )}
          </p>
        </div>
        {isAtLimit ? (
          <Button onClick={handleNewCatalog} className="w-full sm:w-auto gap-2">
            <Lock className="w-4 h-4" />
            {t("catalogs.createNew")}
          </Button>
        ) : (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/builder">
              <Plus className="w-4 h-4 mr-2" />
              {t("catalogs.createNew")}
            </Link>
          </Button>
        )}
      </div>

      {/* Limit Warning for Free Users */}
      {isFreeUser && isAtLimit && (
        <Card className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-violet-200/50 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("catalogs.limitReached")}</p>
                <p className="text-sm text-muted-foreground">{t("catalogs.limitDesc")}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25"
            >
              {t("catalogs.upgradePlan")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("catalogs.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Catalogs Grid */}
      {filteredCatalogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-3 sm:mb-4">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1 text-sm sm:text-base">{t("catalogs.noCatalogsYet")}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 text-center">{t("catalogs.createFirstDesc")}</p>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/builder">{t("catalogs.createCatalog")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredCatalogs.map((catalog) => {
            const catalogProducts = Array.isArray(userProducts) ? userProducts.filter((p) => catalog.product_ids?.includes(p.id)) : []

            return (
              <Card key={catalog.id} className="group overflow-hidden bg-card hover:shadow-md transition-shadow border-0 shadow-sm ring-1 ring-border">
                <CardContent className="p-0 relative bg-muted/30 dark:bg-muted/50">
                  {/* Preview Container using ResponsiveContainer */}
                  <div className="relative group-hover:opacity-95 transition-opacity border-b">
                    <ResponsiveContainer>
                      <CatalogPreview
                        layout={catalog.layout}
                        name={catalog.name}
                        products={catalogProducts}
                        primaryColor={catalog.primary_color}
                        showPrices={catalog.show_prices}
                        showDescriptions={catalog.show_descriptions}
                        showAttributes={catalog.show_attributes}
                        columnsPerRow={catalog.columns_per_row}
                        backgroundColor={catalog.background_color}
                        backgroundImage={catalog.background_image}
                        backgroundImageFit={catalog.background_image_fit}
                        backgroundGradient={catalog.background_gradient}
                        logoUrl={catalog.logo_url}
                        logoPosition={catalog.logo_position}
                        logoSize={catalog.logo_size}
                        productImageFit={catalog.product_image_fit || 'cover'}
                      />
                    </ResponsiveContainer>

                    {/* Overlay for Edit or Disabled */}
                    {catalog.is_disabled ? (
                      <div className="absolute inset-0 bg-gray-900/60 flex flex-col items-center justify-center z-10 p-4 text-center backdrop-blur-[2px]">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3 border border-white/30">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-white font-bold text-sm mb-2">{t("catalogs.limitReached")}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-full shadow-lg font-bold bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                          onClick={() => setShowUpgradeModal(true)}
                        >
                          {t("catalogs.upgradePlan")}
                        </Button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 duration-300">
                        <Button variant="secondary" size="default" className="rounded-full px-4 sm:px-8 font-semibold shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300" asChild>
                          <Link href={`/dashboard/builder?id=${catalog.id}`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            {t("catalogs.edit")}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Footer Info */}
                  <div className="p-3 sm:p-4 border-t bg-card relative z-20">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        {catalog.is_disabled ? (
                          <div className="cursor-not-allowed">
                            <h3 className="font-semibold truncate text-sm sm:text-base text-muted-foreground">{catalog.name}</h3>
                          </div>
                        ) : (
                          <Link href={`/dashboard/builder?id=${catalog.id}`} className="hover:underline">
                            <h3 className="font-semibold truncate text-sm sm:text-base text-foreground">{catalog.name}</h3>
                          </Link>
                        )}
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{catalog.description || t("catalogs.noDescription")}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0 -mr-2 text-muted-foreground hover:text-foreground h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild disabled={catalog.is_disabled}>
                            {catalog.is_disabled ? (
                              <div className="flex items-center text-muted-foreground opacity-50 cursor-not-allowed w-full px-2 py-1.5 text-sm">
                                <Lock className="w-4 h-4 mr-2" />
                                {t("catalogs.edit")}
                              </div>
                            ) : (
                              <Link href={`/dashboard/builder?id=${catalog.id}`}>
                                <Pencil className="w-4 h-4 mr-2" />
                                {t("catalogs.edit")}
                              </Link>
                            )}
                          </DropdownMenuItem>
                          {catalog.is_published && catalog.share_slug && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/catalog/${catalog.share_slug}`} target="_blank">
                                  <Eye className="w-4 h-4 mr-2" />
                                  {t("catalogs.view")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyShareLink(catalog.share_slug!)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                {t("catalogs.copyLink")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setQrCatalog({ name: catalog.name, slug: catalog.share_slug! })}>
                                <QrCode className="w-4 h-4 mr-2" />
                                {t("catalogs.qrCode")}
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(catalog.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("catalogs.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 mt-2 sm:mt-3 flex-wrap">
                      <Badge variant={catalog.is_published ? "default" : "secondary"} className="rounded-sm font-normal text-xs">
                        {catalog.is_published ? t("catalogs.published") : t("catalogs.draft")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{catalog.product_ids?.length || 0} {t("catalogs.products")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">{t("catalogs.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">{t("catalogs.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">{t("catalogs.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto bg-destructive text-destructive-foreground">
              {t("catalogs.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Limit Info Modal - Premium Redesign */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="sm:max-w-md max-w-[95vw] p-0 overflow-hidden border-0 shadow-2xl flex flex-col bg-background">
          <DialogTitle className="sr-only">{t("catalogs.limitReached")}</DialogTitle>

          {/* Compact Minimalist Header */}
          <div className="relative border-b border-border bg-gradient-to-b from-background to-muted/20 pb-1">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-full bg-primary/5 blur-[80px] pointer-events-none" />

            <div className="relative px-6 pt-8 pb-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-200/50">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-center space-y-0.5">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{t("catalogs.limitReached")}</h2>
                  <p className="text-xs text-muted-foreground">{t("catalogs.limitModalDesc")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Plans Summary List */}
          <div className="p-5 space-y-3 bg-slate-50/30 dark:bg-background/20 flex-1">
            {/* Free Plan */}
            <div className="relative group p-4 rounded-2xl border border-border bg-background flex items-center gap-4 opacity-70">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground">Başlangıç</h4>
                <p className="text-[10px] text-muted-foreground">Mevcut planınız</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-foreground">1</span>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">{t("catalogs.catalog")}</p>
              </div>
            </div>

            {/* Plus Plan (Recommended) */}
            <div className="relative group p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-card flex items-center gap-4 shadow-sm ring-1 ring-blue-500/10 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                setShowLimitModal(false)
                setShowUpgradeModal(true)
              }}>
              <div className="absolute -top-2 left-6 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded-full shadow-sm uppercase tracking-tighter">
                {t("catalogs.recommended")}
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground">Profesyonel</h4>
                <p className="text-[10px] text-blue-600/70 font-medium">Büyüyen işletmeler için</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-blue-700 dark:text-blue-400">10</span>
                <p className="text-[9px] font-bold text-blue-500/50 uppercase">{t("catalogs.catalog")}</p>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative group p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-card flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                setShowLimitModal(false)
                setShowUpgradeModal(true)
              }}>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground">Business</h4>
                <p className="text-[10px] text-purple-600/70 font-medium">Sınırsız operasyon</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-purple-700 dark:text-purple-400">∞</span>
                <p className="text-[9px] font-bold text-purple-500/50 uppercase whitespace-nowrap">{t("catalogs.unlimited")}</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border flex gap-3 bg-background">
            <Button
              variant="ghost"
              onClick={() => setShowLimitModal(false)}
              className="flex-1 text-[11px] font-bold h-9 hover:bg-muted"
            >
              {t("catalogs.laterButton")}
            </Button>
            <Button
              onClick={() => {
                setShowLimitModal(false)
                setShowUpgradeModal(true)
              }}
              className="flex-1 h-9 rounded-xl font-bold transition-all text-[11px] bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {t("catalogs.viewPlans")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />

      {/* QR Code Modal - Modern Design */}
      <Dialog open={!!qrCatalog} onOpenChange={() => setQrCatalog(null)}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              {t("catalogs.share")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {qrCatalog?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 pb-4 space-y-4">
            {/* QR Code */}
            <div className="bg-card rounded-xl p-4 flex flex-col items-center border border-border">
              {qrCatalog && (
                <div className="relative w-36 h-36">
                  <NextImage
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/catalog/${qrCatalog.slug}`)}`}
                    alt="QR Code"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>

            {/* Link */}
            {qrCatalog && (
              <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
                <div className="flex-1 text-xs text-muted-foreground truncate font-mono">
                  {`${window.location.origin}/catalog/${qrCatalog.slug}`}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 h-7 px-2"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/catalog/${qrCatalog.slug}`)
                    toast.success(t('toasts.linkCopied'))
                  }}
                >
                  {t("common.copy")}
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  if (qrCatalog) {
                    window.open(`/catalog/${qrCatalog.slug}`, '_blank')
                  }
                }}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                {t("catalogs.view")}
              </Button>
              <Button
                size="sm"
                className="h-9 bg-gradient-to-r from-violet-600 to-purple-600"
                onClick={() => {
                  const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(`${window.location.origin}/catalog/${qrCatalog?.slug}`)}`;
                  window.open(url, '_blank');
                }}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {t("catalogs.downloadQr")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


