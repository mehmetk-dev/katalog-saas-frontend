"use client"

import { useCallback } from "react"
import {
    AlertTriangle, ArrowLeft, ArrowUpRight, Check, Download, Eye, Globe, GlobeLock,
    Loader2, Menu, MoreHorizontal, Pencil, RefreshCw, Redo2, Save, Share2, Undo2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { useOptionalSidebar } from "@/lib/contexts/sidebar-context"
import { cn } from "@/lib/utils"
import type { Catalog } from "@/lib/actions/catalogs"
import type { SaveStatus } from "@/lib/hooks/use-catalog-actions"
import { getCatalogShareUrl } from "@/lib/catalog-url"

type BuilderView = "split" | "editor" | "preview"

interface BuilderToolbarProps {
    catalog: Catalog | null
    catalogName: string
    onCatalogNameChange: (name: string) => void
    isPublished: boolean
    hasUnsavedChanges: boolean
    /** Katalog sunucuda var: değişiklikler kendiliğinden kaydedilir */
    canAutosave: boolean
    isUrlOutdated: boolean
    isPending: boolean
    view: BuilderView
    onViewChange: (view: BuilderView) => void
    onSave: () => void
    onPublish: () => void
    onUpdateSlug: () => void
    onShare: () => void
    onDownloadPDF: () => void
    onExit: () => void
    saveStatus: SaveStatus
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
}

const publicCatalogUrl = getCatalogShareUrl

/**
 * Builder üst barı. Mobil/masaüstü farkı tamamen CSS breakpoint'leriyle yapılır
 * (JS ile ekran ölçmek sunucu render'ıyla uyuşmayıp hydration hatası veriyordu).
 * Mobilde birincil aksiyonlar alttaki sabit barda.
 */
export function BuilderToolbar({
    catalog,
    catalogName,
    onCatalogNameChange,
    isPublished,
    hasUnsavedChanges,
    canAutosave,
    isUrlOutdated,
    isPending,
    view,
    onViewChange,
    onSave,
    onPublish,
    onUpdateSlug,
    onShare,
    onDownloadPDF,
    onExit,
    saveStatus,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
}: BuilderToolbarProps) {
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
    const isPreview = view === "preview"
    // Geniş ekranda menü solda hep görünür; dar ekranda bu tuşla açılır
    const sidebar = useOptionalSidebar()
    const shareSlug = catalog?.share_slug

    const mainAction = isPublished
        ? { label: t("builder.shareBtn"), icon: Share2, onClick: onShare }
        : { label: t("builder.publishBtn"), icon: Globe, onClick: onPublish }

    return (
        <>
            <header className="relative z-40 flex h-14 shrink-0 sm:h-16 items-center gap-2 border-b bg-background px-2 sm:px-3">
                {/* Sol: geri + isim + kayıt durumu */}
                <div className="flex min-w-0 flex-1 items-center gap-1">
                    {sidebar && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground lg:hidden"
                            onClick={sidebar.open}
                            aria-label={t("common.menu")}
                            title={t("common.menu")}
                        >
                            <Menu className="size-5" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground"
                        onClick={onExit}
                        aria-label={t("builder.backBtn")}
                        title={t("builder.backBtn")}
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <Input
                        value={catalogName}
                        onChange={(e) => onCatalogNameChange(e.target.value)}
                        className="h-9 min-w-0 max-w-72 flex-1 truncate border-transparent bg-transparent px-2 text-sm font-semibold shadow-none hover:bg-muted focus-visible:bg-background sm:text-base dark:bg-transparent"
                        placeholder={t("builder.catalogNamePlaceholder")}
                        aria-label={t("builder.catalogNamePlaceholder")}
                    />
                    <SaveStatusButton
                        status={saveStatus}
                        hasUnsavedChanges={hasUnsavedChanges}
                        canAutosave={canAutosave}
                        isPending={isPending}
                        onSave={onSave}
                        t={t}
                    />
                    {isPublished && shareSlug && (
                        <a
                            href={publicCatalogUrl(shareSlug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-success/20 bg-success-soft px-2.5 py-1 text-xs font-medium text-success-soft-foreground transition-colors hover:bg-success/15 lg:inline-flex"
                            title={t("builder.viewLiveCatalog")}
                        >
                            <span className="size-1.5 rounded-full bg-success" />
                            {t("builder.liveLabel")}
                            <ArrowUpRight className="size-3.5" />
                        </a>
                    )}
                </div>

                {/* Sağ: aksiyonlar */}
                <div className="flex shrink-0 items-center justify-end gap-1 md:flex-1">
                    <div className="hidden items-center md:flex">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                            onClick={onUndo}
                            disabled={!canUndo}
                            title={`${t("builder.undo")} (Ctrl+Z)`}
                            aria-label={t("builder.undo")}
                        >
                            <Undo2 className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                            onClick={onRedo}
                            disabled={!canRedo}
                            title={`${t("builder.redo")} (Ctrl+Shift+Z)`}
                            aria-label={t("builder.redo")}
                        >
                            <Redo2 className="size-4" />
                        </Button>
                        <Separator orientation="vertical" className="mx-1 h-5" />
                        <Button
                            variant={isPreview ? "secondary" : "ghost"}
                            size="sm"
                            className={cn("gap-1.5", !isPreview && "text-muted-foreground")}
                            onClick={() => onViewChange(isPreview ? "split" : "preview")}
                            aria-pressed={isPreview}
                            title={isPreview ? t("builder.backToEditor") : t("builder.fullPreview")}
                        >
                            {isPreview ? <Pencil className="size-4" /> : <Eye className="size-4" />}
                            <span className="hidden lg:inline">{isPreview ? t("builder.backToEditor") : t("builder.fullPreview")}</span>
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden text-muted-foreground sm:inline-flex"
                        onClick={onDownloadPDF}
                        title={t("builder.downloadPdf")}
                        aria-label={t("builder.downloadPdf")}
                    >
                        <Download className="size-4" />
                    </Button>

                    <Button
                        onClick={mainAction.onClick}
                        disabled={isPending}
                        className="hidden md:inline-flex"
                    >
                        <mainAction.icon className="size-4" />
                        {mainAction.label}
                    </Button>

                    {/* Diğer: bar'da yeri olmayanlar. Yayında değilken geniş ekranda boş kalacağı için gizlenir. */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("text-muted-foreground", !isPublished && "sm:hidden")}
                                aria-label={t("common.more")}
                            >
                                <MoreHorizontal className="size-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                            {isPublished && shareSlug && (
                                <>
                                    {/* Geniş ekranda "Yayında" rozeti aynı işi görür */}
                                    <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-medium text-success lg:hidden">
                                        <span className="size-1.5 rounded-full bg-success" />
                                        {t("builder.catalogLive")}
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem className="lg:hidden" onClick={() => window.open(publicCatalogUrl(shareSlug), "_blank")}>
                                        <ArrowUpRight />
                                        {t("builder.viewCatalogAction")}
                                    </DropdownMenuItem>
                                    {isUrlOutdated && (
                                        <DropdownMenuItem onClick={onUpdateSlug} className="text-warning-soft-foreground">
                                            <RefreshCw />
                                            {t("builder.refreshEntryLink")}
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                            {/* Geniş ekranda bar'daki PDF tuşu var */}
                            <DropdownMenuItem className="sm:hidden" onClick={onDownloadPDF}>
                                <Download />
                                {t("builder.downloadAsPdf")}
                            </DropdownMenuItem>
                            {isPublished && (
                                <DropdownMenuItem onClick={onPublish} variant="destructive">
                                    <GlobeLock />
                                    {t("builder.unpublish")}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Mobil: alt aksiyon barı */}
            <div className="safe-area-bottom fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-2 backdrop-blur md:hidden">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="h-11 flex-1"
                        onClick={() => onViewChange(isPreview ? "editor" : "preview")}
                    >
                        {isPreview ? <Pencil className="size-4" /> : <Eye className="size-4" />}
                        {isPreview ? t("builder.editBtn") : t("builder.previewBtn")}
                    </Button>
                    <Button className="h-11 flex-1" onClick={mainAction.onClick} disabled={isPending}>
                        <mainAction.icon className="size-4" />
                        {mainAction.label}
                    </Button>
                </div>
            </div>
        </>
    )
}

// ─── Save status ──────────────────────────────────────────────────────────────

interface SaveStatusButtonProps {
    status: SaveStatus
    hasUnsavedChanges: boolean
    canAutosave: boolean
    isPending: boolean
    onSave: () => void
    t: (key: string) => string
}

/** Otomatik kaydın durumu. Değişiklik yapılınca doğrudan "Kaydediliyor…" görünür (birkaç saniye
 *  içinde kendiliğinden kaydedilir); önceden araya giren "Kaydet" tuşu her düzenlemede yanıp sönüyordu.
 *  Elle kayıt yalnızca henüz sunucuda olmayan katalogda ve hata sonrası tekrar denemede gerekir. */
function SaveStatusButton({ status, hasUnsavedChanges, canAutosave, isPending, onSave, t }: SaveStatusButtonProps) {
    const base = "h-8 shrink-0 gap-1.5 px-2 text-xs font-medium"
    const label = "hidden sm:inline"

    if (status === "saving" || (hasUnsavedChanges && canAutosave && status !== "error")) {
        return (
            <Button variant="ghost" size="sm" disabled className={cn(base, "text-muted-foreground disabled:opacity-100")} title={t("builder.saveStatusSaving")}>
                <Loader2 className="size-3.5 animate-spin" />
                <span className={label}>{t("builder.saveStatusSaving")}</span>
            </Button>
        )
    }

    if (status === "error") {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                disabled={isPending}
                className={cn(base, "text-destructive hover:bg-destructive/10 hover:text-destructive")}
                title={t("builder.saveStatusError")}
            >
                <AlertTriangle className="size-3.5" />
                <span className={label}>{t("builder.saveStatusError")}</span>
            </Button>
        )
    }

    if (hasUnsavedChanges) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                disabled={isPending}
                className={cn(base, "text-muted-foreground hover:text-foreground")}
                title={t("builder.saveChanges")}
            >
                <Save className="size-3.5" />
                <span className={label}>{t("builder.saveBtn")}</span>
            </Button>
        )
    }

    // Bu oturumda henüz bir şey kaydedilmediyse gösterilecek bir durum yok
    if (status === "idle") return null

    return (
        <span
            className={cn(base, "inline-flex items-center text-muted-foreground")}
            title={t("builder.noChangesToSave")}
        >
            <Check className="size-3.5 text-success" />
            <span className={label}>{t("builder.saveStatusSaved")}</span>
        </span>
    )
}
