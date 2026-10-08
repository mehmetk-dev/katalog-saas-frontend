'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KeyRound, Loader2, ShieldAlert } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { buildRecoveryRedirectTarget } from '@/lib/auth/recovery'
import { useTranslation } from '@/lib/contexts/i18n-provider'
import { createClient } from '@/lib/supabase/client'

const RESET_PASSWORD_PATH = '/auth/reset-password'
const INVALID_LINK_PATH = '/auth?tab=forgot-password&error=invalid_link'

/**
 * E-posta tarayıcıları (Gmail/Outlook) linki önden açıp tek kullanımlık kodu tüketmesin diye
 * kod, kullanıcı butona basana kadar oturuma çevrilmez.
 */
export default function ConfirmRecoveryPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-dvh items-center justify-center bg-background">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <ConfirmRecoveryContent />
        </Suspense>
    )
}

function ConfirmRecoveryContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t: baseT } = useTranslation()
    const t = (key: string) => baseT(key) as string
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [hasLinkError, setHasLinkError] = useState(false)

    useEffect(() => {
        // Supabase implicit flow'da hata hash içinde de gelebilir
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        if (searchParams.get('error') || hashParams.get('error')) setHasLinkError(true)
    }, [searchParams])

    const handleConfirm = async () => {
        setIsRedirecting(true)
        const supabase = createClient()
        const code = searchParams.get('code')

        try {
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                router.push(error ? INVALID_LINK_PATH : RESET_PASSWORD_PATH)
                return
            }

            const recoveryTarget = buildRecoveryRedirectTarget(RESET_PASSWORD_PATH, window.location.hash)
            if (!recoveryTarget) {
                router.push(INVALID_LINK_PATH)
                return
            }

            const { error } = await supabase.auth.setSession({
                access_token: recoveryTarget.accessToken,
                refresh_token: recoveryTarget.refreshToken,
            })
            // Token'lar adres çubuğunda/geçmişte kalmasın
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
            router.push(error ? INVALID_LINK_PATH : recoveryTarget.redirectPath)
        } catch {
            router.push(INVALID_LINK_PATH)
        }
    }

    if (hasLinkError) {
        return (
            <AuthShell
                icon={<ShieldAlert />}
                iconTone="brand"
                title={t('auth.recoveryInvalidTitle')}
                description={t('auth.recoveryInvalidDesc')}
                back={{ href: '/auth', label: t('auth.backToLogin') }}
            >
                <Button size="lg" className="h-11 w-full" onClick={() => router.push('/auth?tab=forgot-password')}>
                    {t('auth.requestNewLink')}
                </Button>
            </AuthShell>
        )
    }

    return (
        <AuthShell
            icon={<KeyRound />}
            title={t('auth.recoveryConfirmTitle')}
            description={t('auth.recoveryConfirmDesc')}
            back={{ href: '/auth', label: t('auth.backToLogin') }}
        >
            <Button size="lg" className="h-11 w-full" onClick={handleConfirm} disabled={isRedirecting}>
                {isRedirecting && <Loader2 className="size-4 animate-spin" />}
                {t('auth.recoveryConfirmAction')}
            </Button>
        </AuthShell>
    )
}
