"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

import { translations, Language } from "./translations"

type Translations = typeof translations.tr

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
        let current: any = translations[language]

        for (const key of keys) {
            if (current?.[key] === undefined) {
                // Fallback to Turkish if key not found in current language
                let fallback: any = translations.tr
                for (const k of keys) {
                    if (fallback?.[k] === undefined) {
                        console.warn(`Translation missing for key: ${path}`)
                        return path
                    }
                    fallback = fallback[k]
                }
                current = fallback
                break
            }
            current = current[key]
        }

        let result = current as string

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
        throw new Error("useTranslation must be used within a I18nProvider")
    }
    return context
}
