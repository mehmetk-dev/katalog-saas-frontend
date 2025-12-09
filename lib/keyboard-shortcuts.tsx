"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface KeyboardShortcutsProps {
    onSave?: () => void
    onExport?: () => void
}

export function useKeyboardShortcuts({ onSave, onExport }: KeyboardShortcutsProps = {}) {
    const router = useRouter()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + Key combinations
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        // Ctrl+S: Save
                        e.preventDefault()
                        if (onSave) {
                            onSave()
                            toast.success("Kaydedildi")
                        }
                        break
                    case 'p':
                        // Ctrl+P: Export/Print
                        e.preventDefault()
                        if (onExport) {
                            onExport()
                        }
                        break
                    case 'n':
                        // Ctrl+N: New catalog
                        e.preventDefault()
                        router.push("/dashboard/builder")
                        break
                    case 'k':
                        // Ctrl+K: Quick search (future)
                        e.preventDefault()
                        toast.info("Arama özelliği yakında!")
                        break
                }
            }

            // Escape key
            if (e.key === 'Escape') {
                // Close any open modals (handled by Radix)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [router, onSave, onExport])
}

// Keyboard shortcuts help component
export function KeyboardShortcutsHelp() {
    const shortcuts = [
        { keys: ['Ctrl', 'S'], action: 'Kaydet' },
        { keys: ['Ctrl', 'P'], action: 'PDF İndir' },
        { keys: ['Ctrl', 'N'], action: 'Yeni Katalog' },
        { keys: ['Ctrl', 'K'], action: 'Arama' },
        { keys: ['Esc'], action: 'Kapat' },
    ]

    return (
        <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">Klavye Kısayolları</h3>
            <div className="space-y-2">
                {shortcuts.map(({ keys, action }) => (
                    <div key={action} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{action}</span>
                        <div className="flex gap-1">
                            {keys.map((key) => (
                                <kbd
                                    key={key}
                                    className="px-2 py-0.5 bg-background border rounded text-xs font-mono"
                                >
                                    {key}
                                </kbd>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
