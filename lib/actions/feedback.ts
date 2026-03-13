"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { buildFeedbackEmailHtml } from "@/lib/email/templates/feedback-email"
import { sendEmail } from "@/lib/services/email"
import { feedbackSchema, validate } from "@/lib/validations"
import {
    checkRateLimit,
    FEEDBACK_LIMIT,
    FEEDBACK_WINDOW_MS,
} from "@/lib/services/rate-limit"
import { requireAdmin } from "@/lib/actions/admin"

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
    // Rate limit: IP basina 10 dakikada en fazla N feedback.
    const headersList = await headers()
    const rl = checkRateLimit(headersList, "feedback", FEEDBACK_LIMIT, FEEDBACK_WINDOW_MS)
    if (!rl.allowed) {
        throw new Error("Cok fazla deneme. Lutfen 10 dakika sonra tekrar deneyin.")
    }

    const validatedData = validate(feedbackSchema, data)
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Oturum acmaniz gerekiyor")
    }

    // Kullanici profil bilgilerini al.
    const { data: profile } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single()

    const userName = profile?.full_name || user.user_metadata?.full_name || "Bilinmiyor"
    const userEmail = user.email || ""

    const { error } = await supabase.from("feedbacks").insert({
        user_id: user.id,
        user_name: userName,
        user_email: userEmail,
        subject: validatedData.subject,
        message: validatedData.message,
        page_url: validatedData.page_url,
        attachments: validatedData.attachments || [],
        status: 'pending'
    })

    if (error) {
        throw error
    }

    // Admin e-postasi asenkron: hata olursa feedback kaydi yine korunur.
    const adminEmail = process.env.ADMIN_EMAIL
    const resendApiKey = process.env.RESEND_API_KEY

    if (!adminEmail) {
        console.error("ADMIN_EMAIL is not set. Feedback email skipped.")
    } else if (!resendApiKey) {
        console.error("RESEND_API_KEY is not set. Feedback email skipped.")
    } else {
        try {
            const emailHtml = buildFeedbackEmailHtml({
                userName,
                userEmail,
                subject: validatedData.subject,
                message: validatedData.message,
                pageUrl: validatedData.page_url ?? undefined,
                attachments: validatedData.attachments,
            })

            const emailResult = await sendEmail({
                to: adminEmail,
                subject: `[Sorun Bildirimi] ${validatedData.subject}`,
                html: emailHtml,
            })

            if (!emailResult.success) {
                console.error("Failed to send feedback email:", emailResult.error)
            }
        } catch (emailError) {
            console.error("Feedback email sending failed:", emailError instanceof Error ? emailError.message : emailError)
        }
    }

    revalidatePath("/dashboard/admin")
    return { success: true }
}

export async function getFeedbacks() {
    const supabase = await createServerSupabaseClient()
    await requireAdmin()

    const { data, error } = await supabase
        .from("feedbacks")
        .select("id, user_id, user_name, user_email, subject, message, page_url, attachments, status, created_at")
        .order("created_at", { ascending: false })

    if (error) throw error
    return data as Feedback[]
}

export async function updateFeedbackStatus(id: string, status: Feedback['status']) {
    const supabase = await createServerSupabaseClient()
    await requireAdmin()

    const { error } = await supabase
        .from("feedbacks")
        .update({ status })
        .eq("id", id)

    if (error) throw error
    revalidatePath("/dashboard/admin")
    return { success: true }
}

export async function bulkUpdateFeedbackStatus(ids: string[], status: Feedback['status']) {
    const supabase = await createServerSupabaseClient()
    await requireAdmin()

    const { error } = await supabase
        .from("feedbacks")
        .update({ status })
        .in("id", ids)

    if (error) throw error
    revalidatePath("/dashboard/admin")
    return { success: true, count: ids.length }
}

/**
 * Shared helper: Extract file path from attachment URL and delete from storage
 */
async function deleteAttachments(
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
    attachments: string[]
) {
    for (const url of attachments) {
        try {
            let filePath: string | null = null
            const urlObj = new URL(url)

            const publicMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/feedback-attachments\/(.+)/)
            const signedMatch = urlObj.pathname.match(/\/storage\/v1\/object\/sign\/feedback-attachments\/(.+)/)

            if (publicMatch) {
                filePath = publicMatch[1]
            } else if (signedMatch) {
                filePath = signedMatch[1]
            } else {
                const altMatch = urlObj.pathname.match(/feedback-attachments\/(.+)/)
                if (altMatch) {
                    filePath = altMatch[1]
                }
            }

            if (filePath) {
                const { error: deleteError } = await supabase.storage
                    .from('feedback-attachments')
                    .remove([filePath])

                if (deleteError) {
                    console.error(`Failed to delete file ${filePath}:`, deleteError)
                }
            } else {
                console.warn(`Could not extract file path from URL: ${url}`)
            }
        } catch (error) {
            console.warn(`Error deleting attachment ${url}:`, error)
        }
    }
}

export async function bulkDeleteFeedbacks(ids: string[]) {
    const supabase = await createServerSupabaseClient()
    await requireAdmin()

    // Batch fetch all feedbacks at once instead of N+1 queries
    const { data: feedbacks } = await supabase
        .from("feedbacks")
        .select("id, attachments")
        .in("id", ids)

    // Delete attachments in parallel
    if (feedbacks && feedbacks.length > 0) {
        await Promise.allSettled(
            feedbacks
                .filter(f => f.attachments && Array.isArray(f.attachments) && f.attachments.length > 0)
                .map(f => deleteAttachments(supabase, f.attachments as string[]))
        )
    }

    // Batch delete all feedbacks at once
    const { error, count } = await supabase
        .from("feedbacks")
        .delete()
        .in("id", ids)

    if (error) {
        console.error("Error bulk deleting feedbacks:", error)
        throw error
    }

    revalidatePath("/dashboard/admin")
    return { success: true, deletedCount: count ?? ids.length, errorCount: 0 }
}

export async function deleteFeedback(id: string) {
    const supabase = await createServerSupabaseClient()
    await requireAdmin()

    // Load feedback first to delete attachment files.
    const { data: feedback, error: fetchError } = await supabase
        .from("feedbacks")
        .select("attachments")
        .eq("id", id)
        .single()

    if (fetchError) {
        console.error("Error fetching feedback:", fetchError)
        throw fetchError
    }

    if (!feedback) {
        throw new Error("Feedback not found")
    }

    // Delete attachment files from storage (shared helper).
    if (feedback.attachments && Array.isArray(feedback.attachments) && feedback.attachments.length > 0) {
        await deleteAttachments(supabase, feedback.attachments)
    }

    // Delete feedback row from database.
    const { error: deleteError } = await supabase
        .from("feedbacks")
        .delete()
        .eq("id", id)

    if (deleteError) {
        console.error("Error deleting feedback:", deleteError)
        throw deleteError
    }

    revalidatePath("/dashboard/admin")
    return { success: true }
}
