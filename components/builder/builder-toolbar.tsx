"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ArrowLeft, Copy, ExternalLink, Globe, MoreVertical,
    RefreshCw, AlertTriangle, Save, Share2, Eye, Pencil, Download
} from "lucide-react"
import { useTranslation } from "@/lib/i18n-provider"
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
    hasUnpushedChanges: boolean
    isUrlOutdated: boolean
    isPending: boolean
    view: "split" | "editor" | "preview"
    onViewChange: (view: "split" | "editor" | "preview") => void
    onSave: () => void
    onPublish: () => void
    onPushUpdates: () => void
    onUpdateSlug: () => void
    onShare: () => void
    onDownloadPDF: () => void
    onExit: () => void
}

export function BuilderToolbar({
    catalog,
    catalogName,
    onCatalogNameChange,
    isMobile,
    isPublished,
    hasUnsavedChanges,
    hasUnpushedChanges,
    isUrlOutdated,
    isPending,
    view,
    onViewChange,
    onSave,
    onPublish,
    onPushUpdates,
    onUpdateSlug,
    onShare,
    onDownloadPDF,
    onExit
}: BuilderToolbarProps) {
    const { t } = useTranslation()

    return (
        <div className="h-16 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-3 sm:px-6 shrink-0 gap-4">
            {/* Left: Back + Name + Live Bar */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={onExit}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Input
                        value={catalogName}
                        onChange={(e) => onCatalogNameChange(e.target.value)}
                        className="h-9 font-bold text-lg min-w-[120px] w-[200px] sm:w-[240px] border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-input transition-all px-2 rounded-md"
                        placeholder={t('builder.catalogNamePlaceholder')}
                    />
                </div>

                {!isMobile && (
                    <>
                        <div className="h-6 w-px bg-border/60" />
                        <div className="flex items-center gap-4">
                            {isPublished && catalog?.share_slug ? (
                                <>
                                    <div className="flex items-center gap-1 pl-1 pr-1.5 py-1 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-full transition-all hover:border-emerald-200 dark:hover:border-emerald-800">
                                        <div className="flex items-center gap-1.5 px-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Yayında</span>
                                        </div>

                                        <div className="h-4 w-px bg-emerald-200/50 dark:bg-emerald-800/50 mx-1" />

                                        <div className="flex items-center gap-1 group">
                                            {isUrlOutdated && catalog?.is_published === true && (
                                                <div className="flex items-center animate-in fade-in zoom-in duration-300 mr-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={onUpdateSlug}
                                                        className="h-6 px-2 text-[10px] font-medium gap-1.5 rounded-full bg-amber-100/80 hover:bg-amber-200 text-amber-700 border border-amber-200/50 shadow-sm"
                                                        title="URL güncel bilgilerinizle eşleşmiyor."
                                                    >
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Link Yenile
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="flex items-center">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600"
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/catalog/${catalog?.share_slug}`
                                                        navigator.clipboard.writeText(url)
                                                        toast.success("Link kopyalandı!")
                                                    }}
                                                    title="Linki Kopyala"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                                <a
                                                    href={`/catalog/${catalog.share_slug}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600"
                                                        title="Kataloğu Görüntüle"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {isPublished && hasUnpushedChanges && (
                                        <div className="ml-2 animate-in fade-in zoom-in slide-in-from-left-2 duration-300 flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                onClick={onPushUpdates}
                                                disabled={isPending}
                                                className="h-8 px-4 text-xs font-bold gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 border border-amber-600/20 hover:scale-105 transition-all"
                                                title="Yaptığınız değişiklikler sadece taslak olarak kaydedildi. Kullanıcıların görmesi için tıklayın."
                                            >
                                                <RefreshCw className={cn("w-3.5 h-3.5", isPending && "animate-spin")} />
                                                YAYINI GÜNCELLE
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/80 rounded-full border border-slate-200/60">
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                        <span className="text-xs text-slate-500 font-medium">Yayında Değil</span>
                                    </div>

                                    <Button
                                        size="sm"
                                        onClick={onPublish}
                                        disabled={isPending}
                                        className="h-7 px-3 text-xs font-bold gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all"
                                    >
                                        <Globe className="w-3 h-3" />
                                        Yayınla
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Center: Switch (Desktop) */}
            {!isMobile && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-full border shadow-sm">
                        <Label
                            htmlFor="view-mode"
                            className={cn(
                                "text-xs font-medium px-2 cursor-pointer transition-colors",
                                view === 'preview' ? "text-muted-foreground" : "text-foreground"
                            )}
                            onClick={() => onViewChange('split')}
                        >
                            Editör
                        </Label>
                        <Switch
                            id="view-mode"
                            checked={view === 'preview'}
                            onCheckedChange={(checked) => {
                                onViewChange(checked ? 'preview' : 'split')
                            }}
                            className="data-[state=checked]:bg-primary"
                        />
                        <Label
                            htmlFor="view-mode"
                            className={cn(
                                "text-xs font-medium px-2 cursor-pointer transition-colors",
                                view === 'preview' ? "text-foreground" : "text-muted-foreground"
                            )}
                            onClick={() => onViewChange('preview')}
                        >
                            Önizleme
                        </Label>
                    </div>
                </div>
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Mobile View Toggle */}
                {isMobile && (
                    <div className="flex bg-muted rounded-md p-0.5 mr-2">
                        <Button
                            variant={view !== "preview" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onViewChange("editor")}
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant={view === "preview" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onViewChange("preview")}
                        >
                            <Eye className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}

                {/* Unsaved Changes Indicator */}
                {hasUnsavedChanges && !isPending && (
                    <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        Kaydedilmemiş değişiklikler
                    </span>
                )}

                <Button
                    size="sm"
                    onClick={onSave}
                    disabled={isPending}
                    variant="ghost"
                    className={cn(
                        "h-9 gap-2 px-4 transition-all",
                        hasUnsavedChanges
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <Save className={cn("w-4 h-4", hasUnsavedChanges ? "text-amber-600" : "")} />
                    <span className="hidden sm:inline text-sm font-medium">
                        {isPending ? "Kaydediliyor..." : (hasUnsavedChanges ? "Kaydet" : "Kaydedildi")}
                    </span>
                </Button>

                <Button
                    variant="default"
                    size="sm"
                    onClick={onShare}
                    className="h-9 gap-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">Paylaş</span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" title="Daha fazla seçenek">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onPublish}>
                            <Globe className="w-4 h-4 mr-2" />
                            {isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDownloadPDF}>
                            <Download className="w-4 h-4 mr-2" />
                            PDF İndir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
