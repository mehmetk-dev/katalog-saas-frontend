import type { Product } from "@/lib/actions/products"

// Helper function to convert simplified product to full Product
function toProduct(p: {
    id: string
    name: string
    description?: string
    price: number
    image_url?: string
}): Product {
    return {
        id: p.id,
        user_id: "preview",
        sku: null,
        name: p.name,
        description: p.description || null,
        price: p.price,
        stock: 0,
        category: null,
        image_url: p.image_url || null,
        images: p.image_url ? [p.image_url] : [],
        product_url: null,
        custom_attributes: [],
        order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
}

// Furniture / Home - varsayılan
const FURNITURE_PRODUCTS: Product[] = [
    toProduct({
        id: "f1",
        name: "Modern Ofis Koltuğu",
        description: "Ergonomik tasarım, fileli sırt desteği",
        price: 4500.00,
        image_url: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "f2",
        name: "Ahşap Çalışma Masası",
        description: "Doğal meşe kaplama, metal ayaklar",
        price: 3200.00,
        image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "f3",
        name: "Kitaplık - 5 Raflı",
        description: "Metal iskelet, ceviz raflar",
        price: 2100.00,
        image_url: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "f4",
        name: "Deri Chester Kanepe",
        description: "Hakiki İtalyan derisi, kapitoneli",
        price: 12500.00,
        image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "f5",
        name: "Cam Orta Sehpa",
        description: "Temperli cam, pirinç ayaklar",
        price: 1800.00,
        image_url: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "f6",
        name: "Yemek Masası Takımı",
        description: "6 kişilik, açılabilir masa",
        price: 8500.00,
        image_url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500&auto=format&fit=crop&q=60",
    }),
]

// Fashion / Moda
const FASHION_PRODUCTS: Product[] = [
    toProduct({
        id: "fa1",
        name: "Klasik Blazer Ceket",
        description: "Slim fit, %100 yün",
        price: 2890.00,
        image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "fa2",
        name: "Deri Çanta",
        description: "El yapımı, hakiki deri",
        price: 1450.00,
        image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "fa3",
        name: "Premium Sneaker",
        description: "Limitli seri, konfor tabanlı",
        price: 1890.00,
        image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "fa4",
        name: "Kaşmir Kazak",
        description: "%100 kaşmir, V yaka",
        price: 1650.00,
        image_url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "fa5",
        name: "Tasarım Güneş Gözlüğü",
        description: "Polarize cam, titanyum çerçeve",
        price: 890.00,
        image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "fa6",
        name: "Deri Kemer",
        description: "İtalyan derisi, paslanmaz toka",
        price: 450.00,
        image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60",
    }),
]

// Technology / Elektronik
const TECH_PRODUCTS: Product[] = [
    toProduct({
        id: "t1",
        name: "Kablosuz Kulaklık Pro",
        description: "Aktif gürültü engelleme, 30 saat pil",
        price: 2499.00,
        image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "t2",
        name: "Akıllı Saat Ultra",
        description: "GPS, kalp ritmi, 5ATM su geçirmez",
        price: 4999.00,
        image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "t3",
        name: "Mekanik Klavye RGB",
        description: "Cherry MX anahtarlar, tam RGB",
        price: 1299.00,
        image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "t4",
        name: "4K Webcam",
        description: "Otomatik odak, dahili mikrofon",
        price: 899.00,
        image_url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "t5",
        name: "Taşınabilir SSD 2TB",
        description: "1050MB/s hız, USB-C",
        price: 1899.00,
        image_url: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "t6",
        name: "Gaming Mouse",
        description: "25600 DPI, 11 programlanabilir tuş",
        price: 799.00,
        image_url: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&auto=format&fit=crop&q=60",
    }),
]

// Luxury / Lüks
const LUXURY_PRODUCTS: Product[] = [
    toProduct({
        id: "l1",
        name: "Altın Kolye",
        description: "14 ayar altın, pırlanta taşlı",
        price: 24500.00,
        image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "l2",
        name: "Lüks Kol Saati",
        description: "İsviçre yapımı, otomatik mekanizma",
        price: 45000.00,
        image_url: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "l3",
        name: "Kristal Vazo",
        description: "El kesimi kristal, limitli üretim",
        price: 8900.00,
        image_url: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "l4",
        name: "Parfüm Koleksiyonu",
        description: "Özel formül, 100ml EDP",
        price: 3500.00,
        image_url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "l5",
        name: "Kaşmir Şal",
        description: "Moğolistan kaşmiri, el dokuması",
        price: 4200.00,
        image_url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "l6",
        name: "Pırlanta Küpe",
        description: "0.5 karat, VS1 berraklık",
        price: 18900.00,
        image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop&q=60",
    }),
]

// Industrial / Endüstriyel
const INDUSTRIAL_PRODUCTS: Product[] = [
    toProduct({
        id: "i1",
        name: "Profesyonel Matkap",
        description: "1200W, darbesiz, değişken hız",
        price: 2450.00,
        image_url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "i2",
        name: "El Aletleri Seti",
        description: "125 parça, çelik alaşım",
        price: 1890.00,
        image_url: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "i3",
        name: "Lazer Mesafe Ölçer",
        description: "100m menzil, ±1.5mm hassasiyet",
        price: 890.00,
        image_url: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "i4",
        name: "Güvenlik Eldiveni",
        description: "Kesim dayanıklı, kaymaz",
        price: 245.00,
        image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "i5",
        name: "Kaynak Maskesi",
        description: "Otomatik kararan, solar güç",
        price: 1250.00,
        image_url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=60",
    }),
    toProduct({
        id: "i6",
        name: "Kompresör 50L",
        description: "2.5 HP, yağsız sistem",
        price: 4500.00,
        image_url: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500&auto=format&fit=crop&q=60",
    }),
]

// Layout'a göre uygun ürün setini döndür
export function getPreviewProductsByLayout(layout: string): Product[] {
    switch (layout) {
        case 'fashion-lookbook':
            return FASHION_PRODUCTS
        case 'tech-modern':
            return TECH_PRODUCTS
        case 'luxury':
            return LUXURY_PRODUCTS
        case 'industrial':
            return INDUSTRIAL_PRODUCTS
        case 'elegant-cards':
        case 'showcase':
            return LUXURY_PRODUCTS
        case 'bold':
        case 'magazine':
            return FASHION_PRODUCTS
        case 'catalog-pro':
        case 'retail':
            return TECH_PRODUCTS
        default:
            return FURNITURE_PRODUCTS
    }
}

// Geriye uyumluluk için varsayılan export
export const PREVIEW_PRODUCTS = FURNITURE_PRODUCTS

