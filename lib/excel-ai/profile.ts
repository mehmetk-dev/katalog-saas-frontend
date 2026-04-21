import type { CatalogProfile } from "./schemas"
import { extractTopKeywords } from "./helpers"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const PROFILE_SAMPLE_LIMIT = 250

export async function fetchCatalogProfile(
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
    userId: string,
): Promise<CatalogProfile | null> {
    const [countResult, sampleResult] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase
            .from("products")
            .select("name, category, updated_at")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(PROFILE_SAMPLE_LIMIT),
    ])

    if (sampleResult.error) {
        console.error("[excel-ai/intent] profile sample query failed:", sampleResult.error)
        return null
    }

    const rows = (sampleResult.data || []) as Array<{
        name: string | null
        category: string | null
        updated_at: string | null
    }>
    const totalProducts = countResult.count || rows.length

    if (rows.length === 0) {
        return {
            totalProducts,
            topCategories: [],
            topKeywords: [],
        }
    }

    const categoryCounts = new Map<string, number>()
    const productNames: string[] = []

    rows.forEach((row) => {
        const name = row.name?.trim()
        if (name) productNames.push(name)

        const rawCategory = row.category?.trim()
        if (!rawCategory) return

        rawCategory
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .forEach((item) => {
                categoryCounts.set(item, (categoryCounts.get(item) || 0) + 1)
            })
    })

    const topCategories = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }))

    return {
        totalProducts,
        topCategories,
        topKeywords: extractTopKeywords(productNames),
    }
}
