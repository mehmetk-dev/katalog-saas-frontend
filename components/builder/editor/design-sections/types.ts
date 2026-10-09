import type React from "react"

// Shared translation function type
export type TranslateFn = (key: string, params?: Record<string, unknown>) => string

// Common section props
export interface SectionWrapperProps {
    id: string
    title: React.ReactNode
    icon: React.ReactNode
    /** @deprecated artık kullanılmıyor */
    iconBg?: string
    isOpen: boolean
    onToggle: () => void
    children: React.ReactNode
}

// Bölümlerin değerleri ve değiştiricileri: design-context.tsx → useDesignProps() (DesignProps)
export type { DesignProps } from "./design-context"
