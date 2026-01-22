/**
 * Environment Validation
 * Uygulama başlangıcında gerekli environment değişkenlerini kontrol eder
 */

interface EnvVar {
    key: string
    required: boolean
    description: string
}

const requiredEnvVars: EnvVar[] = [
    {
        key: 'NEXT_PUBLIC_SUPABASE_URL',
        required: true,
        description: 'Supabase project URL'
    },
    {
        key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        required: true,
        description: 'Supabase anonymous key'
    },
    {
        key: 'NEXT_PUBLIC_APP_URL',
        required: false,
        description: 'Application base URL'
    },
    {
        key: 'NEXT_PUBLIC_API_URL',
        required: false,
        description: 'Backend API URL'
    },
    {
        key: 'RESEND_API_KEY',
        required: false,
        description: 'Resend API key for sending emails (optional, needed for feedback email notifications)'
    },
    {
        key: 'ADMIN_EMAIL',
        required: false,
        description: 'Admin email address for receiving feedback notifications (optional)'
    },
    {
        key: 'RESEND_FROM_EMAIL',
        required: false,
        description: 'From email address for Resend (optional, defaults to "FogCatalog <onboarding@resend.dev>")'
    },
]

export function validateEnv(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar.key]

        if (envVar.required && !value) {
            errors.push(`❌ Missing required env var: ${envVar.key} - ${envVar.description}`)
        }
    }

    if (errors.length > 0) {
        console.error('\n🚨 Environment Validation Failed:\n')
        errors.forEach(error => console.error(error))
        console.error('\nPlease check your .env.local file.\n')
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

// Only run validation in development and during build
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
    const { valid } = validateEnv()

    if (!valid && process.env.NODE_ENV === 'development') {
        console.warn('\n⚠️ Running with missing environment variables.\n')
    }
}
