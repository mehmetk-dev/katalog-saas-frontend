"use client"

import React, { useState, memo } from "react"
import { toast } from "sonner"
import { Plus, Sparkles, Tag, Barcode, Wand2, ChevronDown, ChevronUp, FolderPlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ─── Magic Descriptions ──────────────────────────────────────────────
const MAGIC_DESCRIPTIONS: Record<string, string[]> = {
    tr: [
        "Modern tasarımı ve üstün kalitesiyle yaşam alanınıza zarafet katacak bu ürün, dayanıklı malzemelerden üretilmiş olup uzun ömürlü kullanım sunar.",
        "Ergonomik yapısı ve şık detaylarıyla dikkat çeken bu parça, beklentilerinizi fazlasıyla karşılayacak. Hem fonksiyonel hem estetik.",
        "Minimalist çizgileri ve fonksiyonel yapısıyla öne çıkan bu tasarım, kullanım kolaylığı sağlarken şıklığından ödün vermiyor.",
        "Kaliteden ödün vermeyenler için özel olarak tasarlandı. Her detayı özenle düşünülen bu ürün, stil sahibi kullanıcılar için ideal.",
        "Yüksek performans ve estetik bir arada. Bu ürün, günlük ihtiyaçlarınızı karşılarken mekanınıza modern bir dokunuş katacak.",
        "Profesyonel kullanım için tasarlanan bu ürün, üstün kalite standartlarıyla öne çıkıyor. Dayanıklı yapısıyla uzun yıllar size eşlik edecek.",
        "Zarif tasarımı ve kullanışlı özellikleriyle dikkat çeken bu ürün, her ortama uyum sağlayacak şekilde tasarlandı.",
    ],
    en: [
        "With its modern design and superior quality, this product adds elegance to your living space. Made from durable materials for long-lasting use.",
        "Standing out with its ergonomic structure and stylish details, this piece will exceed your expectations. Both functional and aesthetic.",
        "Featuring minimalist lines and functional structure, this design offers ease of use without compromising on style.",
        "Designed specifically for those who do not compromise on quality. Every detail is carefully considered, ideal for stylish users.",
        "High performance and aesthetics combined. This product will add a modern touch to your space while meeting your daily needs.",
        "Designed for professional use, this product stands out with superior quality standards. It will accompany you for many years with its durable structure.",
        "Attention-grabbing with its elegant design and useful features, this product is designed to fit into any environment.",
    ],
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
    t: (key: string, params?: Record<string, unknown>) => string
}

// ─── Component ───────────────────────────────────────────────────────
export const ProductBasicTab = memo(function ProductBasicTab({
    name, onNameChange, sku, onSkuChange, description, onDescriptionChange,
    price, onPriceChange, stock, onStockChange, currency, onCurrencyChange,
    productUrl, onProductUrlChange, category, onCategoryChange,
    allCategories, canCreateCategory, language, t,
}: ProductBasicTabProps) {
    const [categoryInput, setCategoryInput] = useState("")
    const [showCategories, setShowCategories] = useState(false)

    const generateMagicDescription = () => {
        const pool = MAGIC_DESCRIPTIONS[language] || MAGIC_DESCRIPTIONS.tr
        const random = pool[Math.floor(Math.random() * pool.length)]
        onDescriptionChange(name ? `${name} - ${random}` : random)
        toast.success(t("toasts.magicDescription"))
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

    return (
        <div className="space-y-5">
            {/* Name */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        {t("products.name")} *
                    </Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        required
                        placeholder={t("products.productNamePlaceholder")}
                        className="h-11"
                    />
                </div>

                {/* SKU */}
                <div className="space-y-2">
                    <Label htmlFor="sku" className="flex items-center gap-2">
                        <Barcode className="w-4 h-4 text-muted-foreground" />
                        {t("products.sku")}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="sku"
                            value={sku}
                            onChange={(e) => onSkuChange(e.target.value)}
                            placeholder={t("products.skuPlaceholder")}
                            className="h-11"
                        />
                        <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={generateSKU}>
                            <Sparkles className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="hidden sm:block" />
            </div>

            {/* Categories */}
            <div className="space-y-2 pt-2">
                <button
                    type="button"
                    onClick={() => setShowCategories(!showCategories)}
                    className={cn(
                        "w-full flex items-center justify-between p-3",
                        "rounded-lg border bg-muted/30",
                        "hover:bg-muted/50 transition-colors"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <FolderPlus className="w-4 h-4 text-violet-600" />
                        <span className="font-medium text-sm">{t("categories.title")}</span>
                        {category.length > 0 && (
                            <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs">
                                {t("products.selected", { count: category.length })}
                            </Badge>
                        )}
                    </div>
                    {showCategories
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                </button>

                {/* Selected categories (collapsed view) */}
                {category.length > 0 && !showCategories && (
                    <div className="flex flex-wrap gap-1.5 px-1">
                        {category.map((cat, idx) => (
                            <Badge
                                key={idx}
                                variant="secondary"
                                className={cn(
                                    "pl-2 pr-1 py-0.5 gap-1 text-xs",
                                    "bg-violet-50 text-violet-700 border-violet-100"
                                )}
                            >
                                {cat}
                                <button
                                    type="button"
                                    onClick={() => onCategoryChange(category.filter((_, i) => i !== idx))}
                                    className="ml-0.5 hover:bg-violet-200 rounded-full p-0.5"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Category picker (expanded) */}
                {showCategories && (
                    <div className={cn(
                        "space-y-3 p-3 border rounded-lg bg-background",
                        "animate-in slide-in-from-top-2 duration-200"
                    )}>
                        {allCategories.length > 0 && (
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">{t("products.existingCategories")}</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {allCategories.map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => toggleCategory(cat)}
                                            className={cn(
                                                "px-2.5 py-1 text-xs rounded-full",
                                                "border transition-all",
                                                category.includes(cat)
                                                    ? "bg-violet-600 text-white border-violet-600"
                                                    : "bg-background hover:bg-violet-50 hover:border-violet-300"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Input
                                name="newCategoryInput"
                                value={categoryInput}
                                onChange={(e) => setCategoryInput(e.target.value)}
                                disabled={!canCreateCategory}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        if (categoryInput.trim()) {
                                            addNewCategory()
                                        }
                                    }
                                }}
                                onBlur={() => {
                                    // onBlur'da otomatik ekleme kaldırıldı — yalnızca Enter ve buton ile eklenir
                                }}
                                placeholder={t("products.newCategory")}
                                className="h-8 text-sm"
                            />
                            <Button
                                type="button"
                                size="sm"
                                className="h-8 px-3 bg-violet-600 hover:bg-violet-700"
                                onClick={addNewCategory}
                                disabled={!canCreateCategory || !categoryInput.trim()}
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        {!canCreateCategory && (
                            <p className="text-xs text-muted-foreground">
                                {t("products.categoryUpgradeHint")}
                            </p>
                        )}
                        {category.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                                {category.map((cat, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className={cn(
                                            "pl-2 pr-1 py-0.5 gap-1 text-xs",
                                            "bg-violet-50 text-violet-700"
                                        )}
                                    >
                                        {cat}
                                        <button
                                            type="button"
                                            onClick={() => onCategoryChange(category.filter((_, i) => i !== idx))}
                                            className="ml-0.5 hover:bg-violet-200 rounded-full p-0.5"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Product URL */}
            <div className="space-y-2 pt-2">
                <Label htmlFor="productUrl" className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                    </svg>
                    {t("products.productUrl")}
                    <span className="text-xs text-muted-foreground font-normal">(opsiyonel)</span>
                </Label>
                <Input
                    id="productUrl"
                    type="url"
                    value={productUrl}
                    onChange={(e) => onProductUrlChange(e.target.value)}
                    onBlur={(e) => {
                        const url = e.target.value.trim()
                        if (url && !/^https?:\/\//i.test(url)) {
                            toast.warning(t("products.urlProtocolWarning") || "URL http:// veya https:// ile başlamalıdır")
                        }
                    }}
                    placeholder="https://example.com/urun-sayfasi"
                    className="h-10"
                />
                <p className="text-xs text-muted-foreground">{t("products.productUrlDesc")}</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="description">{t("products.description")}</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-7 text-xs gap-1.5 text-violet-600",
                            "hover:text-violet-700 hover:bg-violet-50"
                        )}
                        onClick={generateMagicDescription}
                    >
                        <Wand2 className="w-3.5 h-3.5" />
                        {t("products.generateAi")}
                    </Button>
                </div>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder={t("products.descriptionPlaceholder")}
                    rows={4}
                    className="resize-none"
                />
            </div>

            {/* Price & Stock */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">{t("products.price")}</Label>
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                        <Select value={currency} onValueChange={onCurrencyChange}>
                            <SelectTrigger className={cn(
                                "w-24 h-11 px-3 bg-white dark:bg-slate-800",
                                "border border-slate-200 dark:border-slate-700",
                                "text-lg font-bold shadow-sm",
                                "hover:border-violet-400 transition-colors"
                            )}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[100]">
                                <SelectItem value="TRY">₺</SelectItem>
                                <SelectItem value="USD">$</SelectItem>
                                <SelectItem value="EUR">€</SelectItem>
                                <SelectItem value="GBP">£</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            id="price"
                            type="text"
                            inputMode="decimal"
                            value={price}
                            onChange={(e) => onPriceChange(e.target.value.replace(/[^0-9.,]/g, ""))}
                            placeholder="0.00"
                            className={cn(
                                "flex-1 h-12 text-2xl font-bold border-0",
                                "bg-transparent focus-visible:ring-0 text-right"
                            )}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="stock" className="text-sm font-medium">{t("products.stockCount")}</Label>
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                        <Input
                            id="stock"
                            type="number"
                            min="0"
                            value={stock}
                            onChange={(e) => onStockChange(e.target.value)}
                            placeholder="0"
                            className={cn(
                                "flex-1 h-12 text-2xl font-bold border-0",
                                "bg-transparent focus-visible:ring-0 text-center"
                            )}
                        />
                        <div className="shrink-0">
                            {Number(stock) === 0 ? (
                                <Badge variant="destructive" className="text-sm px-3 py-1">{t("products.outOfStock")}</Badge>
                            ) : Number(stock) < 10 ? (
                                <Badge className={cn(
                                    "bg-amber-100 text-amber-700",
                                    "dark:bg-amber-900/30 dark:text-amber-400",
                                    "text-sm px-3 py-1"
                                )}>{t("products.lowStock")}</Badge>
                            ) : (
                                <Badge className={cn(
                                    "bg-emerald-100 text-emerald-700",
                                    "dark:bg-emerald-900/30 dark:text-emerald-400",
                                    "text-sm px-3 py-1"
                                )}>{t("products.inStock")}</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
})
