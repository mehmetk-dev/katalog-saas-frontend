// PERF(F4): Lazy-load templates — only the active template is loaded at any time
import dynamic from "next/dynamic"
import type { TemplateProps } from "@/components/catalogs/templates/types"

const ModernGridTemplate = dynamic(() => import("@/components/catalogs/templates/modern-grid").then(m => ({ default: m.ModernGridTemplate })), { ssr: false })
const CompactListTemplate = dynamic(() => import("@/components/catalogs/templates/compact-list").then(m => ({ default: m.CompactListTemplate })), { ssr: false })
const MagazineTemplate = dynamic(() => import("@/components/catalogs/templates/magazine").then(m => ({ default: m.MagazineTemplate })), { ssr: false })
const MinimalistTemplate = dynamic(() => import("@/components/catalogs/templates/minimalist").then(m => ({ default: m.MinimalistTemplate })), { ssr: false })
const BoldTemplate = dynamic(() => import("@/components/catalogs/templates/bold").then(m => ({ default: m.BoldTemplate })), { ssr: false })
const ElegantCardsTemplate = dynamic(() => import("@/components/catalogs/templates/elegant-cards").then(m => ({ default: m.ElegantCardsTemplate })), { ssr: false })
const ClassicCatalogTemplate = dynamic(() => import("@/components/catalogs/templates/classic-catalog").then(m => ({ default: m.ClassicCatalogTemplate })), { ssr: false })
const ShowcaseTemplate = dynamic(() => import("@/components/catalogs/templates/showcase").then(m => ({ default: m.ShowcaseTemplate })), { ssr: false })
const CatalogProTemplate = dynamic(() => import("@/components/catalogs/templates/catalog-pro").then(m => ({ default: m.CatalogProTemplate })), { ssr: false })
const RetailTemplate = dynamic(() => import("@/components/catalogs/templates/retail").then(m => ({ default: m.RetailTemplate })), { ssr: false })
const TechModernTemplate = dynamic(() => import("@/components/catalogs/templates/tech-modern").then(m => ({ default: m.TechModernTemplate })), { ssr: false })
const FashionLookbookTemplate = dynamic(() => import("@/components/catalogs/templates/fashion-lookbook").then(m => ({ default: m.FashionLookbookTemplate })), { ssr: false })
const IndustrialTemplate = dynamic(() => import("@/components/catalogs/templates/industrial").then(m => ({ default: m.IndustrialTemplate })), { ssr: false })
const LuxuryTemplate = dynamic(() => import("@/components/catalogs/templates/luxury").then(m => ({ default: m.LuxuryTemplate })), { ssr: false })
const CleanWhiteTemplate = dynamic(() => import("@/components/catalogs/templates/clean-white").then(m => ({ default: m.CleanWhiteTemplate })), { ssr: false })
const ProductTilesTemplate = dynamic(() => import("@/components/catalogs/templates/product-tiles").then(m => ({ default: m.ProductTilesTemplate })), { ssr: false })

// PERF(Q5): Properly typed template map — no `any` suppression needed
export const ALL_TEMPLATES: Record<string, React.ComponentType<TemplateProps>> = {
  'modern-grid': ModernGridTemplate,
  'compact-list': CompactListTemplate,
  'list': CompactListTemplate,
  'magazine': MagazineTemplate,
  'minimalist': MinimalistTemplate,
  'minimal-gallery': MinimalistTemplate,
  'bold': BoldTemplate,
  'bold-grid': BoldTemplate,
  'elegant-cards': ElegantCardsTemplate,
  'elegant-showcase': ElegantCardsTemplate,
  'classic-catalog': ClassicCatalogTemplate,
  'showcase': ShowcaseTemplate,
  'catalog-pro': CatalogProTemplate,
  'retail': RetailTemplate,
  'tech-modern': TechModernTemplate,
  'fashion-lookbook': FashionLookbookTemplate,
  'industrial': IndustrialTemplate,
  'luxury': LuxuryTemplate,
  'clean-white': CleanWhiteTemplate,
  'product-tiles': ProductTilesTemplate,
}

export const A4_WIDTH = 794
export const A4_HEIGHT = 1123
