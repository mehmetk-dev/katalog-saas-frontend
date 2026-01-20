"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

import { checkIsAdmin } from "./admin"

export interface Template {
    id: string
    name: string
    description: string | null
    is_pro: boolean
    is_system: boolean
    items_per_page: number
    component_name: string
    preview_image: string | null
    layout: string
    sort_order: number
    created_at: string
    updated_at: string
}

// Tüm template'leri getir
export async function getTemplates(): Promise<Template[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) {
        console.error("Error fetching templates:", error)
        return []
    }

    return data || []
}

// Sadece sistem şablonlarını getir
export async function getSystemTemplates(): Promise<Template[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_system', true)
        .order('sort_order', { ascending: true })

    if (error) {
        console.error("Error fetching system templates:", error)
        return []
    }

    return data || []
}

// Sadece custom şablonları getir
export async function getCustomTemplates(): Promise<Template[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_system', false)
        .order('sort_order', { ascending: true })

    if (error) {
        console.error("Error fetching custom templates:", error)
        return []
    }

    return data || []
}

// Tek bir template getir
export async function getTemplate(id: string): Promise<Template | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error("Error fetching template:", error)
        return null
    }

    return data
}

// Yeni template oluştur (Admin only)
export async function createTemplate(data: {
    name: string
    id: string
    isPro: boolean
    description: string
    componentName: string
    itemsPerPage: number
    previewImage?: string
    layout?: string
}) {
    try {
        const isAdmin = await checkIsAdmin()
        if (!isAdmin) throw new Error("Unauthorized")

        const supabase = await createClient()

        // ID validation
        const safeId = data.id.replace(/[^a-z0-9-]/g, "").toLowerCase()
        if (!safeId) throw new Error("Invalid ID")

        // Check if ID already exists
        const { data: existing } = await supabase
            .from('templates')
            .select('id')
            .eq('id', safeId)
            .single()

        if (existing) throw new Error("Template ID already exists")

        // Get max sort_order
        const { data: maxOrder } = await supabase
            .from('templates')
            .select('sort_order')
            .order('sort_order', { ascending: false })
            .limit(1)
            .single()

        const nextOrder = (maxOrder?.sort_order || 0) + 1

        // Insert new template
        const { error } = await supabase
            .from('templates')
            .insert({
                id: safeId,
                name: data.name,
                description: data.description,
                is_pro: data.isPro,
                is_system: false, // Custom template
                items_per_page: data.itemsPerPage,
                component_name: data.componentName,
                preview_image: data.previewImage || '/templates/modern-grid.png',
                layout: data.layout || 'grid',
                sort_order: nextOrder
            })

        if (error) throw error

        revalidatePath('/dashboard/builder')
        revalidatePath('/dashboard/templates')
        revalidatePath('/admin')

        return { success: true, message: "Template created successfully" }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Failed to create template'
        console.error("Template creation error:", error)
        throw new Error(errorMessage)
    }
}

// Template güncelle (Admin only)
export async function updateTemplate(id: string, data: Partial<{
    name: string
    description: string
    isPro: boolean
    componentName: string
    itemsPerPage: number
    previewImage: string
    layout: string
    sortOrder: number
}>) {
    try {
        const isAdmin = await checkIsAdmin()
        if (!isAdmin) throw new Error("Unauthorized")

        const supabase = await createClient()

        const updates: Record<string, unknown> = {}
        if (data.name !== undefined) updates.name = data.name
        if (data.description !== undefined) updates.description = data.description
        if (data.isPro !== undefined) updates.is_pro = data.isPro
        if (data.componentName !== undefined) updates.component_name = data.componentName
        if (data.itemsPerPage !== undefined) updates.items_per_page = data.itemsPerPage
        if (data.previewImage !== undefined) updates.preview_image = data.previewImage
        if (data.layout !== undefined) updates.layout = data.layout
        if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder

        const { error } = await supabase
            .from('templates')
            .update(updates)
            .eq('id', id)

        if (error) throw error

        revalidatePath('/dashboard/builder')
        revalidatePath('/dashboard/templates')
        revalidatePath('/admin')

        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Failed to update template'
        console.error("Template update error:", error)
        throw new Error(errorMessage)
    }
}

// Template fotoğrafını güncelle (Admin only)
export async function updateTemplateImage(id: string, imageUrl: string) {
    try {
        const isAdmin = await checkIsAdmin()
        if (!isAdmin) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { error } = await supabase
            .from('templates')
            .update({ preview_image: imageUrl })
            .eq('id', id)

        if (error) throw error

        revalidatePath('/dashboard/builder')
        revalidatePath('/dashboard/templates')
        revalidatePath('/admin')

        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Failed to update template image'
        console.error("Template image update error:", error)
        throw new Error(errorMessage)
    }
}

// Template sil (Admin only, sadece custom şablonlar)
export async function deleteTemplate(id: string) {
    try {
        const isAdmin = await checkIsAdmin()
        if (!isAdmin) throw new Error("Unauthorized")

        const supabase = await createClient()

        // Check if system template
        const { data: template } = await supabase
            .from('templates')
            .select('is_system')
            .eq('id', id)
            .single()

        if (template?.is_system) {
            throw new Error("System templates cannot be deleted")
        }

        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/dashboard/builder')
        revalidatePath('/dashboard/templates')
        revalidatePath('/admin')

        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Failed to delete template'
        console.error("Template delete error:", error)
        throw new Error(errorMessage)
    }
}

// Legacy compatibility
export async function createNewTemplate(data: {
    name: string
    id: string
    isPro: boolean
    description: string
    code: string
    componentName: string
    itemsPerPage: number
}) {
    return createTemplate({
        name: data.name,
        id: data.id,
        isPro: data.isPro,
        description: data.description,
        componentName: data.componentName,
        itemsPerPage: data.itemsPerPage,
    })
}

// Legacy compatibility
export async function deleteCustomTemplate(id: string) {
    return deleteTemplate(id)
}

// Legacy compatibility - CustomTemplate type
export type CustomTemplate = Template
