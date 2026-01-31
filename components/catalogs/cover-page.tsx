import React from 'react'
import { CoverPageRenderer } from './covers'

interface CoverPageProps {
    catalogName: string
    coverImageUrl?: string | null
    coverDescription?: string | null
    logoUrl?: string | null
    primaryColor?: string
    isExporting?: boolean
    /** Selected cover theme key (e.g., 'modern', 'fashion') */
    theme?: string
}

/**
 * Main CoverPage Component
 * 
 * Takes the 'theme' prop and renders the appropriate cover design
 * from the 'covers' directory. Default theme is 'modern'.
 */
export function CoverPage(props: CoverPageProps) {
    return <CoverPageRenderer {...props} />
}
