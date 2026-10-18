"use client"

import { useEffect, useId, useState } from "react"
import { BookOpen, Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCatalogs, type Catalog } from "@/lib/actions/catalogs"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"
import type { BulkCategoryMode, BulkStockMode } from "@/components/products/hooks/use-products-extra-actions"
import { getCatalogProductCount } from "@/lib/catalog-product-count"

type Translate = (key: string, params?: Record<string, unknown>) => string

function useT(): Translate {
    const { t } = useTranslation()
    return (key, params) => t(key, params) as string
}

/** Tek seçimli düğme grubu (mod seçimi) */
function Segmented<T extends string>({ value, onChange, options, label }: {
    value: T
    onChange: (value: T) => void
    options: Array<{ value: T; label: string }>
    label: string
}) {
    return (
        <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        "rounded-md px-2 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        value === option.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}

interface BaseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    count: number
    isWorking: boolean
}

export function BulkCategoryDialog({ open, onOpenChange, count, isWorking, categories, onSubmit }: BaseDialogProps & {
    categories: string[]
    onSubmit: (category: string, mode: BulkCategoryMode) => Promise<boolean>
}) {
    const t = useT()
    const listId = useId()
    const [mode, setMode] = useState<BulkCategoryMode>("add")
    const [category, setCategory] = useState("")

    useEffect(() => {
        if (open) {
            setMode("add")
            setCategory("")
        }
    }, [open])

    const trimmed = category.trim()
    const invalid = trimmed.includes(",")
    const canSubmit = !isWorking && !invalid && (trimmed.length > 0 || mode === "replace")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form
                    className="space-y-5"
                    onSubmit={async (e) => {
                        e.preventDefault()
                        if (canSubmit && await onSubmit(trimmed, mode)) onOpenChange(false)
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{t("products.bulkEdit.categoryTitle")}</DialogTitle>
                        <DialogDescription>{t("products.bulkEdit.selectedCount", { count })}</DialogDescription>
                    </DialogHeader>

                    <Segmented
                        label={t("products.bulkEdit.mode")}
                        value={mode}
                        onChange={setMode}
                        options={[
                            { value: "add", label: t("products.bulkEdit.categoryAdd") },
                            { value: "replace", label: t("products.bulkEdit.categoryReplace") },
                            { value: "remove", label: t("products.bulkEdit.categoryRemove") },
                        ]}
                    />

                    <div className="space-y-2">
                        <Label htmlFor={`${listId}-input`}>{t("filters.category")}</Label>
                        <Input
                            id={`${listId}-input`}
                            list={listId}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder={t("products.bulkEdit.categoryPlaceholder")}
                            aria-invalid={invalid}
                            autoFocus
                        />
                        <datalist id={listId}>
                            {categories.map((c) => <option key={c} value={c} />)}
                        </datalist>
                        <p className={cn("text-xs", invalid ? "text-destructive" : "text-muted-foreground")}>
                            {invalid ? t("categories.nameHasComma") : t(`products.bulkEdit.categoryHint.${mode}`)}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
                        <Button type="submit" disabled={!canSubmit}>
                            {isWorking && <Loader2 className="size-4 animate-spin" />}
                            {t("products.bulkEdit.applyTo", { count })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function BulkStockDialog({ open, onOpenChange, count, isWorking, onSubmit }: BaseDialogProps & {
    onSubmit: (amount: number, mode: BulkStockMode) => Promise<boolean>
}) {
    const t = useT()
    const inputId = useId()
    const [mode, setMode] = useState<BulkStockMode>("set")
    const [amount, setAmount] = useState("")

    useEffect(() => {
        if (open) {
            setMode("set")
            setAmount("")
        }
    }, [open])

    const parsed = Number(amount)
    const valid = amount.trim() !== "" && Number.isInteger(parsed) && parsed >= 0 && parsed <= 10_000_000

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form
                    className="space-y-5"
                    onSubmit={async (e) => {
                        e.preventDefault()
                        if (valid && !isWorking && await onSubmit(parsed, mode)) onOpenChange(false)
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{t("products.bulkEdit.stockTitle")}</DialogTitle>
                        <DialogDescription>{t("products.bulkEdit.selectedCount", { count })}</DialogDescription>
                    </DialogHeader>

                    <Segmented
                        label={t("products.bulkEdit.mode")}
                        value={mode}
                        onChange={setMode}
                        options={[
                            { value: "set", label: t("products.bulkEdit.stockSet") },
                            { value: "increase", label: t("products.bulkEdit.stockIncrease") },
                            { value: "decrease", label: t("products.bulkEdit.stockDecrease") },
                        ]}
                    />

                    <div className="space-y-2">
                        <Label htmlFor={inputId}>{t("products.bulkEdit.stockAmount")}</Label>
                        <Input
                            id={inputId}
                            inputMode="numeric"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                            placeholder="0"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">{t(`products.bulkEdit.stockHint.${mode}`)}</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
                        <Button type="submit" disabled={!valid || isWorking}>
                            {isWorking && <Loader2 className="size-4 animate-spin" />}
                            {t("products.bulkEdit.applyTo", { count })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function AddToCatalogDialog({ open, onOpenChange, count, isWorking, onSubmit }: BaseDialogProps & {
    onSubmit: (catalogId: string) => Promise<boolean>
}) {
    const t = useT()
    const [catalogs, setCatalogs] = useState<Catalog[] | null>(null)
    const [failed, setFailed] = useState(false)
    const [selected, setSelected] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        let cancelled = false
        setSelected(null)
        setFailed(false)
        setCatalogs(null)
        getCatalogs()
            .then((list) => { if (!cancelled) setCatalogs(list) })
            .catch(() => { if (!cancelled) setFailed(true) })
        return () => { cancelled = true }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("products.bulkEdit.catalogTitle")}</DialogTitle>
                    <DialogDescription>{t("products.bulkEdit.catalogDescription", { count })}</DialogDescription>
                </DialogHeader>

                <div role="radiogroup" aria-label={t("products.bulkEdit.catalogTitle")} className="max-h-72 space-y-1 overflow-y-auto">
                    {catalogs === null && !failed && (
                        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            {t("common.loading")}
                        </div>
                    )}
                    {failed && <p className="py-8 text-center text-sm text-destructive">{t("toasts.errorOccurred")}</p>}
                    {catalogs?.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{t("products.bulkEdit.noCatalogs")}</p>}
                    {catalogs?.map((catalog) => {
                        const active = selected === catalog.id
                        return (
                            <button
                                key={catalog.id}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => setSelected(catalog.id)}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    active ? "border-foreground/40 bg-muted" : "hover:bg-muted/60"
                                )}
                            >
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                    <BookOpen className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">{catalog.name}</span>
                                    <span className="block text-xs text-muted-foreground">
                                        {t("products.bulkEdit.catalogProductCount", { count: getCatalogProductCount(catalog) })}
                                        {catalog.is_published && ` · ${t("products.bulkEdit.published")}`}
                                    </span>
                                </span>
                                {active && <Check className="size-4 shrink-0" />}
                            </button>
                        )
                    })}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
                    <Button
                        disabled={!selected || isWorking}
                        onClick={async () => {
                            if (selected && await onSubmit(selected)) onOpenChange(false)
                        }}
                    >
                        {isWorking && <Loader2 className="size-4 animate-spin" />}
                        {t("products.bulkEdit.addToCatalog")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
