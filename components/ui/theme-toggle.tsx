"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/contexts/i18n-provider"

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme()
    const { t } = useTranslation()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-9 w-9">
                <Sun className="h-4 w-4" />
            </Button>
        )
    }

    const isDark = resolvedTheme === "dark"

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title={isDark ? (t('common.lightTheme') || 'Light theme') : (t('common.darkTheme') || 'Dark theme')}
        >
            {isDark ? (
                <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">{t('common.toggleTheme') || 'Toggle theme'}</span>
        </Button>
    )
}
