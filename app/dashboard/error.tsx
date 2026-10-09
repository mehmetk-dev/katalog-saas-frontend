'use client'

import { ErrorView } from '@/components/error-view'

/** Panel hata sınırı: sidebar ve üst bar korunur, yalnızca içerik alanında gösterilir */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return <ErrorView error={error} reset={reset} home={{ href: '/dashboard', labelKey: 'errorPage.goDashboard' }} />
}
