import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { AuthMode, TranslateFn } from "./types"

const inputCls = (hasError: boolean, isShaking: boolean, extra?: string) =>
    cn(
        "h-11 bg-card text-[15px] md:text-[15px]",
        hasError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
        isShaking && "animate-shake",
        extra
    )

function FieldError({ id, error }: { id: string; error?: string }) {
    if (!error) return null
    return (
        <p id={id} className="text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
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
    const errorProps = (field: string) =>
        fieldErrors[field]
            ? { "aria-invalid": true as const, "aria-describedby": `auth-${field}-error` }
            : {}

    return (
        <div className="space-y-4">
            {mode === "signup" && (
                <>
                    <div className="space-y-1.5">
                        <Label htmlFor="auth-name">{t("auth.fullName")}</Label>
                        <Input
                            id="auth-name"
                            type="text"
                            autoComplete="name"
                            value={name}
                            onChange={(e) => {
                                onNameChange(e.target.value)
                                if (fieldErrors.name) onFieldErrorsClear("name")
                            }}
                            className={inputCls(!!fieldErrors.name, !!shakingFields.name)}
                            placeholder={t("auth.placeholderName")}
                            required
                            suppressHydrationWarning
                            {...errorProps("name")}
                        />
                        <FieldError id="auth-name-error" error={fieldErrors.name} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="auth-company">
                            {t("auth.company")}
                            <span className="font-normal text-muted-foreground">({t("auth.optional")})</span>
                        </Label>
                        <Input
                            id="auth-company"
                            type="text"
                            autoComplete="organization"
                            value={companyName}
                            onChange={(e) => onCompanyNameChange(e.target.value)}
                            className={inputCls(false, false)}
                            placeholder={t("auth.placeholderCompany")}
                            suppressHydrationWarning
                        />
                    </div>
                </>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="auth-email">{t("auth.email")}</Label>
                <Input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                        onEmailChange(e.target.value)
                        if (fieldErrors.email) onFieldErrorsClear("email")
                    }}
                    className={inputCls(!!fieldErrors.email, !!shakingFields.email)}
                    placeholder={t("auth.placeholderEmail")}
                    required
                    suppressHydrationWarning
                    {...errorProps("email")}
                />
                <FieldError id="auth-email-error" error={fieldErrors.email} />
            </div>

            {mode !== "forgot-password" && (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="auth-password">{t("auth.password")}</Label>
                        {mode === "signin" && (
                            <button
                                type="button"
                                onClick={onForgotPassword}
                                className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {t("auth.forgotPassword")}
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <Input
                            id="auth-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete={mode === "signup" ? "new-password" : "current-password"}
                            value={password}
                            onChange={(e) => {
                                onPasswordChange(e.target.value)
                                if (fieldErrors.password) onFieldErrorsClear("password")
                            }}
                            className={inputCls(!!fieldErrors.password, !!shakingFields.password, "pr-11")}
                            placeholder={t("auth.placeholderPassword")}
                            required
                            {...errorProps("password")}
                        />
                        <button
                            type="button"
                            onClick={() => onShowPasswordChange(!showPassword)}
                            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                            aria-pressed={showPassword}
                            className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                    {fieldErrors.password ? (
                        <FieldError id="auth-password-error" error={fieldErrors.password} />
                    ) : mode === "signup" ? (
                        <p className="text-xs text-muted-foreground">{t("auth.passwordLength")}</p>
                    ) : null}
                </div>
            )}
        </div>
    )
}
