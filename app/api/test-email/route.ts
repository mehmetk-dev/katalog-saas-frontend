import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/services/email'

export async function GET() {
    try {
        // Environment variable kontrolü
        const adminEmail = process.env.ADMIN_EMAIL
        const resendApiKey = process.env.RESEND_API_KEY
        
        const envCheck = {
            ADMIN_EMAIL: {
                exists: !!adminEmail,
                value: adminEmail ? `${adminEmail.substring(0, 5)}...` : 'NOT SET'
            },
            RESEND_API_KEY: {
                exists: !!resendApiKey,
                length: resendApiKey?.length || 0,
                prefix: resendApiKey ? `${resendApiKey.substring(0, 10)}...` : 'NOT SET'
            }
        }
        
        // Test email gönder
        let emailResult = null
        if (adminEmail && resendApiKey) {
            console.log("🧪 TEST: Attempting to send test email...")
            emailResult = await sendEmail({
                to: adminEmail,
                subject: '[TEST] Email Service Test',
                html: `
                    <h1>Test Email</h1>
                    <p>Bu bir test e-postasıdır.</p>
                    <p>Eğer bu e-postayı alıyorsanız, email servisi çalışıyor demektir.</p>
                    <p>Zaman: ${new Date().toISOString()}</p>
                `
            })
            console.log("🧪 TEST: Email result:", emailResult)
        }
        
        return NextResponse.json({
            success: true,
            environment: envCheck,
            emailTest: emailResult,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error("🧪 TEST ERROR:", error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}
