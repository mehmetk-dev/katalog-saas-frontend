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
    console.log("=".repeat(50))
    console.log("📧 sendEmail FUNCTION CALLED")
    console.log("=".repeat(50))
    console.log("Parameters:")
    console.log("  - to:", to)
    console.log("  - subject:", subject)
    console.log("  - html length:", html.length)
    console.log("  - from (provided):", from || "not provided")
    
    // Eğer RESEND_API_KEY yoksa, e-posta göndermeyi atla (development için)
    const apiKey = process.env.RESEND_API_KEY
    console.log("  - RESEND_API_KEY exists:", !!apiKey)
    console.log("  - RESEND_API_KEY length:", apiKey?.length || 0)
    
    if (!apiKey) {
        console.error("=".repeat(50))
        console.error("❌ RESEND_API_KEY NOT FOUND - Email cannot be sent")
        console.error("=".repeat(50))
        return { success: false, error: "Email service not configured" }
    }

    try {
        // Daha profesyonel görünen gönderen adresi
        // Not: Eğer RESEND_FROM_EMAIL doğrulanmamış bir domain içeriyorsa,
        // Resend API hatası verecektir. Bu durumda default onboarding@resend.dev kullanılır
        let fromEmail = from || process.env.RESEND_FROM_EMAIL || "CatalogPro <onboarding@resend.dev>"
        
        // Eğer custom domain kullanılıyorsa ve hata alırsak, default'a geri dön
        // Şimdilik her zaman default kullan (domain doğrulaması gerektirir)
        // Kullanıcı domain doğrulamak isterse, Resend dashboard'dan yapabilir
        if (fromEmail.includes('@') && !fromEmail.includes('@resend.dev') && !fromEmail.includes('onboarding@resend.dev')) {
            console.warn("⚠️ Custom domain detected in RESEND_FROM_EMAIL. Using default to avoid domain verification issues.")
            fromEmail = "CatalogPro <onboarding@resend.dev>"
        }
        
        console.log("📧 Preparing to send email:")
        console.log("  - from:", fromEmail)
        console.log("  - to:", to)
        console.log("  - subject:", subject)
        
        const resendInstance = getResendInstance()
        if (!resendInstance) {
            console.error("❌ Failed to create Resend instance")
            return { success: false, error: "Resend API key not available" }
        }
        
        console.log("📤 Calling Resend API...")
        const { data, error } = await resendInstance.emails.send({
            from: fromEmail,
            to,
            subject,
            html,
        })

        if (error) {
            console.error("=".repeat(50))
            console.error("❌ RESEND API RETURNED ERROR")
            console.error("=".repeat(50))
            console.error("Error object:", JSON.stringify(error, null, 2))
            console.error("Error message:", error.message)
            console.error("=".repeat(50))
            return { success: false, error: error.message }
        }

        console.log("=".repeat(50))
        console.log("✅✅✅ RESEND API SUCCESS")
        console.log("=".repeat(50))
        console.log("Response data:", JSON.stringify(data, null, 2))
        console.log("=".repeat(50))
        return { success: true, data }
    } catch (error) {
        console.error("=".repeat(50))
        console.error("❌❌❌ EXCEPTION IN sendEmail")
        console.error("=".repeat(50))
        if (error instanceof Error) {
            console.error("Error name:", error.name)
            console.error("Error message:", error.message)
            console.error("Error stack:", error.stack)
        } else {
            console.error("Unknown error type:", typeof error)
            console.error("Error value:", error)
        }
        console.error("=".repeat(50))
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}
