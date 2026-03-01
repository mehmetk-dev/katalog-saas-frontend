"use server"

import { revalidatePath } from "next/cache"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { validate, categoryMetadataSchema } from "@/lib/validations"

export async function updateCategoryMetadata(
    categoryName: string,
    data: { color?: string; cover_image?: string | null }
) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // Validate and sanitize input
    const validatedData = validate(categoryMetadataSchema, data)

    // Upsert (Varsa güncelle, yoksa ekle)
    const { error } = await supabase
        .from('category_metadata')
        .upsert({
            user_id: user.id,
            category_name: categoryName,
            color: validatedData.color,
            cover_image: validatedData.cover_image,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, category_name'
        })

    if (error) {
        console.error("Category metadata update error:", error)
        throw error
    }

    revalidatePath('/dashboard/categories')
}

export async function getCategoryMetadataMap() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return new Map()

    const { data } = await supabase
        .from('category_metadata')
        .select('category_name, color, cover_image')
        .eq('user_id', user.id)

    const map = new Map<string, { color?: string, cover_image?: string | null }>()
    data?.forEach(item => {
        map.set(item.category_name, {
            color: item.color,
            cover_image: item.cover_image
        })
    })

    return map
}
