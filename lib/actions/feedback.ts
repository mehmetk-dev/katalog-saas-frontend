"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/services/email"
import { feedbackSchema, validate } from "@/lib/validations"
import {
    checkRateLimit,
    FEEDBACK_LIMIT,
    FEEDBACK_WINDOW_MS,
} from "@/lib/services/rate-limit"
import { requireAdmin } from "@/lib/actions/admin"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

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
    // Rate limit: IP başına 10 dakikada en fazla 5 feedback
    const headersList = await headers()
    const rl = checkRateLimit(headersList, "feedback", FEEDBACK_LIMIT, FEEDBACK_WINDOW_MS)
    if (!rl.allowed) {
        throw new Error("Çok fazla deneme. Lütfen 10 dakika sonra tekrar deneyin.")
    }

    // Validate and sanitize input
    const validatedData = validate(feedbackSchema, data)

    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error("❌ No user found in sendFeedback")
        throw new Error("Oturum açmanız gerekiyor")
    }


    // Kullanıcı profil bilgilerini al
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
        console.error("❌ Database insert error:", error)
        throw error
    }


    // Admin'e e-posta gönder (asenkron, hata olsa bile devam et)
    // Environment variable'ları direkt kontrol et
    const adminEmail = process.env.ADMIN_EMAIL
    const resendApiKey = process.env.RESEND_API_KEY


    if (!adminEmail) {
        console.error("❌ ADMIN_EMAIL is not set! Email will not be sent.")
        console.error("   Please add ADMIN_EMAIL to your .env.local file")
    } else if (!resendApiKey) {
        console.error("❌ RESEND_API_KEY is not set! Email will not be sent.")
        console.error("   Please add RESEND_API_KEY to your .env.local file")
    } else {
        try {
            // XSS koruması için HTML escape
            const escapeHtml = (text: string) => {
                return text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;')
            }

            // URL scheme validation — only allow http/https to prevent javascript: XSS
            const isSafeUrl = (url: string): boolean => {
                try {
                    const parsed = new URL(url)
                    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
                } catch {
                    return false
                }
            }

            const safeUserName = escapeHtml(userName)
            const safeUserEmail = escapeHtml(userEmail)
            const safeSubject = escapeHtml(data.subject)
            const safeMessage = escapeHtml(data.message).replace(/\n/g, '<br>')
            const safePageUrl = data.page_url ? escapeHtml(data.page_url) : ''

            const emailHtml = `
                <!DOCTYPE html>
                <html lang="tr">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Sistem Bildirimi</title>
                    <style>
                        /* Modern Font Stack */
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

                        body {
                            margin: 0;
                            padding: 0;
                            background-color: #f9fafb;
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                            color: #111827;
                            -webkit-font-smoothing: antialiased;
                        }

                        .wrapper {
                            width: 100%;
                            table-layout: fixed;
                            background-color: #f9fafb;
                            padding: 48px 0;
                        }

                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            border-radius: 16px;
                            border: 1px solid #e5e7eb;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 10px 15px -3px rgba(0, 0, 0, 0.03);
                            overflow: hidden;
                        }

                        /* Üst Bölüm: Minimal Logo/Başlık */
                        .header {
                            padding: 40px 48px 32px 48px;
                            border-bottom: 1px solid #f3f4f6;
                        }

                        .brand-logo {
                            font-weight: 700;
                            font-size: 14px;
                            letter-spacing: 1px;
                            text-transform: uppercase;
                            color: #6366f1; /* Indigo accents */
                            margin-bottom: 12px;
                            display: block;
                        }

                        .header h1 {
                            font-size: 24px;
                            font-weight: 700;
                            margin: 0;
                            color: #111827;
                            letter-spacing: -0.02em;
                        }

                        /* İçerik Bölümü */
                        .content {
                            padding: 32px 48px;
                        }

                        /* Veri Tablosu: Eşit Boşluklu Yapı */
                        .data-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 32px;
                        }

                        .data-row {
                            border-bottom: 1px solid #f3f4f6;
                        }

                        .data-label {
                            padding: 16px 0;
                            color: #6b7280;
                            font-size: 13px;
                            font-weight: 500;
                            width: 140px;
                            vertical-align: top;
                        }

                        .data-value {
                            padding: 16px 0;
                            color: #111827;
                            font-size: 14px;
                            font-weight: 500;
                            vertical-align: top;
                        }

                        .data-value a {
                            color: #6366f1;
                            text-decoration: none;
                        }

                        /* Mesaj Alanı: Odak Noktası */
                        .message-box {
                            background-color: #f8fafc;
                            border-radius: 12px;
                            padding: 24px;
                            margin-top: 8px;
                        }

                        .message-box-title {
                            font-size: 12px;
                            font-weight: 700;
                            color: #94a3b8;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            margin-bottom: 12px;
                            display: block;
                        }

                        .message-body {
                            font-size: 15px;
                            line-height: 1.6;
                            color: #334155;
                            white-space: pre-wrap;
                        }

                        /* Dosya Ekleri */
                        .attachment-badge {
                            display: inline-flex;
                            align-items: center;
                            padding: 8px 12px;
                            background: #fff;
                            border: 1px solid #e2e8f0;
                            border-radius: 8px;
                            margin-top: 8px;
                            margin-right: 8px;
                            text-decoration: none;
                            color: #475569;
                            font-size: 13px;
                            transition: all 0.2s;
                        }

                        /* Alt Bilgi */
                        .footer {
                            padding: 32px 48px;
                            background-color: #fafafa;
                            border-top: 1px solid #f3f4f6;
                            text-align: center;
                        }

                        .footer p {
                            font-size: 12px;
                            color: #9ca3af;
                            margin: 4px 0;
                        }

                        /* Mobile Adjustments */
                        @media only screen and (max-width: 600px) {
                            .container { border-radius: 0; border: none; }
                            .header, .content, .footer { padding: 32px 24px; }
                            .data-label { width: 100px; font-size: 12px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <span class="brand-logo">FOGKatalog • Dashboard</span>
                                <h1>Yeni Geri Bildirim</h1>
                            </div>

                            <div class="content">
                                <table class="data-table">
                                    <tr class="data-row">
                                        <td class="data-label">Kullanıcı</td>
                                        <td class="data-value">${safeUserName}</td>
                                    </tr>
                                    <tr class="data-row">
                                        <td class="data-label">E-posta</td>
                                        <td class="data-value"><a href="mailto:${safeUserEmail}">${safeUserEmail}</a></td>
                                    </tr>
                                    <tr class="data-row">
                                        <td class="data-label">Konu Başlığı</td>
                                        <td class="data-value">${safeSubject}</td>
                                    </tr>
                                    ${safePageUrl ? `
                                    <tr class="data-row">
                                        <td class="data-label">Kaynak Sayfa</td>
                                        <td class="data-value"><a href="${safePageUrl}">${safePageUrl}</a></td>
                                    </tr>
                                    ` : ''}
                                </table>

                                <div class="message-box">
                                    <span class="message-box-title">Kullanıcı Notu</span>
                                    <div class="message-body">${safeMessage}</div>
                                </div>

                                ${data.attachments && data.attachments.length > 0 ? `
                                <div style="margin-top: 32px;">
                                    <span class="message-box-title">Ekli Dosyalar</span>
                                    <div style="display: flex; flex-wrap: wrap;">
                                        ${data.attachments.filter(url => isSafeUrl(url)).map(url => {
                const fileName = escapeHtml(url).split('/').pop() || 'dosya'
                const displayName = fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName
                return `
                                            <a href="${escapeHtml(url)}" class="attachment-badge" target="_blank" rel="noopener noreferrer">
                                                📄 ${displayName}
                                            </a>
                                        `
            }).join('')}
                                    </div>
                                </div>
                                ` : ''}
                            </div>

                            <div class="footer">
                                <p>Bu e-posta <strong>FOG İstanbul</strong> sunucuları tarafından otomatik olarak oluşturuldu.</p>
                                <p>© 2026 Tüm Hakları Saklıdır.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `

            const emailResult = await sendEmail({
                to: adminEmail,
                subject: `[Sorun Bildirimi] ${data.subject}`,
                html: emailHtml,
            })

            if (!emailResult.success) {
                console.error("Failed to send feedback email:", emailResult.error)
            }
        } catch (emailError) {
            // E-posta gönderme hatası olsa bile feedback kaydı başarılı sayılır
            console.error("Exception in email sending:", emailError instanceof Error ? emailError.message : emailError)
            console.error("=".repeat(50))
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
        .select("*")
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
                    console.error(`❌ Failed to delete file ${filePath}:`, deleteError)
                }
            } else {
                console.warn(`⚠️ Could not extract file path from URL: ${url}`)
            }
        } catch (error) {
            console.warn(`⚠️ Error deleting attachment ${url}:`, error)
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

    // Önce feedback'i al (attachments için)
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

    // Storage'dan dosyaları sil (shared helper kullan)
    if (feedback.attachments && Array.isArray(feedback.attachments) && feedback.attachments.length > 0) {
        await deleteAttachments(supabase, feedback.attachments)
    }

    // Veritabanından feedback'i sil
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
