"use client"

import React, { useEffect, useRef, useState } from "react"
import { BookOpen, Download, Loader2, Maximize2, Minus, Plus, Rows3, Search, Share2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type CatalogViewMode = "book" | "list"

interface CatalogHeaderProps {
    catalogName: string
    /** Katalog sahibinin logosu; yoksa adın baş harfi gösterilir */
    logoUrl?: string | null
    /** "24 ürün" */
    meta: string
    searchQuery: string
    onSearchChange: (value: string) => void
    selectedCategory: string
    onCategoryChange: (category: string) => void
    categories: string[]
    onShare: () => void
    onDownload: () => void
    isDownloading: boolean
    /** Tarayıcı tam ekranı desteklemiyorsa verilmez */
    onToggleFullscreen?: () => void
    zoomScale: number
    onZoomIn: () => void
    onZoomOut: () => void
    onZoomReset: () => void
    isMobile: boolean
    viewMode: CatalogViewMode
    onViewModeChange: (mode: CatalogViewMode) => void
    t: (key: string) => string
}

function BrandMark({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
    const [failed, setFailed] = useState(false)
    if (logoUrl && !failed) {
        return (
            <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
                {/* Logo herhangi bir adresten gelebilir; next/image tanımsız alan adında sayfayı düşürür */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="" className="size-full object-contain p-1" onError={() => setFailed(true)} />
            </span>
        )
    }
    return (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground">
            {name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "K"}
        </span>
    )
}

function ViewSwitch({ viewMode, onViewModeChange, t, compact }: Pick<CatalogHeaderProps, "viewMode" | "onViewModeChange" | "t"> & { compact?: boolean }) {
    return (
        <div role="group" aria-label={t("catalogs.public.viewMode")} className="flex shrink-0 items-center rounded-full border bg-muted/60 p-0.5">
            {([
                { mode: "book", icon: BookOpen, label: t("catalogs.public.bookView") },
                { mode: "list", icon: Rows3, label: t("catalogs.public.listView") },
            ] as const).map(({ mode, icon: Icon, label }) => (
                <button
                    key={mode}
                    type="button"
                    onClick={() => onViewModeChange(mode)}
                    aria-pressed={viewMode === mode}
                    aria-label={label}
                    title={label}
                    className={cn(
                        "flex min-h-0 min-w-0 items-center justify-center gap-1.5 rounded-full text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                        compact ? "size-8" : "size-8 xl:w-auto xl:px-3",
                        viewMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    <Icon className="size-4" />
                    {!compact && <span className="hidden xl:inline">{label}</span>}
                </button>
            ))}
        </div>
    )
}

export const CatalogHeader = React.memo(function CatalogHeader({
    catalogName,
    logoUrl,
    meta,
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    categories,
    onShare,
    onDownload,
    isDownloading,
    onToggleFullscreen,
    zoomScale,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    isMobile,
    viewMode,
    onViewModeChange,
    t,
}: CatalogHeaderProps) {
    // Telefonda arama bir düğmenin arkasında; açılınca başlığın yerini alır
    const [searchOpen, setSearchOpen] = useState(false)
    const searchRef = useRef<HTMLInputElement>(null)
    const showSearchField = !isMobile || searchOpen || searchQuery.length > 0
    const hasCategoryRow = categories.length > 2
    // Telefonda üst satır dar: kategori satırı varsa arama düğmesi oraya, başa geçer
    const searchInCategoryRow = isMobile && hasCategoryRow && !showSearchField

    useEffect(() => {
        if (searchOpen) searchRef.current?.focus()
    }, [searchOpen])

    const searchField = (
        <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                ref={searchRef}
                type="search"
                placeholder={t("catalogs.public.searchPlaceholder")}
                aria-label={t("catalogs.public.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        onSearchChange("")
                        setSearchOpen(false)
                    }
                }}
                className="h-10 rounded-full border-transparent bg-muted pl-9 pr-9 shadow-none focus-visible:border-ring focus-visible:bg-background [&::-webkit-search-cancel-button]:hidden"
            />
            {(searchQuery || (isMobile && searchOpen)) && (
                <button
                    type="button"
                    onClick={() => {
                        onSearchChange("")
                        if (isMobile) setSearchOpen(false)
                    }}
                    aria-label={t("catalogs.public.clearSearch")}
                    className="absolute right-2 top-1/2 flex size-7 min-h-0 min-w-0 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    )

    const downloadIcon = isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />

    return (
        <header className="sticky top-0 z-50 shrink-0 border-b bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:gap-4 sm:px-6 lg:px-8">
                {isMobile && showSearchField ? (
                    searchField
                ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none lg:basis-[30%]">
                        <BrandMark name={catalogName} logoUrl={logoUrl} />
                        <div className="min-w-0">
                            <h1 className="truncate text-[15px] font-semibold leading-tight text-foreground">{catalogName}</h1>
                            <p className="truncate text-xs text-muted-foreground">{meta}</p>
                        </div>
                    </div>
                )}

                {!isMobile && <div className="mx-auto w-full max-w-sm">{searchField}</div>}

                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    {isMobile ? (
                        <>
                            {!showSearchField && !hasCategoryRow && (
                                <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label={t("catalogs.public.searchPlaceholder")}>
                                    <Search className="size-5" />
                                </Button>
                            )}
                            <ViewSwitch viewMode={viewMode} onViewModeChange={onViewModeChange} t={t} compact />
                            <Button variant="ghost" size="icon" onClick={onShare} aria-label={t("catalogs.public.share")}>
                                <Share2 className="size-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onDownload} disabled={isDownloading} aria-label={t("catalogs.public.downloadPdf")}>
                                {downloadIcon}
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* Listede yakınlaştırma düğmeleri de çıkar; arama sıkışmasın diye etiketler gizlenir */}
                            <ViewSwitch viewMode={viewMode} onViewModeChange={onViewModeChange} t={t} compact={viewMode === "list"} />
                            {viewMode === "list" && (
                                <div className="flex items-center rounded-full border bg-muted/60 p-0.5">
                                    <Button variant="ghost" size="icon" onClick={onZoomOut} className="size-8 rounded-full" aria-label={t("catalogs.public.zoomOut")} title={t("catalogs.public.zoomOut")}>
                                        <Minus className="size-3.5" />
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={onZoomReset}
                                        className="h-8 min-w-12 rounded-full px-2 text-xs font-medium tabular-nums text-muted-foreground hover:text-foreground"
                                        aria-label={t("catalogs.public.resetZoom")}
                                        title={t("catalogs.public.resetZoom")}
                                    >
                                        %{Math.round(zoomScale * 100)}
                                    </button>
                                    <Button variant="ghost" size="icon" onClick={onZoomIn} className="size-8 rounded-full" aria-label={t("catalogs.public.zoomIn")} title={t("catalogs.public.zoomIn")}>
                                        <Plus className="size-3.5" />
                                    </Button>
                                </div>
                            )}
                            {onToggleFullscreen && (
                                <Button variant="ghost" size="icon" onClick={onToggleFullscreen} aria-label={t("catalogs.public.fullscreen")} title={t("catalogs.public.fullscreen")}>
                                    <Maximize2 className="size-4" />
                                </Button>
                            )}
                            <div className="mx-1 h-6 w-px bg-border" />
                            <Button variant="outline" onClick={onShare} className="rounded-full" aria-label={t("catalogs.public.share")}>
                                <Share2 className="size-4" />
                                <span className="hidden xl:inline">{t("catalogs.public.share")}</span>
                            </Button>
                            <Button onClick={onDownload} disabled={isDownloading} className="rounded-full">
                                {downloadIcon}
                                {t("catalogs.public.downloadPdf")}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {hasCategoryRow && (
                <div className="mx-auto max-w-7xl px-3 pb-3 sm:px-6 lg:px-8">
                    {/* Kenarlarda yumuşak geçiş: kayan çiplerin devamı olduğu belli olsun */}
                    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-24px),transparent)]">
                        {searchInCategoryRow && (
                            <button
                                type="button"
                                onClick={() => setSearchOpen(true)}
                                aria-label={t("catalogs.public.searchPlaceholder")}
                                className="ml-3 flex size-8 min-h-0 min-w-0 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground"
                            >
                                <Search className="size-4" />
                            </button>
                        )}
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => onCategoryChange(cat)}
                                aria-pressed={selectedCategory === cat}
                                className={cn(
                                    // min-h-0: mobildeki genel 44px dokunma kuralı kategori çiplerini iri gösteriyordu
                                    "h-8 min-h-0 min-w-0 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-xs font-medium transition-colors first:ml-3 last:mr-6",
                                    selectedCategory === cat
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "bg-card text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {cat === "all" ? t("catalogs.public.all") : cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </header>
    )
})
