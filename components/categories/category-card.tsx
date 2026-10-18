"use client"

import Link from "next/link"
import NextImage from "next/image"
import { ArrowUpRight, Folder, FolderOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { UNCATEGORIZED_ID } from "./build-categories"
import type { Category } from "./types"

interface CategoryCardProps {
    category: Category
    onEdit: (category: Category) => void
    onDelete: (category: Category) => void
}

/** Kategoriye ait ürünleri filtreli gösteren ürünler sayfası adresi */
export function categoryProductsHref(name: string) {
    return `/dashboard/products?category=${encodeURIComponent(name)}`
}

function CategoryImages({ category, alt }: { category: Category; alt: string }) {
    const images = category.cover_image ? [category.cover_image] : (category.images ?? []).slice(0, 4)
    const isUncategorized = category.id === UNCATEGORIZED_ID

    if (images.length === 0) {
        const Icon = isUncategorized ? FolderOpen : Folder
        return (
            <div className="flex size-full items-center justify-center">
                <div className="flex size-14 items-center justify-center rounded-xl" style={{ backgroundColor: `${category.color}1f` }}>
                    <Icon className="size-7" style={{ color: category.color }} />
                </div>
            </div>
        )
    }

    // 1 görsel tam, 2 yan yana, 3'te ilki solda büyük, 4 görsel 2x2 — boş kutu kalmaz
    return (
        <div className={cn("grid size-full gap-0.5", images.length > 1 && "grid-cols-2", images.length > 2 && "grid-rows-2")}>
            {images.map((src, index) => (
                <div key={src} className={cn("relative overflow-hidden", images.length === 3 && index === 0 && "row-span-2")}>
                    <NextImage
                        src={src}
                        alt={index === 0 ? alt : ""}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        unoptimized
                    />
                </div>
            ))}
        </div>
    )
}

/**
 * Ürün kartıyla aynı yapı: görsel → ad → alt bilgi. Kartın tamamı kategorinin ürünlerini açar;
 * düzenle/sil sağ üstteki menüde ve fareyle üzerine gelince çıkan düğmede.
 */
export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
    const { t } = useTranslation()
    const isUncategorized = category.id === UNCATEGORIZED_ID
    const displayName = isUncategorized ? t("categories.uncategorized") : category.name

    return (
        <Card
            data-category-card
            className={cn(
                "group relative gap-0 overflow-visible py-0 transition-[box-shadow,border-color]",
                !isUncategorized && "hover:border-foreground/20 hover:shadow-md"
            )}
        >
            <div className="relative aspect-square overflow-hidden rounded-t-xl border-b bg-muted/50">
                <CategoryImages category={category} alt={displayName} />

                {!isUncategorized && (
                    <>
                        <div className="absolute right-2 top-2 z-[5]">
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={t("products.actions")}
                                        // Mobildeki genel 44px dokunma kuralı görselin üstünde kocaman kare yapıyordu
                                        className="size-8 min-h-0 min-w-0 bg-background/90 text-foreground shadow-sm hover:bg-background data-[state=open]:opacity-100 md:size-7 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                                    >
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem asChild>
                                        <Link href={categoryProductsHref(category.name)}>
                                            <ArrowUpRight className="size-4" /> {t("categories.viewProducts")}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => onEdit(category)}>
                                        <Pencil className="size-4" /> {t("common.edit")}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive" onSelect={() => onDelete(category)}>
                                        <Trash2 className="size-4" /> {t("common.delete")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            className="absolute bottom-2 right-2 z-[5] hidden h-7 gap-1.5 bg-background/95 px-2.5 text-xs opacity-0 shadow-sm transition-opacity hover:bg-background focus-visible:opacity-100 group-hover:opacity-100 md:inline-flex"
                            onClick={() => onEdit(category)}
                        >
                            <Pencil className="size-3.5" />
                            {t("common.edit")}
                        </Button>
                    </>
                )}
            </div>

            <div className="flex flex-col gap-0.5 p-3">
                <h3 className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                    <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                    {isUncategorized ? (
                        <span className="truncate" title={displayName}>{displayName}</span>
                    ) : (
                        // Kartın tamamı bağlantı (after: ile tıklama alanı kartı kaplar)
                        <Link
                            href={categoryProductsHref(category.name)}
                            title={displayName}
                            className="min-h-0 min-w-0 truncate outline-none after:absolute after:inset-0 after:z-[2] after:rounded-xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring"
                        >
                            {displayName}
                        </Link>
                    )}
                </h3>
                <p className="pl-[18px] text-xs tabular-nums text-muted-foreground">
                    {t("categories.productCount", { count: category.productCount })}
                </p>
            </div>
        </Card>
    )
}
