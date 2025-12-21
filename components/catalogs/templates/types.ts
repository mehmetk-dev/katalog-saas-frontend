import type { Product } from "@/lib/actions/products"

export interface TemplateProps {
    catalogName: string
    products: Product[]
    primaryColor: string
    showPrices: boolean
    showDescriptions: boolean
    showAttributes: boolean
    isFreeUser: boolean
    pageNumber?: number
    totalPages?: number
    // Kişiselleştirme props
    columnsPerRow?: number
    backgroundColor?: string
    backgroundImage?: string | null
    backgroundImageFit?: 'cover' | 'contain' | 'fill'
    backgroundGradient?: string | null
    logoUrl?: string | null
    logoPosition?: string
    logoSize?: string
    titlePosition?: 'left' | 'center' | 'right'  // Başlık konumu
    // Evrensel header/footer kullanıldığında template kendi header/footer'ını gizler
    hideHeader?: boolean
    hideFooter?: boolean
}
