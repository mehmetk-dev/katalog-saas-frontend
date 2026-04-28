"use client"

import { Folder, ImagePlus, X, Loader2 } from "lucide-react"
import NextImage from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { CATEGORY_COLORS } from "./types"
import type { Category } from "./types"

interface CategoryFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingCategory: Category | null
    newCategoryName: string
    onNameChange: (name: string) => void
    selectedColor: string
    onColorChange: (color: string) => void
    coverImage: string | null
    onCoverImageChange: (url: string | null) => void
    onSave: () => void
    isPending: boolean
    isUploadingImage: boolean
    fileInputRef: React.RefObject<HTMLInputElement | null>
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function CategoryFormModal({
    open,
    onOpenChange,
    editingCategory,
    newCategoryName,
    onNameChange,
    selectedColor,
    onColorChange,
    coverImage,
    onCoverImageChange,
    onSave,
    isPending,
    isUploadingImage,
    fileInputRef,
    onImageUpload,
}: CategoryFormModalProps) {
    const { t } = useTranslation()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                            onChange={(e) => onNameChange(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t("categories.color")}</label>
                        <div className="flex gap-2 flex-wrap">
                            {CATEGORY_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => onColorChange(color)}
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
                                        <NextImage
                                            src={coverImage}
                                            alt="Kapak"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <button
                                            onClick={() => onCoverImageChange(null)}
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
                                    onChange={onImageUpload}
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t("common.cancel")}
                    </Button>
                    <Button onClick={onSave} disabled={isPending}>
                        {editingCategory ? t("common.update") : t("common.create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
