"use client"

import React from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CatalogFooterProps {
    t: (key: string) => string
}

export const CatalogFooter = React.memo(function CatalogFooter({ t }: CatalogFooterProps) {
    return (
        <footer className="shrink-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-row items-center justify-between gap-2 overflow-hidden">
                    <div className="flex items-center gap-2 shrink-0">
                        <Link href="/" className="flex items-center group">
                            <span className="font-montserrat text-base sm:text-lg tracking-tighter flex items-center">
                                <span className="font-black text-[#cf1414] uppercase">Fog</span>
                                <span className="font-light text-slate-900 hidden xs:inline">Catalog</span>
                            </span>
                        </Link>
                        <div className="h-4 w-px bg-slate-200" />
                        <p className="text-slate-500 text-[10px] sm:text-xs font-medium truncate max-w-[120px] sm:max-w-none">
                            {t("catalogs.public.createdWithPrefix")}{" "}
                            {t("catalogs.public.createdWithSuffix")}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <p className="text-slate-400 text-xs hidden md:block">
                            {t("catalogs.public.ctaDesc")}
                        </p>
                        <Link href="/">
                            <Button
                                size="sm"
                                className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white gap-1 sm:gap-2 text-[10px] sm:text-xs font-semibold"
                            >
                                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                {t("catalogs.public.startNow")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
})
