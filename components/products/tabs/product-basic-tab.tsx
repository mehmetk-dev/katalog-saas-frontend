"use client"

import React, { useState, memo } from "react"
import { toast } from "sonner"
import { Check, Plus, Sparkles, Wand2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type ProductFormField = "name" | "price" | "stock" | "productUrl"
export type ProductFormErrors = Partial<Record<ProductFormField, string>>

/** "siteniz.com/urun" gibi protokolsüz linklere https:// ekler */
export function normalizeProductUrl(value: string): string {
    const url = value.trim()
    if (!url) return ""
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`
}

function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) return null
    return (
        <p id={id} className="text-xs text-destructive" role="alert">
            {message}
        </p>
    )
}

// ─── Props ───────────────────────────────────────────────────────────
interface ProductBasicTabProps {
    name: string
    onNameChange: (v: string) => void
    sku: string
    onSkuChange: (v: string) => void
    description: string
    onDescriptionChange: (v: string) => void
    price: string
    onPriceChange: (v: string) => void
    stock: string
    onStockChange: (v: string) => void
    currency: string
    onCurrencyChange: (v: string) => void
    productUrl: string
    onProductUrlChange: (v: string) => void
    category: string[]
    onCategoryChange: (v: string[]) => void
    allCategories: string[]
    canCreateCategory: boolean
    language: string
    errors?: ProductFormErrors
    t: (key: string, params?: Record<string, unknown>) => string
}

// ─── Component ───────────────────────────────────────────────────────
export const ProductBasicTab = memo(function ProductBasicTab({
    name, onNameChange, sku, onSkuChange, description, onDescriptionChange,
    price, onPriceChange, stock, onStockChange, currency, onCurrencyChange,
    productUrl, onProductUrlChange, category, onCategoryChange,
    allCategories, canCreateCategory, language, errors = {}, t,
}: ProductBasicTabProps) {
    const [categoryInput, setCategoryInput] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)

    // Gerçek yapay zeka açıklaması (Excel düzenleyicisinin kullandığı uç); önceden ürüne bakmadan
    // 7 hazır metinden biri rastgele seçiliyordu.
    const generateAiDescription = async () => {
        if (!name.trim()) {
            toast.error(t("productForm.aiNeedsName"))
            return
        }
        setIsGenerating(true)
        try {
            const response = await fetch("/api/excel-ai/generate-descriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: language === "en" ? "en" : "tr",
                    products: [{
                        id: "draft",
                        name: name.trim().slice(0, 300),
                        category: category.join(", ").slice(0, 200) || null,
                        currentDescription: description.trim().slice(0, 5000) || null,
                    }],
                }),
            })
            const data = await response.json().catch(() => null) as { descriptions?: { productId: string; description: string }[] } | null
            const generated = data?.descriptions?.find((item) => item.productId === "draft")?.description
            if (!response.ok || !generated) throw new Error("ai_failed")
            onDescriptionChange(generated)
            toast.success(t("productForm.aiDone"))
        } catch {
            toast.error(t("productForm.aiFailed"))
        } finally {
            setIsGenerating(false)
        }
    }

    const generateSKU = () => {
        const prefix = category.length > 0 ? category[0].substring(0, 3).toUpperCase() : "URN"
        const random = Math.random().toString(36).substring(2, 8).toUpperCase()
        onSkuChange(`${prefix}-${random}`)
        toast.success(t("toasts.skuGenerated"))
    }

    const toggleCategory = (cat: string) => {
        onCategoryChange(
            category.includes(cat) ? category.filter((c) => c !== cat) : [...category, cat]
        )
    }

    const addNewCategory = () => {
        if (!canCreateCategory) {
            toast.error(t("products.categoryUpgradeRequired"))
            return
        }

        const trimmed = categoryInput.trim()
        if (trimmed && !category.includes(trimmed)) {
            onCategoryChange([...category, trimmed])
            setCategoryInput("")
        }
    }

    // Mevcut kategoriler + bu üründe yeni eklenip henüz listede olmayanlar
    const categoryOptions = Array.from(new Set([...allCategories, ...category]))

    return (
        <div className="space-y-5">
            {/* Ad */}
            <div className="space-y-2">
                <Label htmlFor="name">
                    {t("products.name")} <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    required
                    maxLength={200}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    placeholder={t("products.productNamePlaceholder")}
                    className="h-10"
                />
                <FieldError id="name-error" message={errors.name} />
            </div>

            {/* Fiyat & stok: en sık doldurulan alanlar ilk ekranda */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="price">{t("products.price")}</Label>
                    <div className="flex h-10 overflow-hidden rounded-md border bg-background shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                        <Select value={currency} onValueChange={onCurrencyChange}>
                            <SelectTrigger aria-label={t("products.currency")} className="h-full w-[6.5rem] shrink-0 rounded-none border-0 border-r bg-muted/40 shadow-none focus-visible:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[100]">
                                <SelectItem value="TRY">₺ TRY</SelectItem>
                                <SelectItem value="USD">$ USD</SelectItem>
                                <SelectItem value="EUR">€ EUR</SelectItem>
                                <SelectItem value="GBP">£ GBP</SelectItem>
                            </SelectContent>
                        </Select>
                        <input
                            id="price"
                            type="text"
                            inputMode="decimal"
                            value={price}
                            onChange={(e) => onPriceChange(e.target.value.replace(/[^0-9.,]/g, ""))}
                            aria-invalid={Boolean(errors.price)}
                            aria-describedby={errors.price ? "price-error" : undefined}
                            placeholder={language === "en" ? "0.00" : "0,00"}
                            className="min-w-0 flex-1 bg-transparent px-3 text-right text-sm font-medium tabular-nums outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                    <FieldError id="price-error" message={errors.price} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="stock">{t("products.stockCount")}</Label>
                    <div className="relative">
                        <Input
                            id="stock"
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={stock}
                            onChange={(e) => onStockChange(e.target.value)}
                            aria-invalid={Boolean(errors.stock)}
                            aria-describedby={errors.stock ? "stock-error" : "stock-status"}
                            placeholder="0"
                            className="h-10 pr-24 tabular-nums"
                        />
                        <span id="stock-status" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                            {Number(stock) === 0 ? (
                                <Badge className="border-destructive/20 bg-destructive-soft text-destructive-soft-foreground">{t("products.outOfStock")}</Badge>
                            ) : Number(stock) < 10 ? (
                                <Badge variant="warning">{t("products.lowStock")}</Badge>
                            ) : (
                                <Badge variant="success">{t("products.inStock")}</Badge>
                            )}
                        </span>
                    </div>
                    <FieldError id="stock-error" message={errors.stock} />
                </div>
            </div>

            {/* Stok kodu */}
            <div className="space-y-2">
                <Label htmlFor="sku">
                    {t("products.sku")} <span className="text-xs font-normal text-muted-foreground">{t("productForm.optional")}</span>
                </Label>
                <div className="flex gap-2">
                    <Input
                        id="sku"
                        value={sku}
                        onChange={(e) => onSkuChange(e.target.value)}
                        placeholder={t("products.skuPlaceholder")}
                        className="h-10 font-mono"
                    />
                    <Button type="button" variant="outline" className="h-10 shrink-0" onClick={generateSKU} title={t("productForm.generateSkuHint")}>
                        <Sparkles className="size-4" />
                        {t("productForm.generateSku")}
                    </Button>
                </div>
            </div>

            {/* Kategoriler: seçili olanlar işaretli; tıklayınca eklenir/çıkarılır */}
            <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                    <Label>{t("categories.title")}</Label>
                    {category.length > 0 && (
                        <span className="text-xs text-muted-foreground">{t("products.selected", { count: category.length })}</span>
                    )}
                </div>
                {categoryOptions.length > 0 && (
                    <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                        {categoryOptions.map((cat) => {
                            const active = category.includes(cat)
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => toggleCategory(cat)}
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                                    )}
                                >
                                    {active && <Check className="size-3" />}
                                    {cat}
                                </button>
                            )
                        })}
                    </div>
                )}
                <div className="flex gap-2">
                    <Input
                        name="newCategoryInput"
                        aria-label={t("products.newCategory")}
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        disabled={!canCreateCategory}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                if (categoryInput.trim()) addNewCategory()
                            }
                        }}
                        placeholder={t("products.newCategory")}
                        className="h-9 text-sm"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 shrink-0"
                        onClick={addNewCategory}
                        disabled={!canCreateCategory || !categoryInput.trim()}
                        aria-label={t("products.addCategory")}
                        title={t("products.addCategory")}
                    >
                        <Plus className="size-4" />
                    </Button>
                </div>
                {!canCreateCategory && (
                    <p className="text-xs text-muted-foreground">{t("products.categoryUpgradeHint")}</p>
                )}
            </div>

            {/* Açıklama */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="description">{t("products.description")}</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs"
                        onClick={generateAiDescription}
                        disabled={isGenerating}
                    >
                        {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                        {isGenerating ? t("productForm.aiGenerating") : t("products.generateAi")}
                    </Button>
                </div>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder={t("products.descriptionPlaceholder")}
                    rows={4}
                    maxLength={5000}
                    className="resize-none"
                />
            </div>

            {/* Ürün linki */}
            <div className="space-y-2">
                <Label htmlFor="productUrl">
                    {t("products.productUrl")} <span className="text-xs font-normal text-muted-foreground">{t("productForm.optional")}</span>
                </Label>
                <Input
                    id="productUrl"
                    type="url"
                    inputMode="url"
                    value={productUrl}
                    onChange={(e) => onProductUrlChange(e.target.value)}
                    onBlur={(e) => onProductUrlChange(normalizeProductUrl(e.target.value))}
                    aria-invalid={Boolean(errors.productUrl)}
                    aria-describedby={errors.productUrl ? "productUrl-error" : "productUrl-desc"}
                    placeholder="https://example.com/urun-sayfasi"
                    className="h-10"
                />
                <FieldError id="productUrl-error" message={errors.productUrl} />
                <p id="productUrl-desc" className="text-xs text-muted-foreground">{t("products.productUrlDesc")}</p>
            </div>
        </div>
    )
})
