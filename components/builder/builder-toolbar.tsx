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
    isAutoSaving?: boolean
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
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, any>) => baseT(key, params) as string, [baseT])

    // Dynamic Action Button State
    const getMainAction = () => {
        if (isPublished && hasUnpushedChanges) {
            return {
                label: "Yayını Güncelle",
                icon: <RefreshCw className={cn("w-4 h-4", isPending && "animate-spin")} />,
                onClick: onPushUpdates,
                className: "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200",
                showIndicator: true
            }
        }
        if (isPublished) {
            return {
                label: "Paylaş",
                icon: <Share2 className="w-4 h-4" />,
                onClick: onShare,
                className: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200",
                showIndicator: false
            }
        }
        return {
            label: "Yayınla",
            icon: <Globe className="w-4 h-4" />,
            onClick: onPublish,
            className: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200",
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
                        className="h-9 w-9 shrink-0 hover:bg-slate-100 rounded-xl"
                        onClick={onExit}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="min-w-0 flex-1 max-w-[140px] sm:max-w-[300px]">
                        <Input
                            value={catalogName}
                            onChange={(e) => onCatalogNameChange(e.target.value)}
                            className="h-9 font-black text-sm sm:text-lg w-full border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-slate-200 transition-all px-2 rounded-xl truncate"
                            placeholder={t('builder.catalogNamePlaceholder') as string}
                        />
                    </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                    {/* PC ONLY: View Switcher */}
                    {!isMobile && (
                        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 mr-2">
                            <Button
                                variant={view === "editor" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider"
                                onClick={() => onViewChange("editor")}
                            >
                                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                Düzenle
                            </Button>
                            <Button
                                variant={view === "preview" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider"
                                onClick={() => onViewChange("preview")}
                            >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Önizle
                            </Button>
                        </div>
                    )}

                    {/* STATUS INDICATOR (PC) */}
                    {!isMobile && isPublished && (
                        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 mr-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Yayında</span>
                        </div>
                    )}

                    {/* ACTIONS GROUP */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Save Button */}
                        <Button
                            size="icon"
                            onClick={onSave}
                            disabled={isPending}
                            variant="ghost"
                            className={cn(
                                "h-9 w-9 rounded-xl shrink-0 transition-all",
                                hasUnsavedChanges
                                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                                    : "text-slate-400 hover:bg-slate-50"
                            )}
                            title="Değişiklikleri Kaydet"
                        >
                            <Save className={cn("w-4.5 h-4.5", hasUnsavedChanges ? "animate-pulse" : "")} />
                        </Button>

                        {/* DESKTOP ONLY: Direct Primary Actions */}
                        {!isMobile && (
                            <>
                                {/* Eğer yayındaysa ve değişiklik varsa "Güncelle" ve yanına "Paylaş" butonu gelir */}
                                {isPublished && hasUnpushedChanges && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={onPushUpdates}
                                        disabled={isPending}
                                        className="h-9 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                                    >
                                        <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isPending && "animate-spin")} />
                                        Yayını Güncelle
                                    </Button>
                                )}

                                {/* Ana Aksiyon: Ya Paylaş (yayındaysa), ya Yayınla (yayınlanmamışsa) */}
                                {(!hasUnpushedChanges || !isPublished) && (
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
                                )}

                                {/* Yayındaysa her zaman Paylaş butonunu PC'de göster */}
                                {isPublished && hasUnpushedChanges && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onShare}
                                        className="h-9 px-4 border-slate-200 hover:bg-slate-50 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all whitespace-nowrap"
                                    >
                                        <Share2 className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                                        Paylaş
                                    </Button>
                                )}
                            </>
                        )}

                        {/* MOBILE ACTIONS (TOP BAR) */}
                        {isMobile && (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onViewChange(view === "preview" ? "editor" : "preview")}
                                    className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100"
                                    title="Önizle"
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
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl shrink-0 hover:bg-slate-50">
                                    <MoreVertical className="w-5 h-5 text-slate-400" />
                                    {hasUnpushedChanges && isPublished && !isMobile && (
                                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60 p-2 rounded-2xl shadow-2xl border-slate-100">
                                {isPublished && (
                                    <>
                                        <div className="px-3 py-2">
                                            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                Katalog Yayında
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-bold truncate">slug: {catalog?.share_slug}</div>
                                        </div>

                                        <DropdownMenuItem onClick={() => {
                                            if (catalog?.share_slug) {
                                                const url = `${window.location.origin}/catalog/${catalog.share_slug}`
                                                navigator.clipboard.writeText(url)
                                                toast.success("Link kopyalandı!")
                                            }
                                        }} className="rounded-xl h-10 font-bold text-xs">
                                            <Copy className="w-4 h-4 mr-2.5 text-slate-400" />
                                            Linki Kopyala
                                        </DropdownMenuItem>

                                        {isUrlOutdated && (
                                            <DropdownMenuItem onClick={onUpdateSlug} className="text-orange-600 rounded-xl h-10 font-bold text-xs bg-orange-50">
                                                <AlertTriangle className="w-4 h-4 mr-2.5" />
                                                Giriş Linkini Yenile
                                            </DropdownMenuItem>
                                        )}

                                        <div className="h-px bg-slate-50 my-1.5" />
                                    </>
                                )}

                                {isMobile && (
                                    <DropdownMenuItem onClick={() => onViewChange(view === "preview" ? "editor" : "preview")} className="rounded-xl h-10 font-bold text-xs">
                                        {view === "preview" ? <Pencil className="w-4 h-4 mr-2.5 text-slate-400" /> : <Eye className="w-4 h-4 mr-2.5 text-slate-400" />}
                                        {view === "preview" ? 'Düzenleme Modu' : 'Önizleme Modu'}
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuItem onClick={onPublish} className="rounded-xl h-10 font-bold text-xs">
                                    <Globe className="w-4 h-4 mr-2.5 text-slate-400" />
                                    {isPublished ? 'Yayından Kaldır' : 'Kataloğu Yayınla'}
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={onDownloadPDF} className="rounded-xl h-10 font-bold text-xs">
                                    <Download className="w-4 h-4 mr-2.5 text-slate-400" />
                                    PDF Olarak İndir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* MOBILE ONLY: STICKY BOTTOM ACTION BAR */}
            {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-md safe-area-bottom">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-slate-100 dark:border-slate-800/50 animate-in slide-in-from-bottom-8 duration-500">
                        {/* Preview Button */}
                        <Button
                            variant="ghost"
                            className={cn(
                                "flex-1 h-12 rounded-xl text-slate-600 font-black text-xs uppercase tracking-wider gap-2 transition-all active:scale-95",
                                view === "preview" ? "bg-slate-100 text-indigo-600" : ""
                            )}
                            onClick={() => onViewChange(view === "preview" ? "editor" : "preview")}
                        >
                            {view === "preview" ? (
                                <>
                                    <Pencil className="w-4 h-4" />
                                    Düzenle
                                </>
                            ) : (
                                <>
                                    <Eye className="w-4 h-4" />
                                    Önizle
                                </>
                            )}
                        </Button>

                        {/* Primary Action Button (Update/Publish) */}
                        <Button
                            onClick={mainAction.onClick}
                            disabled={isPending}
                            className={cn(
                                "flex-[2] h-12 rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-xl transition-all active:scale-95 hover:scale-[1.02]",
                                mainAction.className
                            )}
                        >
                            {mainAction.icon}
                            <span className="ml-2">
                                {isPublished && hasUnpushedChanges ? "Yayını Güncelle" : mainAction.label}
                            </span>
                        </Button>
                    </div>
                </div>
            )}
        </>
    )
}
