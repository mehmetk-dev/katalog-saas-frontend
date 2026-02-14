import type { TranslationFn } from "@/components/auth/auth-form/types"

interface LegalNoticeProps {
    language: string
    t: TranslationFn
}

export function LegalNotice({ language, t }: LegalNoticeProps) {
    return (
        <p className="text-center text-xs text-muted-foreground">
            {language === "tr" ? (
                <>
                    Devam ederek{" "}
                    <a href="/terms" className="text-primary hover:underline">
                        {t("auth.terms")}
                    </a>{" "}
                    ve{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                        {t("auth.privacy")}
                    </a>
                    {"'"}nı kabul etmiş olursunuz.
                </>
            ) : (
                <>
                    By continuing, you agree to our{" "}
                    <a href="/terms" className="text-primary hover:underline">
                        {t("auth.terms")}
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                        {t("auth.privacy")}
                    </a>.
                </>
            )}
        </p>
    )
}
