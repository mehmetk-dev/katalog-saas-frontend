"use server"

import nodemailer from "nodemailer"

// Singleton transporter — lazy initialized on first use
let transporterSingleton: nodemailer.Transporter | null = null
let lastConfigHash: string | undefined

function getSmtpConfig() {
    const host = process.env.SMTP_HOST || "smtp.zoho.com"
    const port = Number(process.env.SMTP_PORT) || 465
    const secure = port === 465
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    return { host, port, secure, user, pass }
}

function getTransporter(): nodemailer.Transporter | null {
    const { host, port, secure, user, pass } = getSmtpConfig()
    if (!user || !pass) {
        return null
    }
    const configHash = `${host}:${port}:${user}:${pass}`
    if (!transporterSingleton || lastConfigHash !== configHash) {
        transporterSingleton = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
        })
        lastConfigHash = configHash
    }
    return transporterSingleton
}

interface SendEmailOptions {
    to: string
    subject: string
    html: string
    from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
    const { user } = getSmtpConfig()

    if (!user) {
        console.error("SMTP_USER not found - Email cannot be sent")
        return { success: false, error: "Email service not configured" }
    }

    try {
        const transporter = getTransporter()
        if (!transporter) {
            console.error("Failed to create SMTP transporter")
            return { success: false, error: "SMTP credentials not available" }
        }

        const fromEmail = from || process.env.SMTP_FROM || `FogCatalog <${user}>`

        const info = await transporter.sendMail({
            from: fromEmail,
            to,
            subject,
            html,
        })

        if (info.rejected.length > 0) {
            console.error("SMTP rejected recipients:", info.rejected)
            return { success: false, error: "Email rejected by server" }
        }

        return { success: true, data: { messageId: info.messageId } }
    } catch (error) {
        console.error("Exception in sendEmail:", error instanceof Error ? error.message : error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}
