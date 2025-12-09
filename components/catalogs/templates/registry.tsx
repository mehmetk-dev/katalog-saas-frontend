import dynamic from 'next/dynamic'

export const ALL_TEMPLATES: Record<string, any> = {
    'modern-grid': dynamic(() => import('./modern-grid').then(m => m.ModernGridTemplate)),
    'compact-list': dynamic(() => import('./compact-list').then(m => m.CompactListTemplate)),
    'magazine': dynamic(() => import('./magazine').then(m => m.MagazineTemplate), { ssr: false }),
    'minimalist': dynamic(() => import('./minimalist').then(m => m.MinimalistTemplate), { ssr: false }),
    'bold': dynamic(() => import('./bold').then(m => m.BoldTemplate), { ssr: false }),
    'elegant-cards': dynamic(() => import('./elegant-cards').then(m => m.ElegantCardsTemplate), { ssr: false }),
    'classic-catalog': dynamic(() => import('./classic-catalog').then(m => m.ClassicCatalogTemplate), { ssr: false }),
    'showcase': dynamic(() => import('./showcase').then(m => m.ShowcaseTemplate), { ssr: false }),
    'catalog-pro': dynamic(() => import('./catalog-pro').then(m => m.CatalogProTemplate), { ssr: false }),
    'retail': dynamic(() => import('./retail').then(m => m.RetailTemplate), { ssr: false }),
    'tech-modern': dynamic(() => import('./tech-modern').then(m => m.TechModernTemplate), { ssr: false }),
    'fashion-lookbook': dynamic(() => import('./fashion-lookbook').then(m => m.FashionLookbookTemplate), { ssr: false }),
    'industrial': dynamic(() => import('./industrial').then(m => m.IndustrialTemplate), { ssr: false }),
    'luxury': dynamic(() => import('./luxury').then(m => m.LuxuryTemplate), { ssr: false }),
    'clean-white': dynamic(() => import('./clean-white').then(m => m.CleanWhiteTemplate), { ssr: false }),
    'product-tiles': dynamic(() => import('./product-tiles').then(m => m.ProductTilesTemplate), { ssr: false }),
}
