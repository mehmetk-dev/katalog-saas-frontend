"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BookOpen, Loader2, Lock, Plus, Search, SearchX, X } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"
import { CatalogCard, type CatalogCardAction } from "@/components/catalogs/catalog-card"
import { ShareModal } from "@/components/catalogs/share-modal"
import { createCatalog, deleteCatalog, duplicateCatalog, updateCatalog, type Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import { getCatalogShareUrl } from "@/lib/catalog-url"
import { getPlanLimits, type PlanType } from "@/lib/constants"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useUser } from "@/lib/contexts/user-context"
import { cn } from "@/lib/utils"

const PREVIEW_PRODUCTS_PER_CATALOG = 6
type StatusFilter = "all" | "published" | "draft"

interface CatalogsPageClientProps {
  initialCatalogs: Catalog[]
  userProducts: Product[]
  userPlan?: PlanType
}

function isLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  return message.includes("limit")
}

function formatRelative(date: string, locale: string): string {
  const diffSeconds = (new Date(date).getTime() - Date.now()) / 1000
  if (!Number.isFinite(diffSeconds)) return ""
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ]
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) return rtf.format(Math.round(diffSeconds / seconds), unit)
  }
  return rtf.format(0, "minute")
}

export function CatalogsPageClient({ initialCatalogs, userProducts, userPlan = "free" }: CatalogsPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshUser, adjustCatalogsCount } = useUser()
  const { t: baseT, language } = useTranslation()
  const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
  const locale = language === "en" ? "en-US" : "tr-TR"

  const [catalogs, setCatalogs] = useState(initialCatalogs)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [isCreating, setIsCreating] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [shareCatalog, setShareCatalog] = useState<Catalog | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Catalog | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Catalog | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  useEffect(() => {
    setCatalogs(initialCatalogs)
  }, [initialCatalogs])

  // Builder'dan ?limit_reached=true ile gelinirse planları göster ve URL'i temizle
  useEffect(() => {
    if (searchParams.get("limit_reached") === "true") {
      setShowUpgradeModal(true)
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [searchParams])

  const { maxCatalogs } = getPlanLimits(userPlan)
  const hasLimit = Number.isFinite(maxCatalogs)
  const isAtLimit = hasLimit && catalogs.length >= maxCatalogs
  const lockedCount = catalogs.filter((catalog) => catalog.is_disabled).length

  const productsById = useMemo(() => new Map(userProducts.map((product) => [product.id, product])), [userProducts])

  const statusCounts = useMemo(() => {
    const published = catalogs.filter((catalog) => catalog.is_published).length
    return { all: catalogs.length, published, draft: catalogs.length - published }
  }, [catalogs])

  const filteredCatalogs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale)
    return catalogs.filter((catalog) => {
      if (statusFilter === "published" && !catalog.is_published) return false
      if (statusFilter === "draft" && catalog.is_published) return false
      if (!query) return true
      return (
        catalog.name.toLocaleLowerCase(locale).includes(query) ||
        (catalog.description?.toLocaleLowerCase(locale).includes(query) ?? false)
      )
    })
  }, [catalogs, locale, search, statusFilter])

  const handleNewCatalog = async () => {
    if (isAtLimit) {
      setShowUpgradeModal(true)
      return
    }

    setIsCreating(true)
    try {
      const date = new Date().toLocaleDateString(locale)
      const newCatalog = await createCatalog({ name: `${t("catalogs.newCatalog")} - ${date}`, layout: "modern-grid" })
      adjustCatalogsCount(1)
      router.push(`/dashboard/builder?id=${newCatalog.id}`)
    } catch (error) {
      setIsCreating(false)
      if (isLimitError(error)) {
        setShowUpgradeModal(true)
        return
      }
      toast.error(error instanceof Error && error.message ? error.message : t("catalogs.createFailed"))
    }
  }

  const handleDuplicate = useCallback(async (catalog: Catalog) => {
    if (isAtLimit) {
      setShowUpgradeModal(true)
      return
    }

    setDuplicatingId(catalog.id)
    try {
      const copy = await duplicateCatalog(catalog.id, `${catalog.name} ${t("catalogs.copySuffix")}`)
      setCatalogs((prev) => [copy, ...prev])
      adjustCatalogsCount(1)
      toast.success(t("catalogs.duplicated"), {
        action: { label: t("catalogs.edit"), onClick: () => router.push(`/dashboard/builder?id=${copy.id}`) },
      })
      router.refresh()
    } catch (error) {
      if (isLimitError(error)) {
        setShowUpgradeModal(true)
      } else {
        toast.error(t("catalogs.duplicateFailed"))
      }
    } finally {
      setDuplicatingId(null)
    }
  }, [adjustCatalogsCount, isAtLimit, router, t])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteCatalog(deleteTarget.id, deleteTarget.is_published ? deleteTarget.share_slug : null)
      setCatalogs((prev) => prev.filter((catalog) => catalog.id !== deleteTarget.id))
      adjustCatalogsCount(-1)
      toast.success(t("toasts.catalogDeleted"))
      setDeleteTarget(null)
      // Kilitli kataloglar sıraya göre hesaplanır; silme sonrası sunucudan tazele
      router.refresh()
      void refreshUser()
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("catalogs.deleteFailed"))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRename = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!renameTarget) return
    const name = renameValue.trim()
    if (!name || name === renameTarget.name) {
      setRenameTarget(null)
      return
    }

    setIsRenaming(true)
    try {
      await updateCatalog(renameTarget.id, { name }, { publicSlug: renameTarget.is_published ? renameTarget.share_slug : null })
      setCatalogs((prev) => prev.map((catalog) => (catalog.id === renameTarget.id ? { ...catalog, name } : catalog)))
      toast.success(t("catalogs.renamed"))
      setRenameTarget(null)
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("catalogs.renameFailed"))
    } finally {
      setIsRenaming(false)
    }
  }

  const copyShareLink = useCallback(async (catalog: Catalog) => {
    if (!catalog.share_slug) return
    try {
      await navigator.clipboard.writeText(getCatalogShareUrl(catalog.share_slug))
      toast.success(t("toasts.linkCopied"))
    } catch {
      toast.error(t("catalogs.copyFailed"))
    }
  }, [t])

  const handleCardAction = useCallback((action: CatalogCardAction, catalog: Catalog) => {
    switch (action) {
      case "rename":
        setRenameValue(catalog.name)
        setRenameTarget(catalog)
        break
      case "duplicate":
        void handleDuplicate(catalog)
        break
      case "copyLink":
        void copyShareLink(catalog)
        break
      case "share":
        setShareCatalog(catalog)
        break
      case "delete":
        setDeleteTarget(catalog)
        break
      case "upgrade":
        setShowUpgradeModal(true)
        break
    }
  }, [copyShareLink, handleDuplicate])

  const hasFilters = search.trim() !== "" || statusFilter !== "all"

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={t("catalogs.title")}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {t("catalogs.subtitle")}
            {hasLimit && (
              <Badge variant="secondary" className="font-normal tabular-nums">
                {t("catalogs.catalogCount", { count: catalogs.length, max: maxCatalogs })}
              </Badge>
            )}
          </span>
        }
        actions={
          <Button onClick={handleNewCatalog} disabled={isCreating} className="w-full gap-2 sm:w-auto">
            {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t("catalogs.createNew")}
          </Button>
        }
      />

      {lockedCount > 0 ? (
        <Alert variant="warning">
          <Lock />
          <AlertTitle>{t("catalogs.lockedBannerTitle", { count: lockedCount })}</AlertTitle>
          <AlertDescription>
            <p>{t("catalogs.lockedBannerDesc", { max: maxCatalogs })}</p>
            <Button size="sm" variant="outline" className="mt-2 bg-card" onClick={() => setShowUpgradeModal(true)}>
              {t("catalogs.upgradePlan")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : isAtLimit ? (
        <Alert variant="info">
          <Lock />
          <AlertTitle>{t("catalogs.limitReached")}</AlertTitle>
          <AlertDescription>
            <p>{t("catalogs.limitDesc", { max: maxCatalogs })}</p>
            <Button size="sm" variant="outline" className="mt-2 bg-card" onClick={() => setShowUpgradeModal(true)}>
              {t("catalogs.upgradePlan")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {catalogs.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("catalogs.searchPlaceholder")}
              aria-label={t("catalogs.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t("catalogs.clearSearch")}
                className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div role="radiogroup" aria-label={t("catalogs.status")} className="flex w-fit rounded-md border bg-card p-0.5">
            {(["all", "published", "draft"] as const).map((status) => (
              <button
                key={status}
                type="button"
                role="radio"
                aria-checked={statusFilter === status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded px-3 text-sm transition-colors",
                  statusFilter === status ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`catalogs.filter.${status}`)}
                <span className="text-xs tabular-nums text-muted-foreground">{statusCounts[status]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {catalogs.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t("catalogs.noCatalogsYet")}
          description={t("catalogs.createFirstDesc")}
          action={
            <Button onClick={handleNewCatalog} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {t("catalogs.createCatalog")}
            </Button>
          }
        />
      ) : filteredCatalogs.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t("catalogs.noResults")}
          description={t("catalogs.noResultsDesc")}
          action={
            hasFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setStatusFilter("all")
                }}
              >
                {t("catalogs.clearFilters")}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredCatalogs.map((catalog) => {
            const previewProducts = (catalog.product_ids || [])
              .slice(0, PREVIEW_PRODUCTS_PER_CATALOG)
              .map((id) => productsById.get(id))
              .filter((product): product is Product => !!product)

            return (
              <div key={catalog.id} className={cn(duplicatingId === catalog.id && "pointer-events-none opacity-60")}>
                <CatalogCard
                  catalog={catalog}
                  previewProducts={previewProducts}
                  updatedLabel={t("catalogs.updatedAt", { time: formatRelative(catalog.updated_at, locale) })}
                  onAction={handleCardAction}
                  t={t}
                />
              </div>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("catalogs.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.is_published
                ? t("catalogs.deleteDescPublished", { name: deleteTarget?.name })
                : t("catalogs.deleteDescNamed", { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("catalogs.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // Dialog istek bitene kadar açık kalsın
                event.preventDefault()
                void handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              {t("catalogs.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && !isRenaming && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRename} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t("catalogs.renameTitle")}</DialogTitle>
              <DialogDescription>{t("catalogs.renameDesc")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="catalog-rename">{t("catalogs.name")}</Label>
              <Input
                id="catalog-rename"
                value={renameValue}
                maxLength={255}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                disabled={isRenaming}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)} disabled={isRenaming}>
                {t("catalogs.cancel")}
              </Button>
              <Button type="submit" disabled={isRenaming || !renameValue.trim()}>
                {isRenaming && <Loader2 className="size-4 animate-spin" />}
                {t("catalogs.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} plan={userPlan} />

      <ShareModal
        open={!!shareCatalog}
        onOpenChange={(open) => !open && setShareCatalog(null)}
        catalog={shareCatalog}
        isPublished={!!shareCatalog?.is_published}
        shareUrl={shareCatalog?.share_slug ? getCatalogShareUrl(shareCatalog.share_slug) : ""}
      />
    </div>
  )
}
