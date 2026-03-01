"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Search, Share2, Download, Maximize2, ZoomIn, ZoomOut, RotateCcw, LayoutList, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    viewMode: "list" | "book"
    onViewModeChange: (mode: "list" | "book") => void
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
    viewMode,
    onViewModeChange,
    isMobile,
    t,
}: CatalogHeaderProps) {
    const showBrandSuffix =
        !(catalogName.toLowerCase().includes('fog') && catalogName.toLowerCase().includes('catalog'))

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Brand + catalog name */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center group">
                            <span className="font-montserrat text-xl tracking-tighter flex items-center">
                                <span className="font-black text-[#cf1414] uppercase">Fog</span>
                                {showBrandSuffix && (
                                    <span className="font-light text-slate-900">Catalog</span>
                                )}
                            </span>
                        </Link>
                        <div className="h-6 w-px bg-slate-200" />
                        <h1 className="text-sm font-semibold text-slate-600 truncate max-w-[200px]">
                            {catalogName}
                        </h1>
                    </div>

                    {/* Search + actions */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t("catalogs.public.searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border-none rounded-full text-sm focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={onShare} className="rounded-full hover:bg-violet-50 hover:text-violet-600">
                                <Share2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onDownload} className="rounded-full hover:bg-violet-50 hover:text-violet-600">
                                <Download className="w-4 h-4" />
                            </Button>

                            {!isMobile && (
                                <div className="flex items-center gap-0.5 bg-slate-100 rounded-full p-0.5 ml-2 border border-slate-200">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onViewModeChange("list")}
                                        className={cn(
                                            "h-8 px-3 rounded-full text-[10px] font-black transition-all",
                                            viewMode === "list" ? "bg-white shadow-sm text-violet-600" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        <LayoutList className="w-3.5 h-3.5 mr-1.5" />
                                        LİSTE
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onViewModeChange("book")}
                                        className={cn(
                                            "h-8 px-3 rounded-full text-[10px] font-black transition-all",
                                            viewMode === "book" ? "bg-white shadow-sm text-violet-600" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                                        KİTAP
                                    </Button>
                                </div>
                            )}

                            {!isMobile && viewMode === "list" && (
                                <div className="flex items-center gap-0.5 bg-slate-100 rounded-full p-0.5 ml-2 border border-slate-200">
                                    <Button variant="ghost" size="icon" onClick={onZoomOut} className="h-8 w-8 rounded-full hover:bg-white transition-all shadow-sm" title="Uzaklaştır">
                                        <ZoomOut className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" className="h-8 px-2 text-[10px] font-black hover:bg-white rounded-lg transition-all" onClick={onZoomReset} title="Sıfırla">
                                        {Math.round(zoomScale * 100)}%
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={onZoomIn} className="h-8 w-8 rounded-full hover:bg-white transition-all shadow-sm" title="Yakınlaştır">
                                        <ZoomIn className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}

                            {!isMobile && (
                                <Button variant="ghost" size="icon" onClick={onToggleFullscreen} className="rounded-full hover:bg-slate-100 ml-1">
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
                                        ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                                        : "bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-600",
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
