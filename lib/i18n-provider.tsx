"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react"

import { translations, Language } from "./translations"

export type TranslationValue = string | number | boolean | null | undefined | { [key: string]: TranslationValue } | TranslationValue[]

interface I18nContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: <T = string>(key: string, params?: Record<string, unknown>) => T
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>("tr")
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        // Try to get language from localStorage first
        const savedLang = localStorage.getItem("language") as Language
        if (savedLang && (savedLang === "tr" || savedLang === "en")) {
            setLanguageState(savedLang)
            setIsInitialized(true)
            return
        }

        // Default to Turkish
        setLanguageState("tr")
        localStorage.setItem("language", "tr")
        setIsInitialized(true)
    }, [])

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem("language", lang)
    }, [])

    const t = useCallback(<T = string>(path: string, params?: Record<string, unknown>): T => {
        const keys = path.split(".")
        let current: unknown = translations[language]

        // Navigate through the translation object
        for (const key of keys) {
            if (current && typeof current === 'object' && !Array.isArray(current) && key in current) {
                current = (current as Record<string, unknown>)[key]
            } else {
                // Fallback to Turkish if key not found in current language
                let fallback: unknown = translations.tr
                for (const k of keys) {
                    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback) && k in fallback) {
                        fallback = (fallback as Record<string, unknown>)[k]
                    } else {
                        console.warn(`Translation missing for key: ${path}`)
                        return path as unknown as T
                    }
                }
                current = fallback
                break
            }
        }

        // Return the value directly if it's not a string (e.g. array or object)
        if (typeof current !== 'string') {
            return current as T
        }

        let result = current

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                // Only replace if value is string or number
                if (typeof value === 'string' || typeof value === 'number') {
                    result = result.replace(`{${key}}`, String(value))
                }
            })
        }

        return result as unknown as T
    }, [language])

    const contextValue = useMemo(() => ({
        language: isInitialized ? language : "tr",
        setLanguage,
        t
    }), [isInitialized, language, setLanguage, t])

    return (
        <I18nContext.Provider value={contextValue}>
            {children}
        </I18nContext.Provider>
    )
}

export function useTranslation() {
    const context = useContext(I18nContext)
    if (context === undefined) {
        // SSR sırasında veya provider'ın bir şekilde bulunamadığı durumlarda 
        // uygulamanın patlamasını engellemek için sessizce fallback dönüyoruz.
        return {
            language: "tr" as Language,
            setLanguage: () => { },
            t: <T = string>(key: string) => key as unknown as T
        }
    }
    return context
}
