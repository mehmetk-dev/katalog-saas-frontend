"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface PreviewFloatingHeaderProps {
    view: "split" | "editor" | "preview"
    onViewChange: (view: "split" | "editor" | "preview") => void
}

export function PreviewFloatingHeader({ view, onViewChange }: PreviewFloatingHeaderProps) {
    if (view !== "preview") return null

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md p-1.5 rounded-full border shadow-lg ring-1 ring-black/5">
                <Label
                    htmlFor="preview-mode-switch"
                    className="text-xs font-medium px-3 cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
                    onClick={() => onViewChange('split')}
                >
                    Editör
                </Label>
                <Switch
                    id="preview-mode-switch"
                    checked={true}
                    onCheckedChange={(checked) => !checked && onViewChange('split')}
                    className="data-[state=checked]:bg-primary"
                />
                <Label
                    className="text-xs font-medium px-3 text-foreground cursor-default"
                >
                    Önizleme
                </Label>
            </div>
        </div>
    )
}
