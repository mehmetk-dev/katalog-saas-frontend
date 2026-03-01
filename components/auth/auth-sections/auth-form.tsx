import type { AuthState, AuthHandlers, TranslateFn } from "./types"
import { cn } from "@/lib/utils"
import { BackgroundDecorations, AuthFormBackButton, AuthFormHeader } from "./auth-form-header"
import { AuthFormAlerts } from "./auth-form-alerts"
import { AuthFormFields } from "./auth-form-fields"
import { AuthFormActions } from "./auth-form-actions"

interface AuthFormProps {
    t: TranslateFn
    state: AuthState
    handlers: AuthHandlers
}

export function AuthForm({ t, state, handlers }: AuthFormProps) {
    const {
        mode, isLoading, isGoogleLoading, error, fieldErrors,
        success, showPassword, showGoogleWarning, shakingFields,
        name, companyName, email, password,
    } = state
    const {
        setMode, setName, setCompanyName, setEmail, setPassword,
        setShowPassword, setFieldErrors,
        handleSubmit, handleGoogleAuth, resetForm,
    } = handlers

    const hasAlertContent = !!error || (success && mode === 'forgot-password') || showGoogleWarning

    return (
        <div className={cn(
            "w-full lg:w-1/2 flex items-center justify-center",
            "bg-gradient-to-b from-violet-100 via-violet-50/50 to-white",
            "relative overflow-hidden"
        )}>
            <BackgroundDecorations />
            <AuthFormBackButton t={t} />

            <div className="w-full max-w-[420px] p-6 lg:p-12 relative z-10">
                <div
                    key={mode}
                    className="animate-in fade-in slide-in-from-right-4 duration-500 ease-out"
                >
                    <AuthFormHeader mode={mode} t={t} />

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <AuthFormAlerts
                            error={error}
                            success={success}
                            mode={mode}
                            showGoogleWarning={showGoogleWarning}
                            handlers={handlers}
                            t={t}
                        />

                        {!hasAlertContent && (
                            <>
                                <AuthFormFields
                                    mode={mode}
                                    name={name}
                                    companyName={companyName}
                                    email={email}
                                    password={password}
                                    showPassword={showPassword}
                                    fieldErrors={fieldErrors}
                                    shakingFields={shakingFields}
                                    onNameChange={setName}
                                    onCompanyNameChange={setCompanyName}
                                    onEmailChange={setEmail}
                                    onPasswordChange={setPassword}
                                    onShowPasswordChange={setShowPassword}
                                    onFieldErrorsClear={(field) =>
                                        setFieldErrors({ ...fieldErrors, [field]: "" })
                                    }
                                    onForgotPassword={() => {
                                        setMode('forgot-password')
                                        resetForm()
                                    }}
                                    t={t}
                                />

                                <AuthFormActions
                                    mode={mode}
                                    isLoading={isLoading}
                                    isGoogleLoading={isGoogleLoading}
                                    onGoogleAuth={handleGoogleAuth}
                                    onModeSwitch={setMode}
                                    onResetForm={resetForm}
                                    t={t}
                                />
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
