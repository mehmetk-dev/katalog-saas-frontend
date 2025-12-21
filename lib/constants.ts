// DEPRECATED: Şablonlar artık Supabase 'templates' tablosundan çekiliyor
// Bu sabit sadece yedek/fallback olarak tutulmuştur
// Admin panelinden şablonları yönetin: /admin
export const TEMPLATES = [
    // Ücretsiz şablonlar
    {
        id: "modern-grid",
        name: "Modern Izgara",
        isPro: false,
        description: "Görsel ürünler için temiz ızgara düzeni",
        image: "/templates/modern-grid.png"
    },
    {
        id: "compact-list",
        name: "Kompakt Liste",
        isPro: false,
        description: "Geniş envanterler için sık listeleme",
        image: "/templates/compact-list.png"
    },
    {
        id: "product-tiles",
        name: "Ürün Karoları",
        isPro: false,
        description: "Kompakt 3x3 karo görünümü",
        image: "/templates/modern-grid.png"
    },
    // Pro şablonlar
    {
        id: "magazine",
        name: "Dergi",
        isPro: true,
        description: "Büyük görsellere sahip editoryal stil",
        image: "/templates/magazine.png"
    },
    {
        id: "minimalist",
        name: "Minimalist",
        isPro: true,
        description: "Temel boşluklar ve tipografi",
        image: "/templates/minimalist.png"
    },
    {
        id: "bold",
        name: "Kalın",
        isPro: true,
        description: "Yüksek kontrast ve güçlü yazı tipleri",
        image: "/templates/bold.png"
    },
    {
        id: "elegant-cards",
        name: "Zarif Kartlar",
        isPro: true,
        description: "Lüks kart tasarımı, taş tonları",
        image: "/templates/magazine.png"
    },
    {
        id: "classic-catalog",
        name: "Klasik Katalog",
        isPro: true,
        description: "Profesyonel iş kataloğu formatı",
        image: "/templates/compact-list.png"
    },
    {
        id: "showcase",
        name: "Vitrin",
        isPro: true,
        description: "Spotlight layout, koyu tema",
        image: "/templates/bold.png"
    },
    {
        id: "catalog-pro",
        name: "Katalog Pro",
        isPro: true,
        description: "3 sütunlu profesyonel görünüm",
        image: "/templates/modern-grid.png"
    },
    {
        id: "fashion-lookbook",
        name: "Moda Lookbook",
        isPro: true,
        description: "Hero layout, moda kataloğu",
        image: "/templates/magazine.png"
    },
    {
        id: "industrial",
        name: "Endüstriyel",
        isPro: true,
        description: "Teknik ürünler için kompakt",
        image: "/templates/compact-list.png"
    },
    {
        id: "luxury",
        name: "Lüks Koleksiyon",
        isPro: true,
        description: "Premium ürünler için altın tema",
        image: "/templates/minimalist.png"
    },
]
