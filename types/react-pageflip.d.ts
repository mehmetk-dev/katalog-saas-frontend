declare module 'react-pageflip' {
    import type { ComponentType, PropsWithChildren } from 'react'
    
    interface HTMLFlipBookProps extends PropsWithChildren {
        width?: number | string
        height?: number | string
        size?: 'stretch' | 'fixed'
        minWidth?: number
        maxWidth?: number
        minHeight?: number
        maxHeight?: number
        maxShadowOpacity?: number
        showCover?: boolean
        mobileScrollSupport?: boolean
        usePortrait?: boolean
        startPage?: number
        drawShadow?: boolean
        flippingTime?: number
        useMouseEvents?: boolean
        swipeDistance?: number
        clickEventForward?: boolean
        onFlip?: (e: { data: number }) => void
        onFlipInit?: () => void
        onFlipStart?: () => void
        onFlipEnd?: () => void
        onPageChange?: (e: { data: number }) => void
        className?: string
        style?: React.CSSProperties
    }
    
    const HTMLFlipBook: ComponentType<HTMLFlipBookProps>
    export default HTMLFlipBook
}
