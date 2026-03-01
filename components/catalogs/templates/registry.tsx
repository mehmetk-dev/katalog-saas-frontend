import dynamic from 'next/dynamic'
import type { TemplateProps } from './types'

/**
 * ALL_TEMPLATES — Dynamic (lazy-loaded) template registry for the builder live preview.
 * For PDF export, catalog-preview.tsx uses a separate TEMPLATE_MAP with static imports
 * because html-to-image requires all components to be synchronously available.
 */

// Loading placeholder that matches the template container
const LoadingPlaceholder = () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <div className="animate-pulse text-muted-foreground text-xs">...</div>
    </div>
)

export const ALL_TEMPLATES: Record<string, React.ComponentType<TemplateProps>> = {
    'modern-grid': dynamic(() => import('./modern-grid').then(m => m.ModernGridTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'compact-list': dynamic(() => import('./compact-list').then(m => m.CompactListTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'list': dynamic(() => import('./compact-list').then(m => m.CompactListTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'magazine': dynamic(() => import('./magazine').then(m => m.MagazineTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'minimalist': dynamic(() => import('./minimalist').then(m => m.MinimalistTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'bold': dynamic(() => import('./bold').then(m => m.BoldTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'elegant-cards': dynamic(() => import('./elegant-cards').then(m => m.ElegantCardsTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'classic-catalog': dynamic(() => import('./classic-catalog').then(m => m.ClassicCatalogTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'showcase': dynamic(() => import('./showcase').then(m => m.ShowcaseTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'catalog-pro': dynamic(() => import('./catalog-pro').then(m => m.CatalogProTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'fashion-lookbook': dynamic(() => import('./fashion-lookbook').then(m => m.FashionLookbookTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'industrial': dynamic(() => import('./industrial').then(m => m.IndustrialTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'luxury': dynamic(() => import('./luxury').then(m => m.LuxuryTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'product-tiles': dynamic(() => import('./product-tiles').then(m => m.ProductTilesTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'tech-modern': dynamic(() => import('./tech-modern').then(m => m.TechModernTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'clean-white': dynamic(() => import('./clean-white').then(m => m.CleanWhiteTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
    'retail': dynamic(() => import('./retail').then(m => m.RetailTemplate), {
        ssr: false,
        loading: LoadingPlaceholder
    }),
}
