"use server"

import { revalidatePath } from "next/cache"

import { createServerSupabaseClient } from "@/lib/supabase/server"

export type Feedback = {
    id: string
    user_id: string
    user_name: string
    user_email: string
    subject: string
    message: string
    page_url?: string
    attachments?: string[]
    status: 'pending' | 'resolved' | 'closed'
    created_at: string
}

export async function sendFeedback(data: {
    subject: string;
    message: string;
    page_url?: string;
    attachments?: string[];
}) {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Oturum açmanız gerekiyor")

    // Kullanıcı profil bilgilerini al
    const { data: profile } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single()

    const { error } = await supabase.from("feedbacks").insert({
        user_id: user.id,
        user_name: profile?.full_name || user.user_metadata?.full_name || "Bilinmiyor",
        user_email: user.email,
        subject: data.subject,
        message: data.message,
        page_url: data.page_url,
        attachments: data.attachments || [],
        status: 'pending'
    })

    if (error) throw error

    revalidatePath("/dashboard/admin")
    return { success: true }
}

export async function getFeedbacks() {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) throw error
    return data as Feedback[]
}

export async function updateFeedbackStatus(id: string, status: Feedback['status']) {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
        .from("feedbacks")
        .update({ status })
        .eq("id", id)

    if (error) throw error
    revalidatePath("/dashboard/admin")
    return { success: true }
}
