# Supabase Email Ayarları - Şifre Sıfırlama

## Önemli Notlar

Şifre sıfırlama email'lerinin çalışması için Supabase dashboard'da aşağıdaki ayarların yapılması gerekiyor:

## 1. Site URL Ayarları

**Supabase Dashboard > Authentication > URL Configuration**

- **Site URL**: Production URL'iniz (örn: `https://fogcatalog.com`)
- **Redirect URLs**: Şu URL'leri ekleyin:
  - `https://fogcatalog.com/auth/reset-password`
  - `https://fogcatalog.com/auth/callback`
  - `http://localhost:3000/auth/reset-password` (development için)

## 2. Email Template Ayarları

**Supabase Dashboard > Authentication > Email Templates**

### Password Reset Template

1. **Subject**: `Şifre Sıfırlama - FogCatalog` (veya istediğiniz başlık)
2. **Body**: Aşağıdaki template'i kullanın:

```html
<h2>Şifre Sıfırlama</h2>
<p>Merhaba,</p>
<p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}">Şifremi Sıfırla</a></p>
<p>Eğer bu isteği siz yapmadıysanız, bu email'i görmezden gelebilirsiniz.</p>
<p>Link 1 saat içinde geçerliliğini yitirecektir.</p>
<p>Saygılarımızla,<br>FogCatalog Ekibi</p>
```

**Önemli**: `{{ .ConfirmationURL }}` değişkeni mutlaka kullanılmalı. Bu, Supabase'in otomatik oluşturduğu şifre sıfırlama linkidir.

## 3. Email Provider Ayarları

**Supabase Dashboard > Settings > Auth**

- Email provider'ın aktif olduğundan emin olun
- Rate limiting ayarlarını kontrol edin
- Email gönderim limitlerini kontrol edin

## 4. Environment Variables

`.env.local` dosyanızda şunların olduğundan emin olun:

```env
NEXT_PUBLIC_APP_URL=https://fogcatalog.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Test Etme

1. `/auth/forgot-password` sayfasına gidin
2. Kayıtlı bir email adresi girin
3. "Sıfırlama Linki Gönder" butonuna tıklayın
4. Email'inizi kontrol edin (spam klasörünü de kontrol edin)
5. Email'deki linke tıklayın
6. Yeni şifrenizi belirleyin

## Sorun Giderme

### Email gelmiyor

1. **Supabase Dashboard'da kontrol edin:**
   - Authentication > Email Templates > Password Reset template'in aktif olduğundan emin olun
   - Settings > Auth > Email provider'ın aktif olduğundan emin olun

2. **Console log'ları kontrol edin:**
   - Browser console'da `[ForgotPassword]` log'larını kontrol edin
   - Hata mesajlarını kontrol edin

3. **Email provider limitlerini kontrol edin:**
   - Supabase free tier'da günlük email limiti olabilir
   - Rate limiting aktif olabilir

4. **Spam klasörünü kontrol edin:**
   - Email'ler spam klasörüne düşmüş olabilir

### Link çalışmıyor

1. **Redirect URL'leri kontrol edin:**
   - Supabase dashboard'da Redirect URLs listesinde doğru URL'lerin olduğundan emin olun
   - URL'ler tam olmalı (örn: `https://fogcatalog.com/auth/reset-password`)

2. **Site URL'i kontrol edin:**
   - Supabase dashboard'da Site URL'in production URL'inizle eşleştiğinden emin olun

3. **Link'in süresi dolmuş olabilir:**
   - Şifre sıfırlama linkleri genellikle 1 saat geçerlidir
   - Yeni bir link isteyin

## Kod Değişiklikleri

- `SITE_URL` artık client-side'da `window.location.origin` kullanıyor (dinamik)
- Daha iyi hata mesajları eklendi
- Console log'lar eklendi (debug için)
- Email gelmediyse spam klasörünü kontrol etmesi için uyarı eklendi
