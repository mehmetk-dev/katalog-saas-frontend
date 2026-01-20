-- Product Images Storage Bucket Setup
-- Bu script Supabase Dashboard > SQL Editor'da çalıştırılmalıdır

-- 1. Bucket oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true, -- Public erişim
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Avatars bucket (profil fotoğrafları için)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Company logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'company-logos',
    'company-logos',
    true,
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Feedback attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'feedback-attachments',
    'feedback-attachments',
    false, -- Private
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Category covers bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'category-covers',
    'category-covers',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLİTİKALARI
-- ============================================

-- Product Images - Herkes okuyabilir
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Product Images - Authenticated users upload edebilir (Sadece kendi klasörüne)
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Product Images - Kendi yüklediklerini silebilir
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;
CREATE POLICY "Users can delete their own product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Avatars - Herkes okuyabilir
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Avatars - Authenticated users upload edebilir (Sadece kendi klasörüne)
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Company Logos - Herkes okuyabilir
DROP POLICY IF EXISTS "Public read access for company logos" ON storage.objects;
CREATE POLICY "Public read access for company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Company Logos - Authenticated users upload edebilir (Sadece kendi klasörüne)
DROP POLICY IF EXISTS "Authenticated users can upload company logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'company-logos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Category Covers - Herkes okuyabilir
DROP POLICY IF EXISTS "Public read access for category covers" ON storage.objects;
CREATE POLICY "Public read access for category covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-covers');

-- Category Covers - Authenticated users upload edebilir (Sadece kendi klasörüne)
DROP POLICY IF EXISTS "Authenticated users can upload category covers" ON storage.objects;
CREATE POLICY "Authenticated users can upload category covers"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'category-covers' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Feedback Attachments - Sadece sahibi okuyabilir
DROP POLICY IF EXISTS "Users can view their own feedback attachments" ON storage.objects;
CREATE POLICY "Users can view their own feedback attachments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'feedback-attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Feedback Attachments - Authenticated users upload edebilir
DROP POLICY IF EXISTS "Authenticated users can upload feedback attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload feedback attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'feedback-attachments' 
    AND auth.role() = 'authenticated'
);
