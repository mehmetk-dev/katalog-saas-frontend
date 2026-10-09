import type { Category } from "./types"

export const UNCATEGORIZED_ID = "cat-uncategorized"

const DEFAULT_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"]
const PREVIEW_IMAGES = 4
const PREVIEW_NAMES = 3

interface ProductRow {
    category: string | null
    image_url: string | null
    name: string
}

interface MetadataRow {
    category_name: string
    color: string | null
    cover_image: string | null
}

/**
 * Kategori listesi ürünlerdeki adlardan + category_metadata kayıtlarından oluşur. Önceden yalnızca
 * ürünlerden üretildiği için "Yeni kategori" ile eklenen (henüz ürünü olmayan) kategori sayfa
 * yenilenince kayboluyordu. Kimlik adın kendisinden türetilir; eski `[^a-z0-9]` dönüşümü Türkçe
 * harflerde çakışıyordu ("Çay" ve "Şay" → "-ay") ve düzenleme yanlış kartı güncelliyordu.
 */
export function buildCategoryList(products: ProductRow[], metadata: MetadataRow[]): Category[] {
    const byName = new Map<string, { count: number; images: string[]; productNames: string[] }>()
    const uncategorized = { count: 0, images: [] as string[], productNames: [] as string[] }

    const add = (bucket: { count: number; images: string[]; productNames: string[] }, product: ProductRow) => {
        bucket.count++
        if (product.image_url && bucket.images.length < PREVIEW_IMAGES) bucket.images.push(product.image_url)
        if (bucket.productNames.length < PREVIEW_NAMES) bucket.productNames.push(product.name)
    }

    for (const product of products) {
        const names = (product.category || "").split(",").map((c) => c.trim()).filter(Boolean)
        if (names.length === 0) {
            add(uncategorized, product)
            continue
        }
        for (const name of new Set(names)) {
            const bucket = byName.get(name) ?? { count: 0, images: [], productNames: [] }
            add(bucket, product)
            byName.set(name, bucket)
        }
    }

    for (const row of metadata) {
        const name = row.category_name?.trim()
        if (name && !byName.has(name)) byName.set(name, { count: 0, images: [], productNames: [] })
    }

    const metaByName = new Map(metadata.map((row) => [row.category_name?.trim(), row]))
    const categories: Category[] = Array.from(byName.entries())
        .sort(([a], [b]) => a.localeCompare(b, "tr"))
        .map(([name, data], index) => {
            const meta = metaByName.get(name)
            return {
                id: `cat-${encodeURIComponent(name)}`,
                name,
                color: meta?.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                cover_image: meta?.cover_image || undefined,
                productCount: data.count,
                images: data.images,
                productNames: data.productNames,
            }
        })

    if (uncategorized.count > 0) {
        categories.unshift({
            id: UNCATEGORIZED_ID,
            name: "",
            color: "#6b7280",
            productCount: uncategorized.count,
            images: uncategorized.images,
            productNames: uncategorized.productNames,
            cover_image: undefined,
        })
    }

    return categories
}
