-- =====================================================
-- ŞABLON LAYOUT DEĞERLERINI DÜZELT
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- =====================================================

-- Her şablonun layout değerini component_name ile eşleştir
-- (component_name genellikle layout ile aynı formatta olmalı)

-- Modern Grid
UPDATE templates SET layout = 'modern-grid' WHERE id = 'modern-grid' OR component_name ILIKE '%ModernGrid%';

-- Compact List
UPDATE templates SET layout = 'compact-list' WHERE id = 'compact-list' OR component_name ILIKE '%CompactList%';

-- Magazine
UPDATE templates SET layout = 'magazine' WHERE id = 'magazine' OR component_name ILIKE '%Magazine%';

-- Minimalist
UPDATE templates SET layout = 'minimalist' WHERE id = 'minimalist' OR component_name ILIKE '%Minimalist%';

-- Bold
UPDATE templates SET layout = 'bold' WHERE id = 'bold' OR component_name ILIKE '%Bold%';

-- Elegant Cards
UPDATE templates SET layout = 'elegant-cards' WHERE id = 'elegant-cards' OR component_name ILIKE '%ElegantCard%';

-- Classic Catalog
UPDATE templates SET layout = 'classic-catalog' WHERE id = 'classic-catalog' OR component_name ILIKE '%ClassicCatalog%';

-- Showcase
UPDATE templates SET layout = 'showcase' WHERE id = 'showcase' OR component_name ILIKE '%Showcase%';

-- Catalog Pro
UPDATE templates SET layout = 'catalog-pro' WHERE id = 'catalog-pro' OR component_name ILIKE '%CatalogPro%';

-- Retail
UPDATE templates SET layout = 'retail' WHERE id = 'retail' OR component_name ILIKE '%Retail%';

-- Tech Modern
UPDATE templates SET layout = 'tech-modern' WHERE id = 'tech-modern' OR component_name ILIKE '%TechModern%';

-- Fashion Lookbook
UPDATE templates SET layout = 'fashion-lookbook' WHERE id = 'fashion-lookbook' OR component_name ILIKE '%FashionLookbook%';

-- Industrial
UPDATE templates SET layout = 'industrial' WHERE id = 'industrial' OR component_name ILIKE '%Industrial%';

-- Luxury
UPDATE templates SET layout = 'luxury' WHERE id = 'luxury' OR component_name ILIKE '%Luxury%';

-- Clean White
UPDATE templates SET layout = 'clean-white' WHERE id = 'clean-white' OR component_name ILIKE '%CleanWhite%';

-- Product Tiles
UPDATE templates SET layout = 'product-tiles' WHERE id = 'product-tiles' OR component_name ILIKE '%ProductTiles%';

-- Sonucu kontrol et
SELECT id, name, layout, component_name FROM templates ORDER BY sort_order;
