import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CategoriesPageClient } from "@/components/categories/categories-page-client"
import { buildCategoryList } from "@/components/categories/build-categories"

const PAGE_SIZE = 1000

export default async function CategoriesPage() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id ?? ""

    // Supabase tek sorguda en fazla 1000 satır döndürür; 1000+ ürünlü hesaplarda sayılar eksik çıkıyordu
    const fetchAllProducts = async () => {
        const rows: { category: string | null; image_url: string | null; name: string }[] = []
        for (let from = 0; ; from += PAGE_SIZE) {
            const { data } = await supabase
                .from("products")
                .select("category, image_url, name")
                .eq("user_id", userId)
                .order("display_order", { ascending: true })
                .order("id", { ascending: true })
                .range(from, from + PAGE_SIZE - 1)
            rows.push(...(data ?? []))
            if (!data || data.length < PAGE_SIZE) return rows
        }
    }

    const [profileResult, products, metadataResult] = await Promise.all([
        supabase.from("users").select("plan").eq("id", userId).single(),
        fetchAllProducts(),
        supabase.from("category_metadata").select("category_name, color, cover_image").eq("user_id", userId),
    ])

    const userPlan = (profileResult.data?.plan || "free") as "free" | "plus" | "pro"
    const initialCategories = buildCategoryList(products, metadataResult.data ?? [])

    return <CategoriesPageClient initialCategories={initialCategories} userPlan={userPlan} />
}
