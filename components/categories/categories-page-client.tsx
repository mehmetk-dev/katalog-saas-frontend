"use client"

import { useMemo, useState, useTransition, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FolderPlus, Lock, FolderOpen, Search, SearchX } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UpgradeModal } from "@/components/builder/modals/upgrade-modal"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { UNCATEGORIZED_ID } from "./build-categories"
import { CATEGORY_COLORS } from "./types"
import type { Category } from "./types"
import { useCategoryImageUpload } from "./use-category-image-upload"
import { CategoryCard } from "./category-card"
import { CategoryFormModal } from "./category-form-modal"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"

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
    const [query, setQuery] = useState("")
    const [sortBy, setSortBy] = useState<"name" | "count">("name")
    const router = useRouter()

    // router.refresh() sonrası sunucudaki gerçek liste (sayılar, birleşen kategoriler) yerel durumun yerine geçer
    useEffect(() => {
        setCategories(initialCategories)
    }, [initialCategories])

    const isFreeUser = userPlan === "free"
    const { t } = useTranslation()

    // "Kategorisiz" her zaman sonda; arama Türkçe büyük/küçük harf duyarsız
    const visibleCategories = useMemo(() => {
        const needle = query.trim().toLocaleLowerCase("tr")
        const named = categories.filter((c) => c.id !== UNCATEGORIZED_ID)
        const uncategorized = categories.find((c) => c.id === UNCATEGORIZED_ID)
        const matches = needle ? named.filter((c) => c.name.toLocaleLowerCase("tr").includes(needle)) : named
        const sorted = [...matches].sort((a, b) =>
            sortBy === "count"
                ? b.productCount - a.productCount || a.name.localeCompare(b.name, "tr")
                : a.name.localeCompare(b.name, "tr"))
        return uncategorized && !needle ? [...sorted, uncategorized] : sorted
    }, [categories, query, sortBy])
    const namedCount = categories.filter((c) => c.id !== UNCATEGORIZED_ID).length

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
                description={namedCount > 0 ? `${t("categories.subtitle")} · ${t("categories.summary", { count: namedCount })}` : t("categories.subtitle")}
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
                <Card className="gap-0 py-0 bg-primary/10 border-border">
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
                <EmptyState
                    icon={FolderOpen}
                    title={t("categories.noCategories")}
                    description={t("categories.noCategoriesDesc")}
                    action={
                        <Button onClick={handleAddCategory} className="gap-2">
                            <FolderPlus className="w-4 h-4" />
                            {t("categories.createFirst")}
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-4">
                    {/* Araç çubuğu: ürünler sayfasıyla aynı düzen */}
                    <div className="flex items-center gap-2">
                        <div className="relative min-w-0 flex-1 sm:max-w-sm">
                            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t("categories.searchPlaceholder")}
                                aria-label={t("categories.searchPlaceholder")}
                                className="bg-card pl-9"
                            />
                        </div>
                        <Select value={sortBy} onValueChange={(value) => setSortBy(value as "name" | "count")}>
                            <SelectTrigger className="w-auto shrink-0 bg-card" aria-label={t("filters.sort")}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">{t("categories.sortByName")}</SelectItem>
                                <SelectItem value="count">{t("categories.sortByCount")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {visibleCategories.length === 0 ? (
                        <EmptyState icon={SearchX} title={t("categories.noResults")} />
                    ) : (
                        // Ürün kartlarıyla aynı ızgara: sabit sütun sayısı yerine en az 12rem genişlik
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] md:gap-4">
                            {visibleCategories.map((category) => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    onEdit={handleEditCategory}
                                    onDelete={handleDeleteCategory}
                                />
                            ))}
                        </div>
                    )}
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
