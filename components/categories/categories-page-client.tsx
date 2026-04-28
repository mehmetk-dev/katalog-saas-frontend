"use client"

import { useState, useTransition, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { FolderPlus, Lock, FolderOpen } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { CATEGORY_COLORS } from "./types"
import type { Category } from "./types"
import { useCategoryImageUpload } from "./use-category-image-upload"
import { CategoryCard } from "./category-card"
import { CategoryFormModal } from "./category-form-modal"

interface CategoriesPageClientProps {
    initialCategories: Category[]
    userPlan: "free" | "plus" | "pro"
}

export function CategoriesPageClient({ initialCategories, userPlan }: CategoriesPageClientProps) {
    const searchParams = useSearchParams()
    const [categories, setCategories] = useState<Category[]>(initialCategories)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)

    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0])
    const [coverImage, setCoverImage] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const isFreeUser = userPlan === "free"
    const { t } = useTranslation()

    const { isUploadingImage, fileInputRef, handleImageUpload } = useCategoryImageUpload({
        onSuccess: (url) => setCoverImage(url),
    })

    // URL'deki action=new parametresini kontrol et
    useEffect(() => {
        if (searchParams.get("action") === "new") {
            if (isFreeUser) {
                setShowUpgradeModal(true)
            } else {
                setEditingCategory(null)
                setNewCategoryName("")
                setSelectedColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)])
                setCoverImage(null)
                setShowAddModal(true)
            }

            // Parametreyi temizle
            const newPath = window.location.pathname
            window.history.replaceState({}, "", newPath)
        }
    }, [searchParams, isFreeUser])

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
                // 1. Save metadata (color & cover image)
                const { updateCategoryMetadata } = await import("@/lib/actions/categories")
                await updateCategoryMetadata(newCategoryName.trim(), {
                    color: selectedColor,
                    cover_image: coverImage
                })

                if (editingCategory) {
                    // Kategori adını güncelle - tüm ürünlerde (Eğer isim değiştiyse)
                    if (editingCategory.name !== newCategoryName.trim()) {
                        const { renameCategory } = await import("@/lib/actions/products")
                        await renameCategory(editingCategory.name, newCategoryName.trim())
                    }

                    // Local state güncelle
                    setCategories(categories.map(c =>
                        c.id === editingCategory.id
                            ? { ...c, name: newCategoryName.trim(), color: selectedColor, cover_image: coverImage || undefined }
                            : c
                    ))
                    toast.success(t('toasts.categoryUpdated'))
                } else {
                    // Yeni kategori - sadece local state'e ekle
                    // (kategori ürüne eklendiğinde otomatik oluşur)
                    const newCategory: Category = {
                        id: `cat-${Date.now()}`,
                        name: newCategoryName.trim(),
                        color: selectedColor,
                        productCount: 0,
                        cover_image: coverImage || undefined
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
                    {categories.map(category => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            onEdit={handleEditCategory}
                            onDelete={handleDeleteCategory}
                        />
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <CategoryFormModal
                open={showAddModal}
                onOpenChange={setShowAddModal}
                editingCategory={editingCategory}
                newCategoryName={newCategoryName}
                onNameChange={setNewCategoryName}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                coverImage={coverImage}
                onCoverImageChange={setCoverImage}
                onSave={handleSaveCategory}
                isPending={isPending}
                isUploadingImage={isUploadingImage}
                fileInputRef={fileInputRef}
                onImageUpload={handleImageUpload}
            />

            {/* Upgrade Modal */}
            <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
        </div>
    )
}
