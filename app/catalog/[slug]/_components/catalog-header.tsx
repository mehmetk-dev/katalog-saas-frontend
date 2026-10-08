"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Search, Share2, Download, Maximize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

interface CatalogHeaderProps {
    catalogName: string
    searchQuery: string
    onSearchChange: (value: string) => void
    selectedCategory: string
    onCategoryChange: (category: string) => void
    categories: string[]
    onShare: () => void
    onDownload: () => void
    onToggleFullscreen: () => void
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
    onToggleFullscreen,
    zoomScale,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    isMobile,
    t,
}: CatalogHeaderProps) {
    const showBrandSuffix =
        !(catalogName.toLowerCase().includes('fog') && catalogName.toLowerCase().includes('catalog'))

    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Brand + catalog name */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center group">
                            <Logo showSuffix={showBrandSuffix} />
                        </Link>
                        <div className="h-6 w-px bg-accent" />
                        <h1 className="text-sm font-semibold text-muted-foreground truncate max-w-[200px]">
                            {catalogName}
                        </h1>
                    </div>

                    {/* Search + actions */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={t("catalogs.public.searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={onShare} className="rounded-full hover:bg-accent hover:text-primary">
                                <Share2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onDownload} className="rounded-full hover:bg-accent hover:text-primary">
                                <Download className="w-4 h-4" />
                            </Button>

                            {!isMobile && (
                                <div className="flex items-center gap-0.5 bg-muted rounded-full p-0.5 ml-2 border border-border">
                                    <Button variant="ghost" size="icon" onClick={onZoomOut} className="h-8 w-8 rounded-full hover:bg-card transition-all shadow-sm" title="Uzaklaştır">
                                        <ZoomOut className="w-3.5 h-3.5" />
                                    </Button>
                                    <div className="w-[1px] h-3 bg-accent mx-0.5" />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onZoomReset}
                                        className="h-8 px-2 rounded-full text-[10px] font-black hover:bg-card transition-all text-muted-foreground"
                                        title="Sıfırla"
                                    >
                                        %{Math.round(zoomScale * 100)}
                                    </Button>
                                    <div className="w-[1px] h-3 bg-accent mx-0.5" />
                                    <Button variant="ghost" size="icon" onClick={onZoomIn} className="h-8 w-8 rounded-full hover:bg-card transition-all shadow-sm" title="Yakınlaştır">
                                        <ZoomIn className="w-3.5 h-3.5" />
                                    </Button>
                                    <div className="w-[1px] h-3 bg-accent mx-0.5" />
                                    <Button variant="ghost" size="icon" onClick={onZoomReset} className="h-8 w-8 rounded-full hover:bg-card transition-all shadow-sm" title="Sıfırla">
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}

                            <div className="w-[1px] h-4 bg-accent mx-2" />

                            {!isMobile && (
                                <Button variant="ghost" size="icon" onClick={onToggleFullscreen} className="rounded-full hover:bg-muted ml-1">
                                    <Maximize2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Category pills */}
                {categories.length > 2 && (
                    <div className="mt-3 flex flex-nowrap items-center gap-2 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => onCategoryChange(cat)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0",
                                    selectedCategory === cat
                                        ? "bg-primary text-primary-foreground shadow-md shadow-black/10"
                                        : "bg-card text-muted-foreground border border-border hover:border-border hover:text-primary",
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
