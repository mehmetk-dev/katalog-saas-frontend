"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Palette, Type, Grid3X3, GripVertical, Trash2, Package } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/actions/products"
import Link from "next/link"

interface CatalogEditorProps {
  products: Product[]
  selectedProductIds: string[]
  onSelectedProductIdsChange: (ids: string[]) => void
  catalogName: string
  onCatalogNameChange: (name: string) => void
  description: string
  onDescriptionChange: (desc: string) => void
  layout: string
  onLayoutChange: (layout: string) => void
  primaryColor: string
  onPrimaryColorChange: (color: string) => void
  showPrices: boolean
  onShowPricesChange: (show: boolean) => void
  showDescriptions: boolean
  onShowDescriptionsChange: (show: boolean) => void
}

export function CatalogEditor({
  products,
  selectedProductIds,
  onSelectedProductIdsChange,
  catalogName,
  onCatalogNameChange,
  description,
  onDescriptionChange,
  layout,
  onLayoutChange,
  primaryColor,
  onPrimaryColorChange,
  showPrices,
  onShowPricesChange,
  showDescriptions,
  onShowDescriptionsChange,
}: CatalogEditorProps) {
  const toggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      onSelectedProductIdsChange(selectedProductIds.filter((i) => i !== id))
    } else {
      onSelectedProductIdsChange([...selectedProductIds, id])
    }
  }

  const removeProduct = (id: string) => {
    onSelectedProductIdsChange(selectedProductIds.filter((i) => i !== id))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Catalog Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="w-4 h-4" />
            Catalog Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={catalogName} onChange={(e) => onCatalogNameChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description for your catalog..."
              rows={3}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Layout & Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Layout & Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={layout} onValueChange={onLayoutChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid Layout</SelectItem>
                <SelectItem value="list">List Layout</SelectItem>
                <SelectItem value="cards">Cards Layout</SelectItem>
                <SelectItem value="masonry">Masonry Layout</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Prices</Label>
              <p className="text-xs text-muted-foreground">Display product prices</p>
            </div>
            <Switch checked={showPrices} onCheckedChange={onShowPricesChange} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Descriptions</Label>
              <p className="text-xs text-muted-foreground">Display product descriptions</p>
            </div>
            <Switch checked={showDescriptions} onCheckedChange={onShowDescriptionsChange} />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                className="flex-1 font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Products ({selectedProductIds.length} selected)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No products yet</p>
              <Button size="sm" asChild>
                <Link href="/dashboard/products">Add Products</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {products.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
                  <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                  <Checkbox
                    checked={selectedProductIds.includes(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                  />
                  <img
                    src={product.image_url || "/placeholder.svg?height=32&width=32&query=product"}
                    alt={product.name}
                    className="w-8 h-8 rounded object-cover bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">${Number(product.price).toFixed(2)}</p>
                  </div>
                  {selectedProductIds.includes(product.id) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8"
                      onClick={() => removeProduct(product.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
