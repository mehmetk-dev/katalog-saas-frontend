"use client"

import * as React from "react"
import NextImage from "next/image"
import { HexColorPicker } from "react-colorful"
import { ChevronDown, ImagePlus, RefreshCw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { SectionWrapperProps } from "./types"

// ─── Section ──────────────────────────────────────────────────────────────────

/** Tasarım sekmesindeki açılır bölüm: başlık ve içerik tek kartta. */
export function SectionWrapper({ id, title, icon, isOpen, onToggle, children }: SectionWrapperProps) {
    const contentId = `design-section-${id}`
    return (
        <section className="rounded-xl border bg-card">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls={contentId}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
                <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
                <h3 className="flex-1 text-sm font-semibold text-foreground">{title}</h3>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            <div
                id={contentId}
                className="grid transition-[grid-template-rows] duration-200 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                // Kapalıyken içerik görsel olarak gizli ama DOM'da; klavye ve ekran okuyucu ulaşmasın
                inert={!isOpen}
                aria-hidden={!isOpen}
            >
                <div className={cn("min-h-0", isOpen ? "overflow-visible" : "overflow-hidden")}>
                    <div className="space-y-5 border-t px-4 py-4">{children}</div>
                </div>
            </div>
        </section>
    )
}

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({
    label,
    hint,
    htmlFor,
    className,
    children,
}: {
    label: React.ReactNode
    hint?: React.ReactNode
    htmlFor?: string
    className?: string
    children: React.ReactNode
}) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">{label}</Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    )
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

export function ToggleRow({
    label,
    description,
    checked,
    onCheckedChange,
    disabled,
}: {
    label: React.ReactNode
    description?: React.ReactNode
    checked: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
}) {
    const id = React.useId()
    return (
        <div className={cn("flex items-center justify-between gap-4", disabled && "opacity-50")}>
            <div className="min-w-0">
                <Label htmlFor={id} className="text-sm font-normal text-foreground">{label}</Label>
                {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        </div>
    )
}

// ─── Segmented control ────────────────────────────────────────────────────────

export function Segmented<T extends string | number>({
    value,
    options,
    onChange,
    ariaLabel,
}: {
    value: T
    options: Array<{ value: T; label: React.ReactNode }>
    onChange?: (value: T) => void
    ariaLabel?: string
}) {
    return (
        <div role="radiogroup" aria-label={ariaLabel} className="flex rounded-lg bg-muted p-1">
            {options.map((option) => (
                <button
                    key={String(option.value)}
                    type="button"
                    role="radio"
                    aria-checked={value === option.value}
                    onClick={() => onChange?.(option.value)}
                    className={cn(
                        "h-7 flex-1 rounded-md px-2 text-xs font-medium transition-colors",
                        value === option.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}

// ─── Color field ──────────────────────────────────────────────────────────────

const HEX_RE = /^#[0-9a-f]{6}$/i

/** Renk kutusu + hex girişi; tıklayınca seçici açılır (dışarı tıklayınca kapanır). */
export function ColorField({
    label,
    swatch,
    hex,
    onChange,
    presets,
}: {
    label: React.ReactNode
    /** Kutuda gösterilecek CSS rengi (rgba olabilir) */
    swatch: string
    hex: string
    onChange: (hex: string) => void
    presets?: string[]
}) {
    const [draft, setDraft] = React.useState(hex)
    React.useEffect(() => setDraft(hex), [hex])

    return (
        <Field label={label}>
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            aria-label={typeof label === "string" ? label : undefined}
                            className="size-9 shrink-0 rounded-md border border-foreground/15 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            style={{ backgroundColor: swatch }}
                        />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto space-y-3 p-3">
                        <HexColorPicker color={hex} onChange={onChange} style={{ width: 208, height: 160 }} />
                        {presets && presets.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {presets.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        title={color}
                                        onClick={() => onChange(color)}
                                        className={cn(
                                            "size-6 rounded-md border outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
                                            color.toLowerCase() === hex.toLowerCase() && "ring-2 ring-ring ring-offset-1 ring-offset-background"
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
                <Input
                    value={draft}
                    onChange={(e) => {
                        const next = e.target.value.trim()
                        setDraft(next)
                        const normalized = next.startsWith("#") ? next : `#${next}`
                        if (HEX_RE.test(normalized)) onChange(normalized.toLowerCase())
                    }}
                    onBlur={() => setDraft(hex)}
                    className="h-9 font-mono text-xs uppercase"
                    spellCheck={false}
                    maxLength={7}
                />
            </div>
        </Field>
    )
}

// ─── Image field ──────────────────────────────────────────────────────────────

/** Görsel yükleme alanı: boşken seçme kutusu, doluyken önizleme + değiştir/kaldır. */
export function ImageField({
    label,
    imageUrl,
    onPick,
    onRemove,
    hint,
    changeLabel,
    removeLabel,
    pickLabel,
    className,
    previewClassName = "h-28",
}: {
    label: React.ReactNode
    imageUrl: string | null
    onPick: () => void
    onRemove?: () => void
    hint?: React.ReactNode
    pickLabel: string
    changeLabel: string
    removeLabel: string
    className?: string
    previewClassName?: string
}) {
    return (
        <Field label={label} className={className}>
            {imageUrl ? (
                <div className="space-y-2">
                    <div className={cn("relative overflow-hidden rounded-lg border bg-muted", previewClassName)}>
                        <NextImage src={imageUrl} alt="" fill className="object-contain p-2" unoptimized />
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onPick}>
                            <RefreshCw className="size-3.5" />
                            {changeLabel}
                        </Button>
                        {onRemove && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                onClick={onRemove}
                                aria-label={removeLabel}
                                title={removeLabel}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={onPick}
                    className={cn(
                        "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/40 text-muted-foreground outline-none transition-colors hover:border-ring hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                        previewClassName
                    )}
                >
                    <ImagePlus className="size-5" />
                    <span className="text-xs font-medium">{pickLabel}</span>
                    {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
                </button>
            )}
        </Field>
    )
}
