"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ArrowLeft, Copy, Globe, MoreVertical,
    AlertTriangle, Save, Share2, Eye, Pencil, Download,
    ArrowUpRight
} from "lucide-react"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
import { Catalog } from "@/lib/actions/catalogs"
import { toast } from "sonner"

interface BuilderToolbarProps {
    catalog: Catalog | null
    catalogName: string
    onCatalogNameChange: (name: string) => void
    isMobile: boolean
    isPublished: boolean
    hasUnsavedChanges: boolean
    isUrlOutdated: boolean
    isPending: boolean
    view: "split" | "editor" | "preview"
    onViewChange: (view: "split" | "editor" | "preview") => void
    onSave: () => void
    onPublish: () => void
    onUpdateSlug: () => void
    onShare: () => void
    onDownloadPDF: () => void
    onExit: () => void
    isAutoSaving?: boolean
}

export function BuilderToolbar({
    catalog,
    catalogName,
    onCatalogNameChange,
    isMobile,
    isPublished,
    hasUnsavedChanges,
    isUrlOutdated,
    isPending,
    view,
    onViewChange,
    onSave,
    onPublish,
    onUpdateSlug,
    onShare,
    onDownloadPDF,
    onExit
}: BuilderToolbarProps) {
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

    // Dynamic Action Button State
    const getMainAction = () => {
        if (isPublished) {
            return {
                label: t('builder.shareBtn'),
                icon: <Share2 className="w-4 h-4" />,
                onClick: onShare,
                className: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-black/10",
                showIndicator: false
            }
        }
        return {
            label: t('builder.publishBtn'),
            icon: <Globe className="w-4 h-4" />,
            onClick: onPublish,
            className: "bg-success hover:bg-success/90 text-success-foreground shadow-success/20",
            showIndicator: false
        }
    }

    const mainAction = getMainAction()

    return (
        <>
            {/* TOP TOOLBAR */}
            <div className="h-16 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-2 sm:px-6 shrink-0 gap-1 sm:gap-4 sticky top-0 z-50">
                {/* Left Section: Back + Name */}
                <div className="flex items-center gap-1 min-w-0 flex-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 hover:bg-muted rounded-xl"
                        onClick={onExit}
                        aria-label={t('builder.backBtn') as string}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="min-w-0 flex-1 max-w-[140px] sm:max-w-[300px]">
                        <Input
                            value={catalogName}
                            onChange={(e) => onCatalogNameChange(e.target.value)}
                            className="h-9 font-black text-sm sm:text-lg w-full border-transparent bg-transparent hover:bg-muted/50 focus:bg-card focus:border-border transition-all px-2 rounded-xl truncate"
                            placeholder={t('builder.catalogNamePlaceholder') as string}
                        />
                    </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                    {/* PC ONLY: View Switcher */}
                    {!isMobile && (
                        <div className="hidden md:flex items-center bg-muted p-1 rounded-xl border border-border/50 mr-2">
                            <Button
                                variant={view === "preview" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider"
                                onClick={() => onViewChange("preview")}
                            >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                {t('builder.fullScreenPreview')}
                            </Button>
                        </div>
                    )}

                    {/* STATUS INDICATOR (PC) */}
                    {!isMobile && isPublished && (
                        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-success-soft text-success-soft-foreground rounded-full border border-success/20 mr-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{t('builder.liveLabel')}</span>
                            <a
                                href={catalog?.share_slug ? new URL(`/catalog/${encodeURIComponent(catalog.share_slug)}`, process.env.NEXT_PUBLIC_APP_URL || window.location.origin).toString() : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 p-1 hover:bg-success/15 rounded-md transition-all group/link"
                                title={t('builder.viewLiveCatalog')}
                            >
                                <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                            </a>
                        </div>
                    )}

                    {/* ACTIONS GROUP */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Save Button */}
                        {hasUnsavedChanges ? (
                            <Button
                                size="sm"
                                onClick={onSave}
                                disabled={isPending}
                                className="h-9 px-3 rounded-xl shrink-0 transition-all bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg shadow-warning/20 animate-pulse gap-2"
                                title={t('builder.saveChanges')}
                            >
                                <Save className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">{t('builder.saveBtn')}</span>
                            </Button>
                        ) : (
                            <Button
                                size="icon"
                                disabled
                                variant="ghost"
                                className="h-9 w-9 rounded-xl shrink-0 text-muted-foreground/70 cursor-not-allowed"
                                title={t('builder.noChangesToSave')}
                            >
                                <Save className="w-4.5 h-4.5" />
                            </Button>
                        )}

                        {/* DESKTOP ONLY: Direct Primary Actions */}
                        {!isMobile && (
                            <>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={mainAction.onClick}
                                    disabled={isPending}
                                    className={cn(
                                        "h-9 px-4 font-black text-[11px] uppercase tracking-wider rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap",
                                        mainAction.className
                                    )}
                                >
                                    {mainAction.icon}
                                    <span className="ml-2">{mainAction.label}</span>
                                </Button>
                            </>
                        )}

                        {/* MOBILE ACTIONS (TOP BAR) */}
                        {isMobile && (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onViewChange(view === "preview" ? "editor" : "preview")}
                                    className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted"
                                    title={t('builder.previewBtn')}
                                >
                                    <Eye className="w-5 h-5" />
                                </Button>
                                <Button
                                    size="icon"
                                    onClick={mainAction.onClick}
                                    className={cn(
                                        "h-9 w-9 rounded-xl shadow-lg transition-all active:scale-90",
                                        mainAction.className
                                    )}
                                >
                                    {mainAction.icon}
                                </Button>
                            </div>
                        )}

                        {/* MORE OPTIONS */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl shrink-0 hover:bg-muted/50">
                                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60 p-2 rounded-2xl shadow-2xl border-border">
                                {isPublished && (
                                    <>
                                        <div className="px-3 py-2">
                                            <div className="text-[10px] font-black text-success uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                                                {t('builder.catalogLive')}
                                            </div>
                                            <div className="text-[9px] text-muted-foreground font-bold truncate">slug: {catalog?.share_slug}</div>
                                        </div>

                                        <DropdownMenuItem onClick={() => {
                                            if (catalog?.share_slug) {
                                                const url = new URL(`/catalog/${encodeURIComponent(catalog.share_slug)}`, process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
                                                window.open(url.toString(), '_blank')
                                            }
                                        }} className="rounded-xl h-10 font-bold text-xs text-success bg-success-soft/30 hover:bg-success/15">
                                            <ArrowUpRight className="w-4 h-4 mr-2.5" />
                                            {t('builder.viewCatalogAction')}
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={() => {
                                            if (catalog?.share_slug) {
                                                const url = new URL(`/catalog/${encodeURIComponent(catalog.share_slug)}`, process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
                                                navigator.clipboard.writeText(url.toString())
                                                toast.success(t('builder.linkCopied'))
                                            }
                                        }} className="rounded-xl h-10 font-bold text-xs">
                                            <Copy className="w-4 h-4 mr-2.5 text-muted-foreground" />
                                            {t('builder.copyLink')}
                                        </DropdownMenuItem>

                                        {isUrlOutdated && (
                                            <DropdownMenuItem onClick={onUpdateSlug} className="text-warning-soft-foreground rounded-xl h-10 font-bold text-xs bg-warning-soft">
                                                <AlertTriangle className="w-4 h-4 mr-2.5" />
                                                {t('builder.refreshEntryLink')}
                                            </DropdownMenuItem>
                                        )}

                                        <div className="h-px bg-muted/50 my-1.5" />
                                    </>
                                )}

                                {isMobile && (
                                    <DropdownMenuItem onClick={() => onViewChange(view === "preview" ? "editor" : "preview")} className="rounded-xl h-10 font-bold text-xs">
                                        {view === "preview" ? <Pencil className="w-4 h-4 mr-2.5 text-muted-foreground" /> : <Eye className="w-4 h-4 mr-2.5 text-muted-foreground" />}
                                        {view === "preview" ? t('builder.editMode') : t('builder.previewMode')}
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuItem onClick={onPublish} className="rounded-xl h-10 font-bold text-xs">
                                    <Globe className="w-4 h-4 mr-2.5 text-muted-foreground" />
                                    {isPublished ? t('builder.unpublish') : t('builder.publishCatalog')}
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={onDownloadPDF} className="rounded-xl h-10 font-bold text-xs">
                                    <Download className="w-4 h-4 mr-2.5 text-muted-foreground" />
                                    {t('builder.downloadAsPdf')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* MOBILE ONLY: STICKY BOTTOM ACTION BAR */}
            {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 pointer-events-none safe-area-bottom">
                    <div className="flex items-center gap-2 bg-card p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-border pointer-events-auto animate-in slide-in-from-bottom-6 duration-500">
                        {/* Preview Button */}
                        <Button
                            variant="ghost"
                            className={cn(
                                "flex-1 h-12 rounded-xl text-muted-foreground font-black text-[10px] uppercase tracking-wider gap-2 transition-all active:scale-95",
                                view === "preview" ? "bg-muted text-primary" : ""
                            )}
                            onClick={() => onViewChange(view === "preview" ? "editor" : "preview")}
                        >
                            {view === "preview" ? (
                                <>
                                    <Pencil className="w-4 h-4" />
                                    <span>{t('builder.editor') as string || 'Düzenle'}</span>
                                </>
                            ) : (
                                <>
                                    <Eye className="w-4 h-4" />
                                    <span>{t('builder.preview') as string || 'Önizle'}</span>
                                </>
                            )}
                        </Button>

                        {/* Primary Action Button (Update/Publish) */}
                        <Button
                            onClick={mainAction.onClick}
                            disabled={isPending}
                            className={cn(
                                "flex-[2] h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] shadow-lg transition-all active:scale-95 hover:scale-[1.02]",
                                mainAction.className
                            )}
                        >
                            {mainAction.icon}
                            <span className="ml-2">
                                {mainAction.label}
                            </span>
                        </Button>
                    </div>
                </div>
            )}
        </>
    )
}
