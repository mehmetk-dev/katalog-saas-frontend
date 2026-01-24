"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

import { translations, Language } from "./translations"

interface I18nContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string, params?: Record<string, string | number>) => string
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

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem("language", lang)
    }

    const t = (path: string, params?: Record<string, string | number>): string => {
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
                        return path
                    }
                }
                current = fallback
                break
            }
        }

        // If current is still an object, it means the path points to an object, not a string
        // This happens when someone calls t('header') instead of t('header.features')
        if (current && typeof current === 'object' && !Array.isArray(current)) {
            console.warn(`Translation key "${path}" points to an object, not a string. Use a more specific key like "${path}.propertyName"`)
            return path
        }

        let result = typeof current === 'string' ? current : String(current || path)

        if (params && typeof result === 'string') {
            Object.entries(params).forEach(([key, value]) => {
                result = result.replace(`{${key}}`, String(value))
            })
        }

        return result
    }

    // Prevent hydration mismatch by not rendering until initialized
    if (!isInitialized) {
        return (
            <I18nContext.Provider value={{ language: "tr", setLanguage, t }}>
                {children}
            </I18nContext.Provider>
        )
    }

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
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
            t: (key: string) => key
        }
    }
    return context
}
