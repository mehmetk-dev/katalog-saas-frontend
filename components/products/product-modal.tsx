"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type Product, type CustomAttribute, createProduct, updateProduct } from "@/lib/actions/products"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSaved: (product: Product) => void
}

const COMMON_UNITS = [
  { value: "none", label: "Birim yok" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "m", label: "Metre (m)" },
  { value: "cm", label: "Santimetre (cm)" },
  { value: "mm", label: "Milimetre (mm)" },
  { value: "L", label: "Litre (L)" },
  { value: "mL", label: "Mililitre (mL)" },
  { value: "adet", label: "Adet" },
  { value: "paket", label: "Paket" },
  { value: "kutu", label: "Kutu" },
]

export function ProductModal({ open, onOpenChange, product, onSaved }: ProductModalProps) {
  const [isPending, startTransition] = useTransition()
  const isEditing = !!product

  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>(() => product?.custom_attributes || [])

  const addCustomAttribute = () => {
    setCustomAttributes([...customAttributes, { name: "", value: "", unit: "" }])
  }

  const removeCustomAttribute = (index: number) => {
    setCustomAttributes(customAttributes.filter((_, i) => i !== index))
  }

  const updateCustomAttribute = (index: number, field: keyof CustomAttribute, value: string) => {
    const updated = [...customAttributes]
    const finalValue = field === "unit" && value === "none" ? "" : value
    updated[index] = { ...updated[index], [field]: finalValue }
    setCustomAttributes(updated)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    formData.set("custom_attributes", JSON.stringify(customAttributes.filter((a) => a.name && a.value)))

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateProduct(product.id, formData)
          onSaved({
            ...product,
            name: formData.get("name") as string,
            sku: formData.get("sku") as string,
            description: formData.get("description") as string,
            price: Number.parseFloat(formData.get("price") as string) || 0,
            stock: Number.parseInt(formData.get("stock") as string) || 0,
            category: formData.get("category") as string,
            image_url: formData.get("image_url") as string,
            custom_attributes: customAttributes.filter((a) => a.name && a.value),
          })
          toast.success("Ürün güncellendi")
        } else {
          const newProduct = await createProduct(formData)
          onSaved(newProduct)
          toast.success("Ürün oluşturuldu")
        }
        onOpenChange(false)
        setCustomAttributes([])
      } catch {
        toast.error(isEditing ? "Ürün güncellenemedi" : "Ürün oluşturulamadı")
      }
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setCustomAttributes(product?.custom_attributes || [])
    } else {
      setCustomAttributes([])
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Ürün Adı *</Label>
              <Input id="name" name="name" defaultValue={product?.name} required placeholder="örn: Ahşap Sandalye" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">Stok Kodu (SKU)</Label>
              <Input id="sku" name="sku" defaultValue={product?.sku || ""} placeholder="örn: MOB-001" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={product?.description || ""}
              placeholder="Ürününüzü tanımlayın..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Fiyat (₺)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.price || ""}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stok Adedi</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                defaultValue={product?.stock || ""}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input id="category" name="category" defaultValue={product?.category || ""} placeholder="örn: Mobilya" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Görsel URL</Label>
            <Input
              id="image_url"
              name="image_url"
              type="url"
              defaultValue={product?.image_url || ""}
              placeholder="https://ornek.com/gorsel.jpg"
            />
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Özel Özellikler</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomAttribute}
                className="gap-1 bg-transparent"
              >
                <Plus className="w-4 h-4" />
                Özellik Ekle
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Ağırlık, uzunluk, renk gibi özel özellikler ekleyebilirsiniz.
            </p>

            {customAttributes.map((attr, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Özellik adı (örn: Ağırlık)"
                    value={attr.name}
                    onChange={(e) => updateCustomAttribute(index, "name", e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Değer (örn: 2.5)"
                    value={attr.value}
                    onChange={(e) => updateCustomAttribute(index, "value", e.target.value)}
                  />
                </div>
                <div className="w-36">
                  <Select
                    value={attr.unit || "none"}
                    onValueChange={(value) => updateCustomAttribute(index, "unit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Birim" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCustomAttribute(index)}
                  className="shrink-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Kaydediliyor..." : isEditing ? "Değişiklikleri Kaydet" : "Ürün Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
