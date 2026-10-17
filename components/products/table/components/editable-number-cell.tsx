"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface EditableNumberCellProps {
    value: number
    /** Düzenleme dışındaki görünüm (biçimlenmiş fiyat, stok rozeti...) */
    children: React.ReactNode
    onSave: (value: number) => Promise<void>
    label: string
    integer?: boolean
    align?: "left" | "right" | "center"
    className?: string
}

function parseNumber(raw: string, integer: boolean): number | null {
    const normalized = raw.trim().replace(/\./g, "").replace(",", ".")
    if (!normalized) return null
    const parsed = Number(normalized)
    if (!Number.isFinite(parsed) || parsed < 0) return null
    return integer ? Math.round(parsed) : Math.round(parsed * 100) / 100
}

/**
 * Tıklayınca yerinde sayı alanına dönüşen hücre (liste görünümünde fiyat/stok).
 * Enter veya alandan çıkınca kaydeder, Esc vazgeçer. Kaydetme başarısızsa değer geri döner.
 */
export function EditableNumberCell({ value, children, onSave, label, integer = false, align = "right", className }: EditableNumberCellProps) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState("")
    const [saving, setSaving] = useState(false)
    const [invalid, setInvalid] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const cancelledRef = useRef(false)

    useEffect(() => {
        if (editing) inputRef.current?.select()
    }, [editing])

    const start = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation()
        cancelledRef.current = false
        setInvalid(false)
        setDraft(integer ? String(value) : String(value).replace(".", ","))
        setEditing(true)
    }

    const commit = async () => {
        if (cancelledRef.current) return
        const next = parseNumber(draft, integer)
        if (next === null) {
            setInvalid(true)
            inputRef.current?.focus()
            return
        }
        if (next === value) {
            setEditing(false)
            return
        }
        setSaving(true)
        try {
            await onSave(next)
            setEditing(false)
        } catch {
            // Hata bildirimi çağıran tarafta; alan açık kalır ki kullanıcı düzeltebilsin
            inputRef.current?.focus()
        } finally {
            setSaving(false)
        }
    }

    if (editing) {
        return (
            <div className={cn("relative", className)} onClick={(e) => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    inputMode={integer ? "numeric" : "decimal"}
                    aria-label={label}
                    aria-invalid={invalid}
                    value={draft}
                    disabled={saving}
                    onChange={(e) => {
                        setDraft(e.target.value)
                        setInvalid(false)
                    }}
                    onBlur={() => void commit()}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            void commit()
                        } else if (e.key === "Escape") {
                            cancelledRef.current = true
                            setEditing(false)
                        }
                    }}
                    className={cn(
                        "h-8 w-full rounded-md border bg-background px-2 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        align === "right" && "text-right",
                        align === "center" && "text-center",
                        invalid && "border-destructive focus-visible:ring-destructive/40",
                        saving && "pr-7"
                    )}
                />
                {saving && <Loader2 className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
        )
    }

    return (
        <button
            type="button"
            onClick={start}
            title={label}
            aria-label={label}
            className={cn(
                // Hover alanı hücreden taşar ama metin sütun başlığıyla aynı hizada kalır
                "-mx-2 flex min-h-8 w-[calc(100%+1rem)] items-center rounded-md px-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                align === "right" && "justify-end",
                align === "center" && "justify-center",
                className
            )}
        >
            {children}
        </button>
    )
}
