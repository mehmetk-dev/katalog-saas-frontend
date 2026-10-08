import type { AuthState, AuthHandlers, TranslateFn } from "./types"
import { BackgroundDecorations, AuthFormBackButton, AuthFormHeader } from "./auth-form-header"
import { AuthFormError, ResetLinkSent } from "./auth-form-alerts"
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
        success, showPassword, shakingFields,
        name, companyName, email, password,
    } = state
    const {
        setMode, setName, setCompanyName, setEmail, setPassword,
        setShowPassword, setFieldErrors,
        handleSubmit, handleGoogleAuth, resetForm,
    } = handlers

    const resetLinkSent = success && mode === "forgot-password"

    return (
        <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background lg:w-1/2">
            <BackgroundDecorations />
            <AuthFormBackButton t={t} />

            <div className="relative z-10 w-full max-w-[420px] px-4 py-20 sm:px-6 lg:p-12">
                <div key={mode} className="animate-in fade-in slide-in-from-right-4 duration-500 ease-out">
                    <AuthFormHeader mode={mode} t={t} />

                    {resetLinkSent ? (
                        <ResetLinkSent email={email} handlers={handlers} t={t} />
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                            <AuthFormError error={error} />

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
                                onFieldErrorsClear={(field) => setFieldErrors({ ...fieldErrors, [field]: "" })}
                                onForgotPassword={() => {
                                    setMode("forgot-password")
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
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
