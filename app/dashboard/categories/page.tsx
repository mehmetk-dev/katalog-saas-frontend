import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CategoriesPageClient } from "@/components/categories/categories-page-client"

export default async function CategoriesPage() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    // PERF: Fetch profile and products in parallel instead of sequentially
    const [profileResult, productsResult] = await Promise.all([
        supabase.from("users").select("plan").eq("id", user?.id).single(),
        supabase.from("products").select("category, image_url, name").eq("user_id", user?.id),
    ])

    const userPlan = (profileResult.data?.plan || "free") as "free" | "plus" | "pro"
    const products = productsResult.data as { category: string | null, image_url: string | null, name: string }[] | null

    // Parse categories from products with images
    const categoryData = new Map<string, { count: number, images: string[], productNames: string[] }>()
    const uncategorizedData = { count: 0, images: [] as string[], productNames: [] as string[] }

    products?.forEach(p => {
        if (!p.category || p.category.trim() === '') {
            // Kategorisiz ürün
            uncategorizedData.count++
            if (p.image_url && uncategorizedData.images.length < 4) {
                uncategorizedData.images.push(p.image_url)
            }
            if (uncategorizedData.productNames.length < 3) {
                uncategorizedData.productNames.push(p.name)
            }
            return
        }
        const cats = p.category.split(',').map(c => c.trim()).filter(Boolean)
        cats.forEach(c => {
            const existing = categoryData.get(c) || { count: 0, images: [], productNames: [] }
            existing.count++
            if (p.image_url && existing.images.length < 4) {
                existing.images.push(p.image_url)
            }
            if (existing.productNames.length < 3) {
                existing.productNames.push(p.name)
            }
            categoryData.set(c, existing)
        })
    })

    // Get category metadata from DB
    const { getCategoryMetadataMap } = await import("@/lib/actions/categories")
    const metadataMap = await getCategoryMetadataMap()

    const initialCategories = Array.from(categoryData.entries()).map(([name, data], index) => {
        const metadata = metadataMap.get(name)
        return {
            // Deterministik ID: isimden türet (hydration hatası önleme)
            id: `cat-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name,
            color: metadata?.color || ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"][index % 8],
            cover_image: metadata?.cover_image || undefined,
            productCount: data.count,
            images: data.images,
            productNames: data.productNames
        }
    })

    // Kategorisiz ürünleri başa ekle
    if (uncategorizedData.count > 0) {
        initialCategories.unshift({
            id: 'cat-uncategorized',
            name: 'Kategorisiz',
            color: '#6b7280',
            productCount: uncategorizedData.count,
            images: uncategorizedData.images,
            productNames: uncategorizedData.productNames,
            cover_image: undefined
        })
    }

    return <CategoriesPageClient initialCategories={initialCategories} userPlan={userPlan} />
}
