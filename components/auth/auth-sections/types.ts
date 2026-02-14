export type AuthMode = 'signin' | 'signup' | 'forgot-password'

export interface AuthState {
    mode: AuthMode
    isLoading: boolean
    isGoogleLoading: boolean
    error: string | null
    fieldErrors: Record<string, string>
    success: boolean
    showPassword: boolean
    isRedirecting: boolean
    showGoogleWarning: boolean
    shakingFields: Record<string, boolean>
    name: string
    companyName: string
    email: string
    password: string
}

export interface AuthHandlers {
    setMode: (mode: AuthMode) => void
    setName: (name: string) => void
    setCompanyName: (company: string) => void
    setEmail: (email: string) => void
    setPassword: (password: string) => void
    setShowPassword: (show: boolean) => void
    setError: (error: string | null) => void
    setFieldErrors: (errors: Record<string, string>) => void
    setSuccess: (success: boolean) => void
    handleSubmit: (e: React.FormEvent) => Promise<void>
    handleGoogleAuth: () => Promise<void>
    handleContinueAnyway: () => Promise<void>
    resetForm: () => void
}

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string
