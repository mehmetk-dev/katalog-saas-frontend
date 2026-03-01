"use client"

import * as React from "react"
import { useState } from "react"
import { Percent, DollarSign, Tag, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Product } from "@/lib/actions/products"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"

interface BulkActionsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedProducts: Product[]
    allCategories: string[]
    onSuccess: () => void
}

type ActionType = 'price' | 'category' | 'stock'

export function BulkActionsModal({
    open,
    onOpenChange,
    selectedProducts,
    allCategories,
    onSuccess
}: BulkActionsModalProps) {
    const [actionType, setActionType] = useState<ActionType>('price')
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)

    // Price action state
    const [priceAction, setPriceAction] = useState<'increase' | 'decrease' | 'set'>('increase')
    const [priceValue, setPriceValue] = useState('')
    const [priceType, setPriceType] = useState<'percent' | 'fixed'>('percent')

    // Category action state
    const [selectedCategory, setSelectedCategory] = useState('')
    const [newCategory, setNewCategory] = useState('')

    // Stock action state
    const [stockAction, setStockAction] = useState<'increase' | 'decrease' | 'set'>('set')
    const [stockValue, setStockValue] = useState('')

    const handleApply = async () => {
        if (selectedProducts.length === 0) {
            toast.error("Hiç ürün seçilmedi")
            return
        }

        setIsProcessing(true)
        setProgress(0)

        const supabase = createClient()

        try {
            // Kategori ve sabit değer işlemleri: tüm ürünleri tek sorguda güncelle
            if (actionType === 'category') {
                const category = newCategory.trim() || selectedCategory
                if (!category) {
                    toast.error("Kategori seçilmedi")
                    setIsProcessing(false)
                    return
                }
                const productIds = selectedProducts.map(p => p.id)
                const { error } = await supabase
                    .from('products')
                    .update({ category })
                    .in('id', productIds)
                if (error) throw error
                setProgress(100)
                toast.success(`${productIds.length} ürün başarıyla güncellendi`)
                onSuccess()
                onOpenChange(false)

            } else if (actionType === 'stock' && stockAction === 'set') {
                const value = parseInt(stockValue)
                if (isNaN(value) || value < 0) {
                    toast.error("Geçersiz stok değeri")
                    setIsProcessing(false)
                    return
                }
                const productIds = selectedProducts.map(p => p.id)
                const { error } = await supabase
                    .from('products')
                    .update({ stock: value })
                    .in('id', productIds)
                if (error) throw error
                setProgress(100)
                toast.success(`${productIds.length} ürün başarıyla güncellendi`)
                onSuccess()
                onOpenChange(false)

            } else if (actionType === 'price' && priceAction === 'set' && priceType === 'fixed') {
                const value = parseFloat(priceValue)
                if (isNaN(value) || value < 0) {
                    toast.error("Geçersiz fiyat değeri")
                    setIsProcessing(false)
                    return
                }
                const productIds = selectedProducts.map(p => p.id)
                const { error } = await supabase
                    .from('products')
                    .update({ price: Math.max(0, Math.round(value * 100) / 100) })
                    .in('id', productIds)
                if (error) throw error
                setProgress(100)
                toast.success(`${productIds.length} ürün başarıyla güncellendi`)
                onSuccess()
                onOpenChange(false)

            } else {
                // Ürüne özel hesaplama gerektiren işlemler (yüzde artış/azalış vb.)
                let successCount = 0
                let errorCount = 0

                for (let i = 0; i < selectedProducts.length; i++) {
                    const product = selectedProducts[i]
                    const updateData: Record<string, string | number | null> = {}

                    try {
                        if (actionType === 'price') {
                            const value = parseFloat(priceValue)
                            if (isNaN(value) || value < 0) { errorCount++; continue }

                            let newPrice = product.price || 0
                            if (priceType === 'percent') {
                                const change = (newPrice * value) / 100
                                newPrice = priceAction === 'increase' ? newPrice + change : newPrice - change
                            } else {
                                newPrice = priceAction === 'increase' ? newPrice + value : newPrice - value
                            }
                            updateData.price = Math.max(0, Math.round(newPrice * 100) / 100)

                        } else if (actionType === 'stock') {
                            const value = parseInt(stockValue)
                            if (isNaN(value) || value < 0) { errorCount++; continue }
                            updateData.stock = stockAction === 'increase'
                                ? (product.stock || 0) + value
                                : Math.max(0, (product.stock || 0) - value)
                        }

                        const { error } = await supabase
                            .from('products')
                            .update(updateData)
                            .eq('id', product.id)
                        if (error) throw error
                        successCount++
                    } catch {
                        errorCount++
                    }

                    setProgress(Math.round(((i + 1) / selectedProducts.length) * 100))
                }

                if (successCount > 0) {
                    toast.success(`${successCount} ürün başarıyla güncellendi`)
                    onSuccess()
                    onOpenChange(false)
                }
                if (errorCount > 0) {
                    toast.error(`${errorCount} ürün güncellenemedi`)
                }
            }
        } catch {
            toast.error('Toplu işlem sırasında hata oluştu')
        } finally {
            setIsProcessing(false)
            setProgress(0)
        }
    }

    const resetState = () => {
        setPriceValue('')
        setStockValue('')
        setSelectedCategory('')
        setNewCategory('')
    }

    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (!open) resetState()
            onOpenChange(open)
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Toplu İşlem</DialogTitle>
                    <DialogDescription>
                        {selectedProducts.length} ürün seçildi
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Action Type Selection */}
                    <div className="space-y-2">
                        <Label>İşlem Türü</Label>
                        <RadioGroup
                            value={actionType}
                            onValueChange={(v) => setActionType(v as ActionType)}
                            className="grid grid-cols-3 gap-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="price" id="price" />
                                <Label htmlFor="price" className="flex items-center gap-1 cursor-pointer">
                                    <DollarSign className="w-4 h-4" />
                                    Fiyat
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="category" id="category" />
                                <Label htmlFor="category" className="flex items-center gap-1 cursor-pointer">
                                    <Tag className="w-4 h-4" />
                                    Kategori
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="stock" id="stock" />
                                <Label htmlFor="stock" className="flex items-center gap-1 cursor-pointer">
                                    <Percent className="w-4 h-4" />
                                    Stok
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Price Action */}
                    {actionType === 'price' && (
                        <div className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                            <div className="space-y-2">
                                <Label>İşlem</Label>
                                <RadioGroup
                                    value={priceAction}
                                    onValueChange={(v) => setPriceAction(v as 'increase' | 'decrease' | 'set')}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="increase" id="increase" />
                                        <Label htmlFor="increase" className="cursor-pointer">Artır</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="decrease" id="decrease" />
                                        <Label htmlFor="decrease" className="cursor-pointer">Azalt</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="set" id="set" />
                                        <Label htmlFor="set" className="cursor-pointer">Sabitle</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Değer</Label>
                                    <Input
                                        type="number"
                                        value={priceValue}
                                        onChange={(e) => setPriceValue(e.target.value)}
                                        placeholder="10"
                                        min="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tür</Label>
                                    <Select value={priceType} onValueChange={(v) => setPriceType(v as 'percent' | 'fixed')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percent">Yüzde (%)</SelectItem>
                                            <SelectItem value="fixed">Sabit (₺)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {priceAction === 'set'
                                    ? `Tüm ürünlerin fiyatı ${priceValue || '0'}${priceType === 'percent' ? '%' : '₺'} olarak ayarlanacak`
                                    : `Tüm ürünlerin fiyatı ${priceValue || '0'}${priceType === 'percent' ? '%' : '₺'} ${priceAction === 'increase' ? 'artırılacak' : 'azaltılacak'}`
                                }
                            </p>
                        </div>
                    )}

                    {/* Category Action */}
                    {actionType === 'category' && (
                        <div className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                            <div className="space-y-2">
                                <Label>Mevcut Kategoriler</Label>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kategori seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allCategories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                                <span className="text-xs text-muted-foreground">veya</span>
                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                            </div>

                            <div className="space-y-2">
                                <Label>Yeni Kategori</Label>
                                <Input
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="Yeni kategori adı..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Stock Action */}
                    {actionType === 'stock' && (
                        <div className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                            <div className="space-y-2">
                                <Label>İşlem</Label>
                                <RadioGroup
                                    value={stockAction}
                                    onValueChange={(v) => setStockAction(v as 'increase' | 'decrease' | 'set')}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="increase" id="stock-increase" />
                                        <Label htmlFor="stock-increase" className="cursor-pointer">Artır</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="decrease" id="stock-decrease" />
                                        <Label htmlFor="stock-decrease" className="cursor-pointer">Azalt</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="set" id="stock-set" />
                                        <Label htmlFor="stock-set" className="cursor-pointer">Sabitle</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label>Miktar</Label>
                                <Input
                                    type="number"
                                    value={stockValue}
                                    onChange={(e) => setStockValue(e.target.value)}
                                    placeholder="10"
                                    min="0"
                                />
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {stockAction === 'set'
                                    ? `Tüm ürünlerin stoğu ${stockValue || '0'} olarak ayarlanacak`
                                    : `Tüm ürünlerin stoğu ${stockValue || '0'} adet ${stockAction === 'increase' ? 'artırılacak' : 'azaltılacak'}`
                                }
                            </p>
                        </div>
                    )}

                    {/* Progress */}
                    {isProcessing && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>İşleniyor...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={isProcessing}
                        className="gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                İşleniyor...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Uygula
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
