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
        key: 'SMTP_HOST',
        required: false,
        description: 'SMTP server host (defaults to smtp.zoho.com)'
    },
    {
        key: 'SMTP_PORT',
        required: false,
        description: 'SMTP server port (defaults to 465)'
    },
    {
        key: 'SMTP_USER',
        required: false,
        description: 'SMTP username / email address (needed for sending emails)'
    },
    {
        key: 'SMTP_PASS',
        required: false,
        description: 'SMTP password / app password (needed for sending emails)'
    },
    {
        key: 'SMTP_FROM',
        required: false,
        description: 'From email address (optional, defaults to "FogCatalog <SMTP_USER>")'
    },
    {
        key: 'ADMIN_EMAIL',
        required: false,
        description: 'Admin email address for receiving feedback notifications (optional)'
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
