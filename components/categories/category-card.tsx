"use client"

import {
    Folder,
    Pencil,
    Trash2,
    Package,
    FolderOpen,
} from "lucide-react"
import NextImage from "next/image"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { Category } from "./types"

interface CategoryCardProps {
    category: Category
    onEdit: (category: Category) => void
    onDelete: (category: Category) => void
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
    const { t } = useTranslation()
    const isUncategorized = category.name === 'Kategorisiz'

    return (
        <Card
            className="group hover:shadow-xl transition-all overflow-hidden cursor-pointer"
            onClick={() => !isUncategorized && onEdit(category)}
        >
            {/* Kare Fotoğraf Alanı */}
            <div className="relative aspect-square bg-gradient-to-br from-muted/30 to-muted overflow-hidden">
                {/* Öncelik: 1. cover_image, 2. product images, 3. varsayılan icon */}
                {category.cover_image ? (
                    <NextImage
                        src={category.cover_image}
                        alt={category.name}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                ) : category.images && category.images.length > 0 ? (
                    category.images.length === 1 ? (
                        <NextImage
                            src={category.images[0]}
                            alt={category.name}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    ) : (
                        <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
                            {category.images.slice(0, 4).map((img, idx) => (
                                <div key={idx} className="relative overflow-hidden">
                                    <NextImage
                                        src={img}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        unoptimized
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
                            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onEdit(category) }}>
                                <Pencil className="w-3 h-3 mr-1" /> {t("common.edit")}
                            </Button>
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onDelete(category) }}>
                                <Trash2 className="w-3 h-3 mr-1" /> {t("common.delete")}
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
}
