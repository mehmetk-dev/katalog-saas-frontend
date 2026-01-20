"use client"

import { useEffect } from "react"

import { useTranslation } from "@/lib/i18n-provider"

/**
 * Client-side title updater for homepage
 * This runs on the client to update document title based on language
 */
export function HomePageTitleUpdater() {
    const { t, language } = useTranslation()

    useEffect(() => {
        document.title = t('common.siteTitle')
    }, [language, t])

    return null
}
