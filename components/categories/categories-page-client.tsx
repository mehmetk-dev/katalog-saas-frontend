"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FolderPlus, Lock, FolderOpen } from "lucide-react"
import { toast } from "sonner"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { UNCATEGORIZED_ID } from "./build-categories"
import { CATEGORY_COLORS } from "./types"
import type { Category } from "./types"
import { useCategoryImageUpload } from "./use-category-image-upload"
import { CategoryCard } from "./category-card"
import { CategoryFormModal } from "./category-form-modal"
import { PageHeader } from "@/components/ui/page-header"

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
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
    const router = useRouter()

    // router.refresh() sonrası sunucudaki gerçek liste (sayılar, birleşen kategoriler) yerel durumun yerine geçer
    useEffect(() => {
        setCategories(initialCategories)
    }, [initialCategories])

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
        const name = newCategoryName.trim()
        if (!name) {
            toast.error(t('toasts.categoryNameEmpty'))
            return
        }
        // Ürünlerde kategoriler virgülle ayrılarak saklanır
        if (name.includes(',')) {
            toast.error(t('categories.nameHasComma'))
            return
        }
        const isRename = Boolean(editingCategory && editingCategory.name !== name)
        const clashes = categories.some(
            (c) => c.id !== UNCATEGORIZED_ID && c.id !== editingCategory?.id && c.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'),
        )
        if (!editingCategory && clashes) {
            toast.error(t('categories.nameExists'))
            return
        }

        startTransition(async () => {
            try {
                // Önce yeniden adlandırma: ürünler, renk/kapak kaydı ve katalog sıraları backend'de taşınır.
                // Önceden renk/kapak önce yeni ada kaydediliyor, eski kayıt sahipsiz kalıyordu.
                if (editingCategory && isRename) {
                    const { renameCategory } = await import("@/lib/actions/products")
                    await renameCategory(editingCategory.name, name)
                }

                const { updateCategoryMetadata } = await import("@/lib/actions/categories")
                await updateCategoryMetadata(name, { color: selectedColor, cover_image: coverImage })

                if (editingCategory) {
                    setCategories((prev) => {
                        const merged = prev
                            // Var olan bir kategoriyle birleştiyse eskisi listeden kalkar, sayılar toplanır
                            .filter((c) => !(clashes && c.id !== editingCategory.id && c.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')))
                            .map((c) =>
                                c.id === editingCategory.id
                                    ? {
                                        ...c,
                                        id: `cat-${encodeURIComponent(name)}`,
                                        name,
                                        color: selectedColor,
                                        cover_image: coverImage || undefined,
                                        productCount: c.productCount + (clashes ? prev.find((o) => o.id !== c.id && o.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'))?.productCount ?? 0 : 0),
                                    }
                                    : c,
                            )
                        return merged
                    })
                    toast.success(t('toasts.categoryUpdated'))
                } else {
                    // Renk/kapak kaydı sayesinde ürün eklenmeden de listede kalır
                    setCategories((prev) => [
                        ...prev,
                        { id: `cat-${encodeURIComponent(name)}`, name, color: selectedColor, productCount: 0, cover_image: coverImage || undefined },
                    ])
                    toast.success(t('toasts.categoryCreated'))
                }
                setShowAddModal(false)
                router.refresh()
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
        setDeletingCategory(category)
    }

    const confirmDeleteCategory = () => {
        const category = deletingCategory
        if (!category) return
        startTransition(async () => {
            try {
                const { deleteCategory } = await import("@/lib/actions/products")
                await deleteCategory(category.name)

                setCategories((prev) => prev.filter((c) => c.id !== category.id))
                setDeletingCategory(null)
                toast.success(t('toasts.categoryDeleted'))
                router.refresh()
            } catch (error) {
                console.error("Category delete error:", error)
                toast.error(t('toasts.categoryDeleteFailed'))
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title={t("categories.title")}
                description={t("categories.subtitle")}
                actions={
                    <Button onClick={handleAddCategory} className="gap-2">
                        {isFreeUser && <Lock className="w-4 h-4" />}
                        <FolderPlus className="w-4 h-4" />
                        {t("categories.newCategory")}
                    </Button>
                }
            />



            {/* Free User Banner */}
            {isFreeUser && (
                <Card className="bg-primary/10 border-border">
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-medium">{t("categories.proFeature")}</p>
                                <p className="text-sm text-muted-foreground">{t("categories.upgradePrompt")}</p>
                            </div>
                        </div>
                        <Button onClick={() => setShowUpgradeModal(true)} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
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

            <AlertDialog open={Boolean(deletingCategory)} onOpenChange={(open) => !open && !isPending && setDeletingCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("categories.deleteTitle", { name: deletingCategory?.name ?? "" })}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("categories.deleteDesc", { count: deletingCategory?.productCount ?? 0 })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault()
                                confirmDeleteCategory()
                            }}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t("common.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Upgrade Modal */}
            <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
        </div>
    )
}
