-- TEMPLATES TABLOSU - Tüm şablonlar tek yerden yönetilecek
-- Supabase Dashboard > SQL Editor'da bu sorguyu çalıştırın

-- Önce mevcut tabloyu sil (varsa)
DROP TABLE IF EXISTS templates;

-- Yeni templates tablosunu oluştur
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_pro BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false, -- Sistem şablonu mu yoksa custom mı
  items_per_page INTEGER DEFAULT 6,
  component_name TEXT NOT NULL, -- React component adı (registry için)
  preview_image TEXT, -- Görsel URL
  layout TEXT DEFAULT 'grid', -- grid, list, magazine vs
  sort_order INTEGER DEFAULT 0, -- Sıralama için
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Templates are viewable by everyone" 
ON templates FOR SELECT 
USING (true);

-- Insert/Update/Delete için service role
CREATE POLICY "Service role can manage templates" 
ON templates FOR ALL 
USING (true)
WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA - Tüm mevcut şablonları ekle
-- =====================================================

INSERT INTO templates (id, name, description, is_pro, is_system, items_per_page, component_name, preview_image, layout, sort_order) VALUES
-- Ücretsiz Şablonlar
('modern-grid', 'Modern Izgara', 'Görsel ürünler için temiz ızgara düzeni', false, true, 6, 'ModernGridTemplate', '/templates/modern-grid.png', 'grid', 1),
('compact-list', 'Kompakt Liste', 'Geniş envanterler için sık listeleme', false, true, 8, 'CompactListTemplate', '/templates/compact-list.png', 'list', 2),
('clean-white', 'Temiz Beyaz', 'Minimalist beyaz tasarım', false, true, 6, 'CleanWhiteTemplate', '/templates/modern-grid.png', 'grid', 3),
('product-tiles', 'Ürün Karoları', 'Kompakt 3x3 karo görünümü', false, true, 9, 'ProductTilesTemplate', '/templates/modern-grid.png', 'grid', 4),

-- Pro Şablonlar
('magazine', 'Dergi', 'Büyük görsellere sahip editoryal stil', true, true, 5, 'MagazineTemplate', '/templates/magazine.png', 'magazine', 10),
('minimalist', 'Minimalist', 'Temel boşluklar ve tipografi', true, true, 6, 'MinimalistTemplate', '/templates/minimalist.png', 'grid', 11),
('bold', 'Kalın', 'Yüksek kontrast ve güçlü yazı tipleri', true, true, 4, 'BoldTemplate', '/templates/bold.png', 'grid', 12),
('elegant-cards', 'Zarif Kartlar', 'Lüks kart tasarımı, taş tonları', true, true, 4, 'ElegantCardsTemplate', '/templates/magazine.png', 'grid', 13),
('classic-catalog', 'Klasik Katalog', 'Profesyonel iş kataloğu formatı', true, true, 6, 'ClassicCatalogTemplate', '/templates/compact-list.png', 'list', 14),
('showcase', 'Vitrin', 'Spotlight layout, koyu tema', true, true, 4, 'ShowcaseTemplate', '/templates/bold.png', 'grid', 15),
('catalog-pro', 'Katalog Pro', '3 sütunlu profesyonel görünüm', true, true, 6, 'CatalogProTemplate', '/templates/modern-grid.png', 'grid', 16),
('retail', 'Perakende', 'Fiyat listesi tablo formatı', true, true, 8, 'RetailTemplate', '/templates/compact-list.png', 'list', 17),
('tech-modern', 'Teknoloji', 'Koyu tema, tech ürünleri için', true, true, 4, 'TechModernTemplate', '/templates/bold.png', 'grid', 18),
('fashion-lookbook', 'Moda Lookbook', 'Hero layout, moda kataloğu', true, true, 5, 'FashionLookbookTemplate', '/templates/magazine.png', 'magazine', 19),
('industrial', 'Endüstriyel', 'Teknik ürünler için kompakt', true, true, 6, 'IndustrialTemplate', '/templates/compact-list.png', 'list', 20),
('luxury', 'Lüks Koleksiyon', 'Premium ürünler için altın tema', true, true, 4, 'LuxuryTemplate', '/templates/minimalist.png', 'grid', 21);

-- Eski custom_templates tablosunu sil (varsa)
DROP TABLE IF EXISTS custom_templates;
