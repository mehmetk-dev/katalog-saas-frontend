import type { Request } from 'express';

// --- Interfaces ---

export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
    };
}

export interface Catalog {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    layout: string;
    is_published: boolean;
    share_slug: string | null;
    view_count: number;
    updated_at: string;
    created_at: string;
    product_ids: string[];
}

export interface CatalogUpdatePayload {
    name?: string;
    description?: string;
    layout?: string;
    primary_color?: string;
    is_published?: boolean;
    share_slug?: string;
    product_ids?: string[];
    show_prices?: boolean;
    show_descriptions?: boolean;
    show_attributes?: boolean;
    show_sku?: boolean;
    show_urls?: boolean;
    columns_per_row?: number;
    background_color?: string;
    background_gradient?: string;
    background_image?: string;
    background_image_fit?: string;
    logo_url?: string;
    logo_position?: string;
    logo_size?: string;
    title_position?: string;
    product_image_fit?: string;
    header_text_color?: string;
    enable_cover_page?: boolean;
    cover_image_url?: string;
    cover_description?: string;
    enable_category_dividers?: boolean;
    cover_theme?: string;
    show_in_search?: boolean;
}

// --- Constants ---

export const TEMPLATES = [
    // Ücretsiz şablonlar
    { id: "modern-grid", name: "Modern Izgara", layout: "modern-grid", is_premium: false, description: "Görsel ürünler için temiz ızgara düzeni" },
    { id: "compact-list", name: "Kompakt Liste", layout: "compact-list", is_premium: false, description: "Geniş envanterler için sık listeleme" },
    { id: "clean-white", name: "Temiz Beyaz", layout: "clean-white", is_premium: false, description: "Minimalist beyaz tasarım" },
    { id: "product-tiles", name: "Ürün Karoları", layout: "product-tiles", is_premium: false, description: "Kompakt 3x4 karo görünümü" },
    // Pro şablonlar
    { id: "magazine", name: "Dergi", layout: "magazine", is_premium: true, description: "Büyük görsellere sahip editoryal stil" },
    { id: "minimalist", name: "Minimalist", layout: "minimalist", is_premium: true, description: "Temel boşluklar ve tipografi" },
    { id: "bold", name: "Kalın", layout: "bold", is_premium: true, description: "Yüksek kontrast ve güçlü yazı tipleri" },
    { id: "elegant-cards", name: "Zarif Kartlar", layout: "elegant-cards", is_premium: true, description: "Lüks kart tasarımı, taş tonları" },
    { id: "classic-catalog", name: "Klasik Katalog", layout: "classic-catalog", is_premium: true, description: "Profesyonel iş kataloğu formatı" },
    { id: "showcase", name: "Vitrin", layout: "showcase", is_premium: true, description: "Spotlight layout, koyu tema" },
    { id: "catalog-pro", name: "Katalog Pro", layout: "catalog-pro", is_premium: true, description: "3 sütunlu profesyonel görünüm" },
    { id: "retail", name: "Perakende", layout: "retail", is_premium: true, description: "Fiyat listesi mağaza formatı" },
    { id: "tech-modern", name: "Teknoloji", layout: "tech-modern", is_premium: true, description: "Koyu tema, tech ürünleri için" },
    { id: "fashion-lookbook", name: "Moda Lookbook", layout: "fashion-lookbook", is_premium: true, description: "Hero layout, moda kataloğu" },
    { id: "industrial", name: "Endüstriyel", layout: "industrial", is_premium: true, description: "Teknik ürünler için kompakt" },
    { id: "luxury", name: "Lüks Koleksiyon", layout: "luxury", is_premium: true, description: "Premium ürünler için altın tema" },
];
