import React from 'react'
import { CategoryDividerRenderer } from './dividers'

interface CategoryDividerProps {
    categoryName: string
    firstProductImage?: string | null
    primaryColor?: string
    theme?: string
}

/**
 * CategoryDivider Wrapper Component
 * 
 * Takes the 'theme' prop and renders the appropriate divider design
 * from the 'dividers' directory. Default theme is 'modern'.
 */
export function CategoryDivider(props: CategoryDividerProps) {
    return <CategoryDividerRenderer {...props} />
}
