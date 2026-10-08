import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AuthMode, TranslateFn } from "./types"

const inputCls = (hasError: boolean, isShaking: boolean, extra?: string) =>
    cn(
        "w-full h-12 px-4 bg-card border rounded-xl text-[15px]",
        "outline-none transition-all placeholder:text-muted-foreground/70 hover:border-border",
        hasError
            ? "border-brand ring-1 ring-brand focus:ring-brand focus:border-brand"
            : "border-border focus:border-primary focus:ring-1 focus:ring-primary",
        isShaking && "animate-shake",
        extra
    )

interface FieldErrorProps {
    error?: string
}

function FieldError({ error }: FieldErrorProps) {
    if (!error) return null
    return (
        <p className={cn(
            "text-[12px] text-brand font-medium",
            "mt-1 ml-1 animate-in fade-in slide-in-from-top-1"
        )}>
            {error}
        </p>
    )
}

interface AuthFormFieldsProps {
    mode: AuthMode
    name: string
    companyName: string
    email: string
    password: string
    showPassword: boolean
    fieldErrors: Record<string, string>
    shakingFields: Record<string, boolean>
    onNameChange: (v: string) => void
    onCompanyNameChange: (v: string) => void
    onEmailChange: (v: string) => void
    onPasswordChange: (v: string) => void
    onShowPasswordChange: (v: boolean) => void
    onFieldErrorsClear: (field: string) => void
    onForgotPassword: () => void
    t: TranslateFn
}

export function AuthFormFields({
    mode, name, companyName, email, password, showPassword,
    fieldErrors, shakingFields,
    onNameChange, onCompanyNameChange, onEmailChange, onPasswordChange,
    onShowPasswordChange, onFieldErrorsClear, onForgotPassword,
    t,
}: AuthFormFieldsProps) {
    return (
        <div className="space-y-4">
            {/* Signup-only fields */}
            {mode === 'signup' && (
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-foreground ml-1">{t("auth.fullName")}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                onNameChange(e.target.value)
                                if (fieldErrors.name) onFieldErrorsClear("name")
                            }}
                            className={inputCls(!!fieldErrors.name, !!shakingFields.name)}
                            placeholder={t("auth.placeholderName")}
                            required
                            suppressHydrationWarning
                            tabIndex={1}
                        />
                        <FieldError error={fieldErrors.name} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-foreground ml-1">{t("auth.company")}</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => onCompanyNameChange(e.target.value)}
                            className={cn(
                                "w-full h-12 px-4 bg-card border border-border",
                                "rounded-xl text-[15px] outline-none",
                                "focus:border-primary focus:ring-1 focus:ring-primary",
                                "transition-all placeholder:text-muted-foreground/70 hover:border-border"
                            )}
                            placeholder={t("auth.placeholderCompany")}
                            suppressHydrationWarning
                            tabIndex={2}
                        />
                    </div>
                </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground ml-1">{t("auth.email")}</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                        onEmailChange(e.target.value)
                        if (fieldErrors.email) onFieldErrorsClear("email")
                    }}
                    className={inputCls(!!fieldErrors.email, !!shakingFields.email)}
                    placeholder={t("auth.placeholderEmail")}
                    required
                    suppressHydrationWarning
                    tabIndex={3}
                />
                <FieldError error={fieldErrors.email} />
            </div>

            {/* Password */}
            {mode !== 'forgot-password' && (
                <div className="space-y-1.5 relative">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[13px] font-medium text-foreground">{t("auth.password")}</label>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                                onPasswordChange(e.target.value)
                                if (fieldErrors.password) onFieldErrorsClear("password")
                            }}
                            className={inputCls(!!fieldErrors.password, !!shakingFields.password, "pl-4 pr-12")}
                            placeholder={t("auth.placeholderPassword")}
                            required
                            tabIndex={4}
                        />
                        <button
                            type="button"
                            onClick={() => onShowPasswordChange(!showPassword)}
                            className={cn(
                                "absolute right-4 top-1/2 -translate-y-1/2",
                                "text-muted-foreground hover:text-muted-foreground transition-colors"
                            )}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {mode === 'signin' && (
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className={cn(
                                "absolute top-0 right-1 text-[13px] font-medium",
                                "text-muted-foreground hover:text-primary transition-colors"
                            )}
                            tabIndex={6}
                        >
                            {t("auth.forgotPassword")}
                        </button>
                    )}
                    <FieldError error={fieldErrors.password} />
                </div>
            )}
        </div>
    )
}
