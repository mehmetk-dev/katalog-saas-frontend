'use client'

import { ErrorView } from '@/components/error-view'

export default function MainError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return <ErrorView error={error} reset={reset} home={{ href: '/', labelKey: 'errorPage.goHome' }} className="min-h-screen" />
}
