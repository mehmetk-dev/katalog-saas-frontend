-- =====================================================
-- ACTIVITY LOGS - TEK SEFERDE ÇALIŞTIRIN
-- Bu dosyayı Supabase SQL Editor'e yapıştırın ve çalıştırın
-- =====================================================

-- 1. users tablosuna is_admin kolonu ekle (yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Activity logs tablosunu oluştur
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    user_name TEXT,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexler
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- 4. RLS Aktif
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 5. Mevcut policy'leri sil (varsa)
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Service role can insert logs" ON activity_logs;

-- 6. Kullanıcı kendi loglarını görebilir
CREATE POLICY "Users can view own activity logs" ON activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- 7. Admin tüm logları görebilir
CREATE POLICY "Admins can view all activity logs" ON activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- 8. Insert izni
CREATE POLICY "Service role can insert logs" ON activity_logs
    FOR INSERT
    WITH CHECK (true);

-- 9. Yetkiler
GRANT SELECT ON activity_logs TO authenticated;
GRANT INSERT ON activity_logs TO authenticated;
GRANT ALL ON activity_logs TO service_role;

-- 10. Tablo açıklaması
COMMENT ON TABLE activity_logs IS 'Kullanıcı aktivite takibi';

-- =====================================================
-- KENDİNİZİ ADMİN YAPIN (email adresinizi değiştirin)
-- =====================================================
-- UPDATE users SET is_admin = true WHERE email = 'sizin@email.com';
