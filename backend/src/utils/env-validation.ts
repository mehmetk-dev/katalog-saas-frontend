/* eslint-disable no-console */
/**
 * Backend Environment Validation
 * Sunucu başlangıcında gerekli environment değişkenlerini kontrol eder
 * Spring Boot'daki @Value annotation benzeri
 */

interface EnvVar {
    key: string
    required: boolean
    description: string
    example?: string
}

const requiredEnvVars: EnvVar[] = [
    {
        key: 'PORT',
        required: false,
        description: 'Server port',
        example: '4000'
    },
    {
        key: 'SUPABASE_URL',
        required: true,
        description: 'Supabase project URL',
        example: 'https://xxxxx.supabase.co'
    },
    {
        key: 'SUPABASE_SERVICE_ROLE_KEY',
        required: true,
        description: 'Supabase service role key (secret)',
        example: 'eyJhb...'
    },
    {
        key: 'ALLOWED_ORIGINS',
        required: false,
        description: 'Comma-separated list of allowed CORS origins',
        example: 'http://localhost:3000,https://app.example.com'
    },
    {
        key: 'REDIS_URL',
        required: false,
        description: 'Redis connection URL for caching (optional)',
        example: 'redis://localhost:6379'
    },
    {
        key: 'NODE_ENV',
        required: false,
        description: 'Environment mode',
        example: 'development | production'
    },
    {
        key: 'CLOUDINARY_CLOUD_NAME',
        required: false,
        description: 'Cloudinary cloud name for image management',
        example: 'your_cloud_name'
    },
    {
        key: 'CLOUDINARY_API_KEY',
        required: false,
        description: 'Cloudinary API key for signed operations',
        example: '123456789012345'
    },
    {
        key: 'CLOUDINARY_API_SECRET',
        required: false,
        description: 'Cloudinary API secret for signed operations',
        example: 'abcdefghijklmnop'
    },
    {
        key: 'SMTP_HOST',
        required: false,
        description: 'SMTP server host (defaults to smtp.zoho.com)',
        example: 'smtp.zoho.com'
    },
    {
        key: 'SMTP_PORT',
        required: false,
        description: 'SMTP server port (defaults to 465)',
        example: '465'
    },
    {
        key: 'SMTP_USER',
        required: false,
        description: 'SMTP username / email address',
        example: 'noreply@yourdomain.com'
    },
    {
        key: 'SMTP_PASS',
        required: false,
        description: 'SMTP password / app password',
        example: 'your-app-password'
    },
    {
        key: 'R2_ACCOUNT_ID',
        required: false,
        description: 'Cloudflare R2 account ID for PDF export storage',
        example: 'your_account_id'
    },
    {
        key: 'R2_ACCESS_KEY_ID',
        required: false,
        description: 'Cloudflare R2 access key ID',
        example: 'your_access_key_id'
    },
    {
        key: 'R2_SECRET_ACCESS_KEY',
        required: false,
        description: 'Cloudflare R2 secret access key',
        example: 'your_secret_access_key'
    },
    {
        key: 'R2_BUCKET',
        required: false,
        description: 'Cloudflare R2 bucket name for PDF exports',
        example: 'fogcatalog-pdf-exports'
    },
    {
        key: 'METRICS_SECRET',
        required: false,
        description: 'Secret token for Prometheus metrics endpoint',
        example: 'a-long-random-string'
    }
]

export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []


    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar.key]

        if (envVar.required && !value) {
            errors.push(`❌ Missing: ${envVar.key}`)
            errors.push(`   └─ ${envVar.description}`)
            if (envVar.example) {
                errors.push(`   └─ Example: ${envVar.example}`)
            }
        } else if (!envVar.required && !value) {
            warnings.push(`⚠️  Optional missing: ${envVar.key} - ${envVar.description}`)
        } else {
        }
    }

    if (errors.length > 0) {
        console.error('\n🚨 Environment Validation FAILED:\n')
        errors.forEach(error => console.error(error))
        console.error('\nPlease check your .env file.\n')
    }

    if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn('\n⚠️  Warnings (optional vars):\n')
        warnings.forEach(warning => console.warn(warning))
    }


    return {
        valid: errors.length === 0,
        errors,
        warnings
    }
}

/**
 * Startup validation - use in index.ts
 */
export function validateEnvAndExit(): void {
    const { valid } = validateEnv()

    if (!valid && process.env.NODE_ENV === 'production') {
        console.error('💥 Cannot start server with missing required environment variables!')
        process.exit(1)
    }
}
