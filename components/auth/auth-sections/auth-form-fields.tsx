import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AuthMode, TranslateFn } from "./types"

const inputCls = (hasError: boolean, isShaking: boolean, extra?: string) =>
    cn(
        "w-full h-12 px-4 bg-white border rounded-xl text-[15px]",
        "outline-none transition-all placeholder:text-slate-300 hover:border-slate-300",
        hasError
            ? "border-[#cf1414] ring-1 ring-[#cf1414] focus:ring-[#cf1414] focus:border-[#cf1414]"
            : "border-slate-200 focus:border-violet-600 focus:ring-1 focus:ring-violet-600",
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
            "text-[12px] text-[#cf1414] font-medium",
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
                        <label className="text-[13px] font-medium text-slate-900 ml-1">{t("auth.fullName")}</label>
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
                        <label className="text-[13px] font-medium text-slate-900 ml-1">{t("auth.company")}</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => onCompanyNameChange(e.target.value)}
                            className={cn(
                                "w-full h-12 px-4 bg-white border border-slate-200",
                                "rounded-xl text-[15px] outline-none",
                                "focus:border-violet-600 focus:ring-1 focus:ring-violet-600",
                                "transition-all placeholder:text-slate-300 hover:border-slate-300"
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
                <label className="text-[13px] font-medium text-slate-900 ml-1">{t("auth.email")}</label>
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
                        <label className="text-[13px] font-medium text-slate-900">{t("auth.password")}</label>
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
                                "text-slate-400 hover:text-slate-600 transition-colors"
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
                                "text-slate-500 hover:text-violet-600 transition-colors"
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
