import type React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LoadingPhase, TranslationFn } from "@/components/auth/auth-form/types"
import { getLoadingMessage } from "@/components/auth/auth-form/types"

interface AuthTabsProps {
    defaultTab: "signin" | "signup"
    isLoading: boolean
    isGoogleLoading: boolean
    isOnline: boolean
    loadingPhase: LoadingPhase
    signInEmail: string
    signInPassword: string
    signUpName: string
    signUpCompany: string
    signUpEmail: string
    signUpPassword: string
    onSignIn: (event: React.FormEvent) => void
    onSignUp: (event: React.FormEvent) => void
    onSignInEmailChange: (value: string) => void
    onSignInPasswordChange: (value: string) => void
    onSignUpNameChange: (value: string) => void
    onSignUpCompanyChange: (value: string) => void
    onSignUpEmailChange: (value: string) => void
    onSignUpPasswordChange: (value: string) => void
    t: TranslationFn
}

export function AuthTabs({
    defaultTab,
    isLoading,
    isGoogleLoading,
    isOnline,
    loadingPhase,
    signInEmail,
    signInPassword,
    signUpName,
    signUpCompany,
    signUpEmail,
    signUpPassword,
    onSignIn,
    onSignUp,
    onSignInEmailChange,
    onSignInPasswordChange,
    onSignUpNameChange,
    onSignUpCompanyChange,
    onSignUpEmailChange,
    onSignUpPasswordChange,
    t,
}: AuthTabsProps) {
    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <TabsTrigger
                    value="signin"
                    className="text-sm font-medium rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 transition-colors"
                >
                    {t("auth.signin")}
                </TabsTrigger>
                <TabsTrigger
                    value="signup"
                    className="text-sm font-medium rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 transition-colors"
                >
                    {t("auth.signup")}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
                <form onSubmit={onSignIn} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="signin-email">{t("auth.email")}</Label>
                        <Input
                            suppressHydrationWarning
                            id="signin-email"
                            type="email"
                            placeholder="ornek@email.com"
                            required
                            value={signInEmail}
                            onChange={(event) => onSignInEmailChange(event.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="signin-password">{t("auth.password")}</Label>
                            <a href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                                {t("auth.forgotPassword")}
                            </a>
                        </div>
                        <Input
                            suppressHydrationWarning
                            id="signin-password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={signInPassword}
                            onChange={(event) => onSignInPasswordChange(event.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-12 text-sm font-medium rounded-xl bg-violet-600 hover:bg-violet-700 transition-colors"
                        disabled={isLoading || isGoogleLoading || !isOnline}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
                        <span className="truncate">
                            {isLoading ? getLoadingMessage(loadingPhase, t) || t("auth.signin") : t("auth.signin")}
                        </span>
                    </Button>
                </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={onSignUp} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-name">{t("auth.name")}</Label>
                            <Input
                                suppressHydrationWarning
                                id="signup-name"
                                type="text"
                                placeholder="Ahmet Yılmaz"
                                required
                                value={signUpName}
                                onChange={(event) => onSignUpNameChange(event.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-company">{t("auth.company")}</Label>
                            <Input
                                suppressHydrationWarning
                                id="signup-company"
                                type="text"
                                placeholder="Şirket A.Ş."
                                required
                                value={signUpCompany}
                                onChange={(event) => onSignUpCompanyChange(event.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-email">{t("auth.email")}</Label>
                        <Input
                            suppressHydrationWarning
                            id="signup-email"
                            type="email"
                            placeholder="ornek@email.com"
                            required
                            value={signUpEmail}
                            onChange={(event) => onSignUpEmailChange(event.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-password">{t("auth.password")}</Label>
                        <Input
                            suppressHydrationWarning
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            value={signUpPassword}
                            onChange={(event) => onSignUpPasswordChange(event.target.value)}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">{t("auth.passwordLength")}</p>
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-12 text-sm font-medium rounded-xl bg-violet-600 hover:bg-violet-700 transition-colors"
                        disabled={isLoading || isGoogleLoading || !isOnline}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
                        <span className="truncate">
                            {isLoading
                                ? getLoadingMessage(loadingPhase, t) || t("auth.createAccount")
                                : t("auth.createAccount")}
                        </span>
                    </Button>
                </form>
            </TabsContent>
        </Tabs>
    )
}
