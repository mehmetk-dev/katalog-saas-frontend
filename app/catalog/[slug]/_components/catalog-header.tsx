"use client"

import React from "react"
import Link from "next/link"
import { Download, Loader2, Maximize2, Minus, Plus, Search, Share2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

interface CatalogHeaderProps {
    catalogName: string
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
    t: (key: string) => string
}

export const CatalogHeader = React.memo(function CatalogHeader({
    catalogName,
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
    t,
}: CatalogHeaderProps) {
    return (
        <header className="sticky top-0 z-50 shrink-0 border-b bg-background/90 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Link href="/" className="hidden shrink-0 sm:flex" aria-label="FogCatalog">
                            <Logo />
                        </Link>
                        <div className="hidden h-6 w-px shrink-0 bg-border sm:block" />
                        <h1 className="min-w-0 truncate text-sm font-semibold text-foreground sm:text-base">{catalogName}</h1>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 md:order-3">
                        <Button variant="ghost" size="icon" onClick={onShare} aria-label={t("catalogs.public.share")} title={t("catalogs.public.share")}>
                            <Share2 className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDownload}
                            disabled={isDownloading}
                            aria-label={t("catalogs.public.downloadPdf")}
                            title={t("catalogs.public.downloadPdf")}
                        >
                            {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                        </Button>

                        {!isMobile && (
                            <div className="ml-1 flex items-center rounded-full border bg-muted/60 p-0.5">
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

                        {!isMobile && onToggleFullscreen && (
                            <Button variant="ghost" size="icon" onClick={onToggleFullscreen} aria-label={t("catalogs.public.fullscreen")} title={t("catalogs.public.fullscreen")}>
                                <Maximize2 className="size-4" />
                            </Button>
                        )}
                    </div>

                    <div className="relative w-full md:order-2 md:w-64 md:flex-none">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={t("catalogs.public.searchPlaceholder")}
                            aria-label={t("catalogs.public.searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="h-9 rounded-full bg-muted/60 pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => onSearchChange("")}
                                aria-label={t("catalogs.public.clearSearch")}
                                className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {categories.length > 2 && (
                    <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => onCategoryChange(cat)}
                                aria-pressed={selectedCategory === cat}
                                className={cn(
                                    "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                    selectedCategory === cat
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "bg-card text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {cat === "all" ? t("catalogs.public.all") : cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </header>
    )
})
