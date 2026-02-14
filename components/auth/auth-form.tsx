"use client"

import { Separator } from "@/components/ui/separator"
import { AuthTabs } from "@/components/auth/auth-form/auth-tabs"
import { ErrorAlert } from "@/components/auth/auth-form/error-alert"
import { GoogleAuthButton } from "@/components/auth/auth-form/google-auth-button"
import { LegalNotice } from "@/components/auth/auth-form/legal-notice"
import { LoadingStatus } from "@/components/auth/auth-form/loading-status"
import { RedirectOverlay } from "@/components/auth/auth-form/redirect-overlay"
import { StatusBanner } from "@/components/auth/auth-form/status-banner"
import { useAuthFormController } from "@/components/auth/auth-form/use-auth-form-controller"

interface AuthFormProps {
    onSignUpComplete: () => void
}

export function AuthForm({ onSignUpComplete: _onSignUpComplete }: AuthFormProps) {
    const {
        t,
        language,
        defaultTab,
        isLoading,
        isGoogleLoading,
        error,
        loadingPhase,
        isSlowConnection,
        showRetry,
        isOnline,
        isRedirecting,
        signInEmail,
        signInPassword,
        signUpName,
        signUpCompany,
        signUpEmail,
        signUpPassword,
        setSignInEmail,
        setSignInPassword,
        setSignUpName,
        setSignUpCompany,
        setSignUpEmail,
        setSignUpPassword,
        handleSignIn,
        handleSignUp,
        handleGoogleAuth,
        clearError,
    } = useAuthFormController()

    if (isRedirecting) {
        return <RedirectOverlay t={t} />
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">{t("auth.welcome")}</h2>
                <p className="text-muted-foreground text-sm">{t("auth.subtitle")}</p>
            </div>

            <StatusBanner isOnline={isOnline} t={t} />

            <LoadingStatus isLoading={isLoading} loadingPhase={loadingPhase} isSlowConnection={isSlowConnection} t={t} />

            <ErrorAlert error={error} showRetry={showRetry} onRetry={clearError} t={t} />

            <GoogleAuthButton
                isLoading={isLoading}
                isGoogleLoading={isGoogleLoading}
                isOnline={isOnline}
                onClick={handleGoogleAuth}
                t={t}
            />

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t("auth.or")}</span>
                </div>
            </div>

            <AuthTabs
                defaultTab={defaultTab}
                isLoading={isLoading}
                isGoogleLoading={isGoogleLoading}
                isOnline={isOnline}
                loadingPhase={loadingPhase}
                signInEmail={signInEmail}
                signInPassword={signInPassword}
                signUpName={signUpName}
                signUpCompany={signUpCompany}
                signUpEmail={signUpEmail}
                signUpPassword={signUpPassword}
                onSignIn={handleSignIn}
                onSignUp={handleSignUp}
                onSignInEmailChange={setSignInEmail}
                onSignInPasswordChange={setSignInPassword}
                onSignUpNameChange={setSignUpName}
                onSignUpCompanyChange={setSignUpCompany}
                onSignUpEmailChange={setSignUpEmail}
                onSignUpPasswordChange={setSignUpPassword}
                t={t}
            />

            <LegalNotice language={language} t={t} />
        </div>
    )
}