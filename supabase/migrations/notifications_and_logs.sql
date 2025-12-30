-- ============================================
-- NOTIFICATIONS TABLE
-- Kullanıcı bildirimleri için tablo
-- ============================================

-- Tablo oluştur
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS (Row Level Security) aktifleştir
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi bildirimlerini görebilir
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Sistem (service role) bildirim oluşturabilir
CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT
    WITH CHECK (true);

-- Kullanıcılar kendi bildirimlerini güncelleyebilir (okundu olarak işaretleme)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Kullanıcılar kendi bildirimlerini silebilir
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- ACTIVITY_LOGS TABLE (eğer yoksa)
-- Aktivite logları için tablo
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_name TEXT,
    activity_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);

-- RLS aktifleştir
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin (service role) tüm logları görebilir
CREATE POLICY "Service role can do everything on activity_logs" ON activity_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Kullanıcılar kendi aktivite loglarını görebilir
CREATE POLICY "Users can view own activity logs" ON activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);
