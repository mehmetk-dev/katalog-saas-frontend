# Cloudinary Fotoğraf Yükleme Sorun Giderme Rehberi

## 🔍 Olası Sebepler ve Çözümler

### 1. ⚠️ **Environment Variables Eksik veya Yanlış** (EN YAYGIN)

**Sorun:** Sunucuda Cloudinary environment variables ayarlı değil veya yanlış.

**Kontrol:**
Sunucunuzda şu değişkenlerin olduğundan emin olun:
```bash
NEXT_PUBLIC_STORAGE_PROVIDER=cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name
```

**ÖNEMLİ:** 
- `NEXT_PUBLIC_` prefix'i **ZORUNLU** - bu olmadan browser'da erişilemez
- Değişkenler build zamanında değil, runtime'da okunur
- Sunucu yeniden başlatıldıktan sonra aktif olur

**Çözüm:**
1. Hosting platform'unuzun environment variables ayarlarına gidin (Vercel, Netlify, Railway, vs.)
2. Şu 3 değişkeni ekleyin:
   ```
   NEXT_PUBLIC_STORAGE_PROVIDER=cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-actual-preset-name
   ```
3. Uygulamayı yeniden deploy edin

---

### 2. 🔐 **Cloudinary Preset Signed Modunda**

**Sorun:** Upload preset'iniz "Signed" modunda, ama kod "Unsigned" bekliyor.

**Kontrol:**
1. Cloudinary Dashboard > Settings > Upload > Upload presets
2. Preset'inizi bulun
3. "Signing mode" ayarını kontrol edin

**Çözüm:**
1. Preset'i düzenleyin
2. "Signing mode" → **"Unsigned"** seçin
3. Save butonuna tıklayın
4. Uygulamayı yeniden deneyin

**NOT:** Signed preset kullanmak istiyorsanız, kodda değişiklik gerekir (server-side upload).

---

### 3. 📛 **Preset Adı veya Cloud Name Yanlış**

**Sorun:** Preset adı veya cloud name environment variable'da yanlış yazılmış.

**Kontrol:**
```bash
# Browser console'da test edin
console.log('Storage Provider:', process.env.NEXT_PUBLIC_STORAGE_PROVIDER)
console.log('Cloud Name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
console.log('Upload Preset:', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)
```

**Çözüm:**
1. Cloudinary Dashboard'dan doğru değerleri kopyalayın
2. Environment variables'ı güncelleyin
3. Uygulamayı yeniden deploy edin

---

### 4. 🌐 **CORS Sorunları**

**Sorun:** Browser console'da CORS hatası görüyorsanız.

**Kontrol:**
Browser Developer Tools > Console'da şu hatayı görüyor musunuz?
```
Access to fetch at 'https://api.cloudinary.com/...' from origin '...' has been blocked by CORS policy
```

**Çözüm:**
Cloudinary CORS ayarları genelde otomatik yapılır, ama kontrol edin:
1. Cloudinary Dashboard > Settings > Security
2. "Allowed fetch domains" kısmını kontrol edin
3. Production domain'inizi ekleyin (gerekirse)

---

### 5. 🔄 **Build Cache Sorunu**

**Sorun:** Environment variables değiştirdiniz ama hala eski değerler kullanılıyor.

**Çözüm:**
1. Build cache'i temizleyin:
   ```bash
   rm -rf .next
   npm run build
   ```
2. Veya hosting platform'unuzda "Clear build cache" seçeneğini kullanın
3. Yeniden deploy edin

---

### 6. 🧪 **Test Komutları**

**Browser Console'da Test:**
```javascript
// 1. Environment variables kontrolü
console.log('NEXT_PUBLIC_STORAGE_PROVIDER:', process.env.NEXT_PUBLIC_STORAGE_PROVIDER)
console.log('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
console.log('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)

// 2. Storage provider kontrolü
const { storage } = await import('@/lib/storage')
console.log('Storage instance:', storage)

// 3. Cloudinary upload testi
const testFile = new Blob(['test'], { type: 'image/jpeg' })
try {
  const result = await storage.upload(testFile, {
    path: 'products',
    fileName: 'test-' + Date.now()
  })
  console.log('✓ Upload başarılı:', result.url)
} catch (error) {
  console.error('✗ Upload hatası:', error.message)
}
```

**Direct Cloudinary API Testi:**
```javascript
// Browser console'da
const formData = new FormData()
const testFile = new Blob(['test'], { type: 'image/jpeg' })
formData.append('file', testFile)
formData.append('upload_preset', 'YOUR_PRESET_NAME')

const response = await fetch(
  `https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload`,
  { method: 'POST', body: formData }
)

const data = await response.json()
console.log('Cloudinary response:', data)
```

---

### 7. 📋 **Hızlı Kontrol Listesi**

- [ ] `NEXT_PUBLIC_STORAGE_PROVIDER=cloudinary` ayarlı mı?
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` doğru mu?
- [ ] `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` doğru mu?
- [ ] Preset "Unsigned" modunda mı?
- [ ] Sunucu yeniden deploy edildi mi?
- [ ] Browser console'da hata var mı?
- [ ] Network tab'de request başarılı mı?
- [ ] CORS hatası var mı?

---

### 8. 🚨 **Yaygın Hata Mesajları**

**"Cloudinary configuration missing!"**
- Environment variables eksik
- `NEXT_PUBLIC_` prefix'i unutulmuş olabilir

**"Unknown API key" veya "Invalid API key"**
- Preset adı yanlış
- Preset bulunamıyor

**"401 Unauthorized"**
- Preset signed modunda
- Preset adı yanlış

**"Upload failed: ..."**
- Network sorunu
- Dosya çok büyük
- Geçersiz dosya formatı

---

### 9. 🔍 **Debug Adımları**

1. **Browser Console'u açın** (F12)
2. **Network tab'ini açın**
3. **Fotoğraf yüklemeyi deneyin**
4. **Failed request'i bulun** (kırmızı)
5. **Request Details'e tıklayın**
6. **Response'u kontrol edin** - Cloudinary'den gelen hata mesajını görün
7. **Request Headers'ı kontrol edin** - FormData doğru gönderiliyor mu?

---

### 10. 📞 **Destek**

Sorun devam ederse:
1. Browser console hatalarını kaydedin
2. Network tab'deki failed request'i screenshot alın
3. Environment variables'ları kontrol edin (değerleri paylaşmayın, sadece var mı yok mu)
4. Cloudinary Dashboard > Activity Log'u kontrol edin
