import React from 'react'
import { CoverPageRenderer } from './covers'

interface CoverPageProps {
    catalogName: string
    coverImageUrl?: string | null
    coverDescription?: string | null
    logoUrl?: string | null
    primaryColor?: string
    productCount?: number
    isExporting?: boolean
    /** Selected cover theme key (e.g., 'modern', 'fashion') */
    theme?: string
    /** Kapak görseli yüklenmemişse kullanılacak görsel (ilk ürünün görseli) */
    fallbackImageUrl?: string | null
}

/**
 * Main CoverPage Component
 * 
 * Takes the 'theme' prop and renders the appropriate cover design
 * from the 'covers' directory. Default theme is 'modern'.
 */
export function CoverPage({ fallbackImageUrl, coverImageUrl, ...props }: CoverPageProps) {
    // Görsel yoksa temalar gri kutu ya da yer tutucu yazı gösteriyordu; ilk ürünün görseli kullanılır
    return <CoverPageRenderer {...props} coverImageUrl={coverImageUrl || fallbackImageUrl || null} />
}
