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

    useEffect(() => {
        // Try to get language from localStorage
        const savedLang = localStorage.getItem("language") as Language
        if (savedLang && (savedLang === "tr" || savedLang === "en")) {
            setLanguageState(savedLang)
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem("language", lang)
    }

    const t = (path: string, params?: Record<string, string | number>): string => {
        const keys = path.split(".")
        let current: any = translations[language]

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation missing for key: ${path}`)
                return path
            }
            current = current[key]
        }

        let result = current as string

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                result = result.replace(`{${key}}`, String(value))
            })
        }

        return result
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
