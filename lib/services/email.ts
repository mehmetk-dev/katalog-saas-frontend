"use server"

import { Resend } from "resend"

// Resend instance'ını lazy initialization ile oluştur
// Çünkü process.env değerleri runtime'da değişebilir
function getResendInstance() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        return null
    }
    return new Resend(apiKey)
}

interface SendEmailOptions {
    to: string
    subject: string
    html: string
    from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
        console.error("RESEND_API_KEY not found - Email cannot be sent")
        return { success: false, error: "Email service not configured" }
    }

    try {
        // Daha profesyonel görünen gönderen adresi
        // Not: Eğer RESEND_FROM_EMAIL doğrulanmamış bir domain içeriyorsa,
        // Resend API hatası verecektir. Bu durumda default onboarding@resend.dev kullanılır
        let fromEmail = from || process.env.RESEND_FROM_EMAIL || "FogCatalog <onboarding@resend.dev>"
        
        // Eğer custom domain kullanılıyorsa ve hata alırsak, default'a geri dön
        // Şimdilik her zaman default kullan (domain doğrulaması gerektirir)
        // Kullanıcı domain doğrulamak isterse, Resend dashboard'dan yapabilir
        if (fromEmail.includes('@') && !fromEmail.includes('@resend.dev') && !fromEmail.includes('onboarding@resend.dev')) {
            fromEmail = "FogCatalog <onboarding@resend.dev>"
        }
        
        const resendInstance = getResendInstance()
        if (!resendInstance) {
            console.error("Failed to create Resend instance")
            return { success: false, error: "Resend API key not available" }
        }
        const { data, error } = await resendInstance.emails.send({
            from: fromEmail,
            to,
            subject,
            html,
        })

        if (error) {
            console.error("Resend API error:", error.message)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error) {
        console.error("Exception in sendEmail:", error instanceof Error ? error.message : error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}
