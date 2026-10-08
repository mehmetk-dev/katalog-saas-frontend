"use client"

import { memo } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  Copy,
  CopyPlus,
  Eye,
  Lock,
  MoreHorizontal,
  Pencil,
  QrCode,
  Trash2,
  Type,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResponsiveContainer } from "@/components/ui/responsive-container"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import { cn } from "@/lib/utils"

const CatalogPreview = dynamic(
  () => import("@/components/builder/preview/catalog-preview").then((m) => m.CatalogPreview),
  {
    ssr: false,
    loading: () => <div className="aspect-[794/1123] w-full animate-pulse bg-muted" />,
  },
)

export type CatalogCardAction = "rename" | "duplicate" | "copyLink" | "share" | "delete" | "upgrade"

interface CatalogCardProps {
  catalog: Catalog
  previewProducts: Product[]
  updatedLabel: string
  onAction: (action: CatalogCardAction, catalog: Catalog) => void
  t: (key: string, params?: Record<string, unknown>) => string
}

function CatalogCardComponent({ catalog, previewProducts, updatedLabel, onAction, t }: CatalogCardProps) {
  const builderHref = `/dashboard/builder?id=${catalog.id}`
  const productCount = Array.isArray(catalog.product_ids) ? catalog.product_ids.length : 0
  const isLive = catalog.is_published && !!catalog.share_slug
  const locked = !!catalog.is_disabled

  const preview = (
    <ResponsiveContainer>
      <CatalogPreview
        layout={catalog.layout}
        catalogName={catalog.name}
        products={previewProducts}
        primaryColor={catalog.primary_color}
        headerTextColor={catalog.header_text_color}
        showPrices={catalog.show_prices}
        showDescriptions={catalog.show_descriptions}
        showAttributes={catalog.show_attributes}
        showSku={catalog.show_sku}
        showUrls={catalog.show_urls}
        columnsPerRow={catalog.columns_per_row}
        backgroundColor={catalog.background_color}
        backgroundImage={catalog.background_image || undefined}
        backgroundImageFit={catalog.background_image_fit || undefined}
        backgroundGradient={catalog.background_gradient || undefined}
        logoUrl={catalog.logo_url || undefined}
        logoPosition={catalog.logo_position || undefined}
        logoSize={catalog.logo_size || undefined}
        titlePosition={catalog.title_position}
        productImageFit={catalog.product_image_fit || "cover"}
        // Kartta kapak değil ilk ürün sayfası gösterilir
        enableCoverPage={false}
        enableCategoryDividers={false}
        theme={catalog.cover_theme}
        showControls={false}
      />
    </ResponsiveContainer>
  )

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-md"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 420px" }}
    >
      {/* İlk sayfanın üst kısmı yeterli; tam A4 kartlar özellikle mobilde listeyi çok uzatıyordu */}
      <div className="relative aspect-[4/3] overflow-hidden border-b bg-muted/40 sm:aspect-[794/980]">
        {locked ? (
          <>
            <div aria-hidden className="pointer-events-none opacity-40 grayscale">{preview}</div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 p-4 text-center backdrop-blur-[2px]">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Lock className="size-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{t("catalogs.lockedTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("catalogs.lockedDesc")}</p>
              </div>
              <Button size="sm" onClick={() => onAction("upgrade", catalog)}>
                {t("catalogs.upgradePlan")}
              </Button>
            </div>
          </>
        ) : (
          <Link href={builderHref} aria-label={`${t("catalogs.edit")}: ${catalog.name}`} className="block focus-visible:outline-none">
            <div aria-hidden className="pointer-events-none">{preview}</div>
            <div className="absolute inset-0 hidden items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/30 group-focus-within:bg-foreground/30 [@media(hover:hover)]:flex">
              <span className="flex translate-y-1 items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <Pencil className="size-4" />
                {t("catalogs.edit")}
              </span>
            </div>
          </Link>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {locked ? (
              <h3 className="truncate font-semibold text-muted-foreground">{catalog.name}</h3>
            ) : (
              <h3 className="truncate font-semibold">
                <Link href={builderHref} className="hover:underline">{catalog.name}</Link>
              </h3>
            )}
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{updatedLabel}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2 -mt-1 size-8 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={t("catalogs.actions")}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {!locked && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={builderHref}>
                      <Pencil />
                      {t("catalogs.edit")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onAction("rename", catalog)}>
                    <Type />
                    {t("catalogs.rename")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onAction("duplicate", catalog)}>
                    <CopyPlus />
                    {t("catalogs.duplicate")}
                  </DropdownMenuItem>
                </>
              )}
              {!locked && isLive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/catalog/${catalog.share_slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye />
                      {t("catalogs.view")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onAction("copyLink", catalog)}>
                    <Copy />
                    {t("catalogs.copyLink")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onAction("share", catalog)}>
                    <QrCode />
                    {t("catalogs.shareQr")}
                  </DropdownMenuItem>
                </>
              )}
              {locked && (
                <DropdownMenuItem onSelect={() => onAction("upgrade", catalog)}>
                  <Lock />
                  {t("catalogs.upgradePlan")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onAction("delete", catalog)}>
                <Trash2 />
                {t("catalogs.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 font-normal",
              catalog.is_published && !locked && "border-success/30 bg-success-soft text-success-soft-foreground",
              catalog.is_published && locked && "border-warning/30 bg-warning-soft text-warning-soft-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                catalog.is_published ? (locked ? "bg-warning" : "bg-success") : "bg-muted-foreground/50",
              )}
            />
            {catalog.is_published
              ? locked ? t("catalogs.hiddenFromVisitors") : t("catalogs.published")
              : t("catalogs.draft")}
          </Badge>
          <span className="tabular-nums">{t("catalogs.productCount", { count: productCount })}</span>
          {catalog.is_published && !locked && (
            <span className="flex items-center gap-1 tabular-nums">
              <Eye className="size-3.5" />
              {catalog.view_count ?? 0}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export const CatalogCard = memo(CatalogCardComponent)
