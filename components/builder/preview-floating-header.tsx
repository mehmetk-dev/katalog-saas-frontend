"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Pencil, MoreVertical, Globe, Download, Copy, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PreviewFloatingHeaderProps {
    view: "split" | "editor" | "preview"
    onViewChange: (view: "split" | "editor" | "preview") => void
    catalogName?: string
    onPublish?: () => void
    onDownloadPDF?: () => void
}

export function PreviewFloatingHeader({
    view,
    onViewChange,
    catalogName,
    onPublish,
    onDownloadPDF
}: PreviewFloatingHeaderProps) {
    if (view !== "preview") return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 w-[95%] max-w-md">
            <div className="flex items-center justify-between gap-2 bg-background/80 backdrop-blur-xl p-2 rounded-2xl border shadow-2xl ring-1 ring-black/10">
                <div className="flex items-center gap-2 pl-2 min-w-0">
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Önizleme</span>
                        <h2 className="text-xs sm:text-sm font-bold truncate text-foreground leading-none mt-1">
                            {catalogName || "İsimsiz"}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                        onClick={() => onViewChange('editor')}
                        size="sm"
                        variant="secondary"
                        className="h-9 px-3 rounded-xl flex items-center gap-2"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="font-bold text-xs hidden xs:inline">Düzenle</span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="top" className="w-48 p-1 mb-2">
                            <DropdownMenuItem onClick={onPublish}>
                                <Globe className="w-4 h-4 mr-2" />
                                Kataloğu Yayınla
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDownloadPDF}>
                                <Download className="w-4 h-4 mr-2" />
                                PDF İndir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="default"
                        size="sm"
                        className="h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200/50 flex items-center gap-2"
                        onClick={() => onViewChange('editor')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-bold text-xs">Geri</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
