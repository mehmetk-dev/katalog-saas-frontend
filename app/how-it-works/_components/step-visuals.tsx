"use client"

import { useEffect, useState } from "react"
import NextImage from "next/image"
import QRCode from "qrcode"
import { Copy, Download, FileSpreadsheet, Link2, Smartphone, Table2 } from "lucide-react"

import { CatalogPreview } from "@/components/catalogs/catalog-preview"
import { getPreviewProductsByLayout } from "@/components/templates/preview-data"
import { ResponsiveContainer } from "@/components/ui/responsive-container"
import { cn } from "@/lib/utils"

type T = (key: string, params?: Record<string, unknown>) => string

const SAMPLE_LINK = "fogcatalog.com/catalog/yaz-koleksiyonu"
const formatPrice = (value: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value)

/** Adım 1: ürün listesinin sadeleştirilmiş hali (panelde gördüğünün aynısı) */
export function ProductsVisual({ t }: { t: T }) {
    const products = getPreviewProductsByLayout("modern-grid").slice(0, 5)

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                    <p className="text-sm font-semibold text-card-foreground">{t("howItWorksPage.visualProducts")}</p>
                    <p className="text-xs text-muted-foreground">{t("howItWorksPage.visualProductsCount", { count: 124 })}</p>
                </div>
                <div className="flex gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                        <FileSpreadsheet className="size-3.5" aria-hidden />
                        {t("howItWorksPage.visualImport")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                        <Table2 className="size-3.5" aria-hidden />
                        {t("howItWorksPage.visualTable")}
                    </span>
                </div>
            </div>
            <ul className="divide-y divide-border">
                {products.map((product) => (
                    <li key={product.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            {product.image_url && (
                                <NextImage src={product.image_url} alt="" fill sizes="40px" className="object-cover" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-card-foreground">{product.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{product.description}</p>
                        </div>
                        <span className="text-sm font-medium tabular-nums text-card-foreground">{formatPrice(product.price)}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

const SHOWCASE_TEMPLATES = ["modern-grid", "magazine", "product-tiles"] as const

/** Adım 2: gerçek şablon bileşenleriyle üç örnek sayfa, hafif kaydırılmış */
export function TemplatesVisual() {
    return (
        <div className="relative grid grid-cols-3 gap-3 sm:gap-4" aria-hidden>
            {SHOWCASE_TEMPLATES.map((layout, index) => (
                <div
                    key={layout}
                    className={cn(
                        "pointer-events-none overflow-hidden rounded-lg border border-border bg-white shadow-sm",
                        index === 1 && "translate-y-6",
                    )}
                >
                    <div className="aspect-[794/1123] overflow-hidden">
                        <ResponsiveContainer>
                            <CatalogPreview
                                layout={layout}
                                catalogName="Yaz Koleksiyonu"
                                products={getPreviewProductsByLayout(layout)}
                                showAttributes={false}
                                showSku={false}
                            />
                        </ResponsiveContainer>
                    </div>
                </div>
            ))}
        </div>
    )
}

/** Adım 3: paylaşım penceresinin özeti — link, QR kod, PDF ve görüntülenme */
export function ShareVisual({ t }: { t: T }) {
    const [qr, setQr] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        QRCode.toDataURL(`https://${SAMPLE_LINK}`, { margin: 0, width: 240 })
            .then((url) => { if (!cancelled) setQr(url) })
            .catch(() => { /* QR üretilemezse kutu boş kalır */ })
        return () => { cancelled = true }
    }, [])

    return (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">{t("howItWorksPage.visualLink")}</p>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                    <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{SAMPLE_LINK}</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                        <Copy className="size-3" aria-hidden />
                        {t("howItWorksPage.visualCopy")}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-3">
                <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-white p-3">
                    <div className="size-24 sm:size-28">
                        {qr ? (
                            // QR data URL'i; next/image gerektirmez
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={qr} alt={t("howItWorksPage.visualQr")} className="size-full" />
                        ) : (
                            <div className="size-full animate-pulse rounded bg-muted" />
                        )}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{t("howItWorksPage.visualQr")}</span>
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-soft text-xs font-bold text-brand-soft-foreground">PDF</span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-card-foreground">Yaz Koleksiyonu 2026.pdf</p>
                            <p className="text-xs text-muted-foreground">{t("howItWorksPage.visualPdf")}</p>
                        </div>
                        <Download className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                            <Smartphone className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-card-foreground">{t("howItWorksPage.visualViews")}</p>
                            <p className="text-xs text-muted-foreground">{t("howItWorksPage.visualMobile")}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
