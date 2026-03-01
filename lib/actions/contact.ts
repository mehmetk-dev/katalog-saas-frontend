"use server"

import { headers } from "next/headers"

import { sendEmail } from "@/lib/services/email"
import { contactFormSchema, validate } from "@/lib/validations"
import {
    checkRateLimit,
    CONTACT_LIMIT,
    CONTACT_WINDOW_MS,
} from "@/lib/services/rate-limit"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

/** XSS koruması için HTML escape */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

const SUBJECT_LABELS: Record<string, string> = {
    genel: "Genel",
    destek: "Destek",
    fiyat: "Fiyat",
    isbirligi: "İş Birliği",
}

export async function sendContactMessage(data: {
    name: string
    email: string
    subject: string
    message: string
}): Promise<{ success: boolean; error?: string }> {
    // Rate limit: IP başına 10 dakikada en fazla 3 contact message
    const headersList = await headers()
    const rl = checkRateLimit(
        headersList,
        "contact-form",
        CONTACT_LIMIT,
        CONTACT_WINDOW_MS
    )
    if (!rl.allowed) {
        return {
            success: false,
            error: "Çok fazla deneme. Lütfen 10 dakika sonra tekrar deneyin.",
        }
    }

    // Validate input
    let validatedData
    try {
        validatedData = validate(contactFormSchema, data)
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Geçersiz form verisi.",
        }
    }

    const adminEmail = ADMIN_EMAIL
    const resendApiKey = process.env.RESEND_API_KEY

    if (!adminEmail || !resendApiKey) {
        console.error("❌ ADMIN_EMAIL or RESEND_API_KEY not set — contact email not sent")
        return {
            success: false,
            error: "E-posta servisi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
        }
    }

    const subjectLabel = SUBJECT_LABELS[validatedData.subject] || validatedData.subject

    try {
        const result = await sendEmail({
            to: adminEmail,
            subject: `[FogCatalog İletişim] ${subjectLabel} — ${escapeHtml(validatedData.name)}`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 24px 32px; border-radius: 12px 12px 0 0;">
                        <h2 style="color: white; margin: 0; font-size: 20px;">📨 Yeni İletişim Formu Mesajı</h2>
                    </div>
                    <div style="background: #f8fafc; padding: 24px 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Ad:</td>
                                <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(validatedData.name)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">E-posta:</td>
                                <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(validatedData.email)}" style="color: #7c3aed;">${escapeHtml(validatedData.email)}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Konu:</td>
                                <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(subjectLabel)}</td>
                            </tr>
                        </table>
                        <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Mesaj</p>
                            <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(validatedData.message)}</p>
                        </div>
                        <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
                            Bu mesaj fogcatalog.com iletişim formu üzerinden gönderildi.
                        </p>
                    </div>
                </div>
            `,
        })

        if (!result.success) {
            console.error("❌ Contact email send failed:", result.error)
            return {
                success: false,
                error: "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.",
            }
        }

        return { success: true }
    } catch (err) {
        console.error("❌ Contact email exception:", err)
        return {
            success: false,
            error: "Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        }
    }
}
