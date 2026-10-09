'use client'

import { Loader2 } from 'lucide-react'

import { useTranslation } from '@/lib/contexts/i18n-provider'

export default function Loading() {
    const { t } = useTranslation()
    return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
        </div>
    )
}
