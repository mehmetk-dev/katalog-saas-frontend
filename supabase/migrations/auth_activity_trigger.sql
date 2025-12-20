-- =====================================================
-- AUTH ACTIVITY TRIGGER - Bu dosyayı Supabase SQL Editor'da çalıştırın
-- Kullanıcı kayıt ve giriş işlemlerini otomatik loglar
-- =====================================================

-- 1. Kayıt işlemi için trigger fonksiyonu (yeni kullanıcı oluşturulduğunda)
CREATE OR REPLACE FUNCTION log_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (user_id, user_email, activity_type, description)
    VALUES (
        NEW.id,
        NEW.email,
        'user_signup',
        NEW.email || ' yeni hesap oluşturdu'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Signup trigger'ı oluştur (auth.users tablosunda)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION log_user_signup();

-- 3. Son giriş zamanını güncelleyen ve login logu oluşturan fonksiyon
CREATE OR REPLACE FUNCTION log_user_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Sadece last_sign_in_at değiştiğinde (yeni giriş)
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        INSERT INTO activity_logs (user_id, user_email, activity_type, description)
        VALUES (
            NEW.id,
            NEW.email,
            'user_login',
            NEW.email || ' sisteme giriş yaptı'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Login trigger'ı oluştur
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION log_user_login();

-- 5. Activity logs tablosuna insert izni ver (authenticated kullanıcılar için)
-- Bu zaten var ama emin olmak için tekrar ekleyelim
GRANT INSERT ON activity_logs TO authenticated;
GRANT INSERT ON activity_logs TO service_role;

-- =====================================================
-- TEST: Mevcut kullanıcıların signup logunu manuel ekle
-- =====================================================
-- Bu sadece bir kerelik çalıştırılmalı (isteğe bağlı)
-- INSERT INTO activity_logs (user_id, user_email, activity_type, description)
-- SELECT id, email, 'user_signup', email || ' hesap oluşturdu (geçmiş kayıt)'
-- FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM activity_logs WHERE activity_type = 'user_signup');
