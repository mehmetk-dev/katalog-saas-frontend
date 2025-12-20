"use client"

import { useState, useTransition, useRef } from "react"
import {
    FolderPlus,
    Folder,
    MoreVertical,
    Pencil,
    Trash2,
    Lock,
    Package,
    FolderOpen,
    ImagePlus,
    X,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import { createBrowserClient } from "@supabase/ssr"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { UpgradeModal } from "@/components/builder/upgrade-modal"
import { useTranslation } from "@/lib/i18n-provider"

interface Category {
    id: string
    name: string
    color: string
    productCount: number
    images?: string[]
    productNames?: string[]
    cover_image?: string
}

interface CategoriesPageClientProps {
    initialCategories: Category[]
    userPlan: "free" | "plus" | "pro"
}

const CATEGORY_COLORS = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#8b5cf6", // Violet
    "#ec4899", // Pink
]

export function CategoriesPageClient({ initialCategories, userPlan }: CategoriesPageClientProps) {
    const [categories, setCategories] = useState<Category[]>(initialCategories)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0])
    const [coverImage, setCoverImage] = useState<string | null>(null)
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [isPending, startTransition] = useTransition()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const isFreeUser = userPlan === "free"
    const { t } = useTranslation()

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error(t('toasts.invalidImageFile'))
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('toasts.imageSizeLimit', { size: '5' }))
            return
        }

        setIsUploadingImage(true)

        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            // 1. WebP Conversion
            const { convertToWebP } = await import("@/lib/image-utils")
            const { blob } = await convertToWebP(file)

            const fileName = `category-${Date.now()}.webp`
            const filePath = `categories/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, blob, {
                    contentType: 'image/webp'
                })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

            setCoverImage(publicUrl)
            toast.success(t('toasts.imageUploaded'))
        } catch (error) {
            console.error('Upload error:', error)
            toast.error(t('toasts.imageUploadFailed'))
        } finally {
            setIsUploadingImage(false)
            if (e.target) e.target.value = ''
        }
    }

    const handleAddCategory = () => {
        if (isFreeUser) {
            setShowUpgradeModal(true)
            return
        }
        setEditingCategory(null)
        setNewCategoryName("")
        setSelectedColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)])
        setCoverImage(null)
        setShowAddModal(true)
    }

    const handleEditCategory = (category: Category) => {
        if (isFreeUser) {
            setShowUpgradeModal(true)
            return
        }
        setEditingCategory(category)
        setNewCategoryName(category.name)
        setSelectedColor(category.color)
        setCoverImage(category.cover_image || null)
        setShowAddModal(true)
    }

    const handleSaveCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error(t('toasts.categoryNameEmpty'))
            return
        }

        startTransition(async () => {
            try {
                if (editingCategory) {
                    // Kategori adını güncelle - tüm ürünlerde
                    const { renameCategory } = await import("@/lib/actions/products")
                    await renameCategory(editingCategory.name, newCategoryName.trim())

                    setCategories(categories.map(c =>
                        c.id === editingCategory.id
                            ? { ...c, name: newCategoryName, color: selectedColor }
                            : c
                    ))
                    toast.success(t('toasts.categoryUpdated'))
                } else {
                    // Yeni kategori - sadece local state'e ekle
                    // (kategori ürüne eklendiğinde otomatik oluşur)
                    const newCategory: Category = {
                        id: `cat-${Date.now()}`,
                        name: newCategoryName,
                        color: selectedColor,
                        productCount: 0,
                    }
                    setCategories([...categories, newCategory])
                    toast.success(t('toasts.categoryCreated'))
                }
                setShowAddModal(false)
            } catch (error) {
                console.error("Category save error:", error)
                toast.error(t('toasts.errorOccurred'))
            }
        })
    }

    const handleDeleteCategory = (category: Category) => {
        if (isFreeUser) {
            setShowUpgradeModal(true)
            return
        }

        if (!confirm(t('categories.deleteConfirm', { name: category.name }))) {
            return
        }

        startTransition(async () => {
            try {
                const { deleteCategory } = await import("@/lib/actions/products")
                await deleteCategory(category.name)

                setCategories(categories.filter(c => c.id !== category.id))
                toast.success(t('toasts.categoryDeleted'))
            } catch (error) {
                console.error("Category delete error:", error)
                toast.error(t('toasts.categoryDeleteFailed'))
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{t("categories.title")}</h1>
                    <p className="text-muted-foreground">{t("categories.subtitle")}</p>
                </div>
                <Button onClick={handleAddCategory} className="gap-2">
                    {isFreeUser && <Lock className="w-4 h-4" />}
                    <FolderPlus className="w-4 h-4" />
                    {t("categories.newCategory")}
                </Button>
            </div>



            {/* Free User Banner */}
            {isFreeUser && (
                <Card className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-violet-200">
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-violet-600" />
                            <div>
                                <p className="font-medium">{t("categories.proFeature")}</p>
                                <p className="text-sm text-muted-foreground">{t("categories.upgradePrompt")}</p>
                            </div>
                        </div>
                        <Button onClick={() => setShowUpgradeModal(true)} className="bg-violet-600 hover:bg-violet-700 w-full sm:w-auto">
                            {t("categories.seePlans")}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Categories Grid */}
            {categories.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FolderOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
                        <h3 className="font-medium mb-1">{t("categories.noCategories")}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{t("categories.noCategoriesDesc")}</p>
                        <Button onClick={handleAddCategory} variant="outline" className="gap-2">
                            <FolderPlus className="w-4 h-4" />
                            {t("categories.createFirst")}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {categories.map(category => {
                        const isUncategorized = category.name === 'Kategorisiz'
                        return (
                            <Card
                                key={category.id}
                                className="group hover:shadow-xl transition-all overflow-hidden cursor-pointer"
                                onClick={() => !isUncategorized && handleEditCategory(category)}
                            >
                                {/* Kare Fotoğraf Alanı */}
                                <div className="relative aspect-square bg-gradient-to-br from-muted/30 to-muted overflow-hidden">
                                    {/* Öncelik: 1. cover_image, 2. product images, 3. varsayılan icon */}
                                    {category.cover_image ? (
                                        <img
                                            src={category.cover_image}
                                            alt={category.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : category.images && category.images.length > 0 ? (
                                        category.images.length === 1 ? (
                                            <img
                                                src={category.images[0]}
                                                alt={category.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
                                                {category.images.slice(0, 4).map((img, idx) => (
                                                    <div key={idx} className="overflow-hidden">
                                                        <img
                                                            src={img}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ))}
                                                {category.images.length < 4 &&
                                                    [...Array(4 - category.images.length)].map((_, idx) => (
                                                        <div key={`empty-${idx}`} className="bg-muted/50 flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-muted-foreground/20" />
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        )
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                                            <div
                                                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                                style={{ backgroundColor: category.color + "20" }}
                                            >
                                                {isUncategorized ? (
                                                    <FolderOpen className="w-8 h-8" style={{ color: category.color }} />
                                                ) : (
                                                    <Folder className="w-8 h-8" style={{ color: category.color }} />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                        {!isUncategorized && (
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleEditCategory(category) }}>
                                                    <Pencil className="w-3 h-3 mr-1" /> {t("common.edit")}
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Ürün Sayısı Badge */}
                                    <div className="absolute top-2 right-2">
                                        <Badge
                                            className="shadow-lg text-white border-0"
                                            style={{ backgroundColor: category.color }}
                                        >
                                            {category.productCount}
                                        </Badge>
                                    </div>

                                    {/* Renk Göstergesi */}
                                    <div
                                        className="absolute bottom-0 left-0 right-0 h-1"
                                        style={{ backgroundColor: category.color }}
                                    />
                                </div>

                                {/* Kategori İsmi */}
                                <div className="p-3 bg-card">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: category.color }}
                                        />
                                        <h3 className="font-medium text-sm truncate">{category.name}</h3>
                                    </div>
                                    {category.productNames && category.productNames.length > 0 && (
                                        <p className="text-[10px] text-muted-foreground mt-1 truncate">
                                            {category.productNames.slice(0, 2).join(", ")}
                                            {category.productCount > 2 && ` +${category.productCount - 2}`}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? t("categories.editCategory") : t("categories.newCategory")}</DialogTitle>
                        <DialogDescription>
                            {t("categories.subtitle")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("categories.categoryName")}</label>
                            <Input
                                placeholder={t("categories.namePlaceholder") || "Ex: Furniture, Electronics..."}
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("categories.color")}</label>
                            <div className="flex gap-2 flex-wrap">
                                {CATEGORY_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-8 h-8 rounded-full transition-transform ${selectedColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Kapak Fotoğrafı */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("categories.coverImage")}</label>
                            <div className="flex items-start gap-4">
                                {/* Preview */}
                                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                                    {coverImage ? (
                                        <>
                                            <img
                                                src={coverImage}
                                                alt="Kapak"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => setCoverImage(null)}
                                                className="absolute top-1 right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </>
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center"
                                            style={{ backgroundColor: selectedColor + "20" }}
                                        >
                                            <Folder className="w-8 h-8" style={{ color: selectedColor }} />
                                        </div>
                                    )}
                                </div>

                                {/* Upload Button */}
                                <div className="flex-1">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingImage}
                                    >
                                        {isUploadingImage ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ImagePlus className="w-4 h-4" />
                                        )}
                                        {coverImage ? t("common.change") : t("common.upload")}
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {t("categories.imageNote")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddModal(false)}>
                            {t("common.cancel")}
                        </Button>
                        <Button onClick={handleSaveCategory} disabled={isPending}>
                            {editingCategory ? t("common.update") : t("common.create")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upgrade Modal */}
            <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
        </div>
    )
}
