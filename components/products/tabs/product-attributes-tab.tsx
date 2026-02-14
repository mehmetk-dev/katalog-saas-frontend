"use client"

import React, { memo } from "react"
import { Plus, Trash2, GripVertical, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import type { CustomAttribute } from "@/lib/actions/products"

// ─── Constants ───────────────────────────────────────────────────────
const UNIT_KEYS = ["none", "kg", "g", "m", "cm", "mm", "L", "mL", "adet", "paket", "kutu"] as const

const QUICK_ATTRIBUTES = [
    { key: "color", icon: "🎨" },
    { key: "material", icon: "🧱" },
    { key: "weight", icon: "⚖️" },
    { key: "size", icon: "📐" },
    { key: "origin", icon: "🌍" },
    { key: "warranty", icon: "🛡️" },
] as const

// ─── Props ───────────────────────────────────────────────────────────
interface ProductAttributesTabProps {
    attributes: CustomAttribute[]
    onAttributesChange: (attrs: CustomAttribute[]) => void
    t: (key: string, params?: Record<string, unknown>) => string
}

// ─── Component ───────────────────────────────────────────────────────
export const ProductAttributesTab = memo(function ProductAttributesTab({
    attributes, onAttributesChange, t,
}: ProductAttributesTabProps) {

    const add = (presetName?: string) => {
        onAttributesChange([...attributes, { name: presetName || "", value: "", unit: "" }])
    }

    const remove = (index: number) => {
        onAttributesChange(attributes.filter((_, i) => i !== index))
    }

    const update = (index: number, field: keyof CustomAttribute, value: string) => {
        const next = [...attributes]
        next[index] = { ...next[index], [field]: field === "unit" && value === "none" ? "" : value }
        onAttributesChange(next)
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-base font-medium">{t("products.customAttributes")}</Label>
                        <p className="text-sm text-muted-foreground mt-1">{t("products.customAttributesDesc")}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => add()} className="gap-1.5">
                        <Plus className="w-4 h-4" />
                        {t("products.addAttribute")}
                    </Button>
                </div>

                {/* Quick add */}
                <div className="flex flex-wrap gap-2">
                    {QUICK_ATTRIBUTES.map((attr) => {
                        const label = t(`products.attributeNames.${attr.key}` as `products.attributeNames.${"color" | "material" | "weight" | "size" | "origin" | "warranty"}`)
                        return (
                            <Button
                                key={attr.key}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={() => add(label)}
                                disabled={attributes.some((a) => a.name === label)}
                            >
                                <span>{attr.icon}</span>
                                {label}
                            </Button>
                        )
                    })}
                </div>

                {/* Attribute list */}
                {attributes.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                            <Layers className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">{t("products.noAttributes")}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {attributes.map((attr, index) => (
                            <Card key={index} className="overflow-hidden">
                                <CardContent className="p-3">
                                    <div className="flex gap-2 items-center">
                                        <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                                        <div className="flex-1 grid grid-cols-3 gap-2">
                                            <Input placeholder={t("products.attributes")} value={attr.name} onChange={(e) => update(index, "name", e.target.value)} className="h-9" />
                                            <Input placeholder="Value" value={attr.value} onChange={(e) => update(index, "value", e.target.value)} className="h-9" />
                                            <Select value={attr.unit || "none"} onValueChange={(v) => update(index, "unit", v)}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Unit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {UNIT_KEYS.map((key) => (
                                                        <SelectItem key={key} value={key}>
                                                            {t(`products.units.${key}` as `products.units.${typeof key}`)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
})
