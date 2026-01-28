/**
 * Cloudinary Storage Provider
 * Cloudinary kullanarak görsel yükleme ve yönetimi
 */

import type { StorageProvider, UploadOptions, UploadResult } from './types'

interface CloudinaryConfig {
  cloudName: string
  uploadPreset: string
  apiKey?: string
  apiSecret?: string
}

export class CloudinaryProvider implements StorageProvider {
  private config: CloudinaryConfig
  private baseUrl: string

  constructor(config: CloudinaryConfig) {
    this.config = config
    this.baseUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}`
  }

  async upload(file: File | Blob, options: UploadOptions = {}): Promise<UploadResult> {
    const formData = new FormData()

    // Dosya adı oluştur (uzantı OLMADAN - Cloudinary otomatik ekliyor)
    const fileNameWithoutExt = options.fileName
      ? options.fileName.replace(/\.[^/.]+$/, '') // Uzantıyı kaldır
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Path oluştur (folder structure)
    const folder = options.path || 'product-images'

    // Unsigned preset için SADECE izin verilen parametreler
    formData.append('file', file)
    formData.append('upload_preset', this.config.uploadPreset)

    // folder parametresi - preset'teki klasör ayarını override eder
    // Bu parametre unsigned upload'larda kullanılabilir
    formData.append('folder', folder)

    // public_id - uzantı OLMADAN, sadece dosya adı (folder parametresi klasörü belirler)
    // NOT: folder parametresi kullanıldığında, public_id'de klasör belirtmeye gerek yok
    formData.append('public_id', fileNameWithoutExt)


    try {
      // Preset adı kontrolü
      if (!this.config.uploadPreset || this.config.uploadPreset.trim() === '') {
        throw new Error('Upload preset adı boş! Lütfen .env.local dosyasında NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET değerini kontrol edin.')
      }

      const response = await fetch(`${this.baseUrl}/image/upload`, {
        method: 'POST',
        body: formData,
        signal: options.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Upload failed' } }))
        const errorMessage = errorData.error?.message || `Upload failed: ${response.statusText}`

        if (response.status === 401) {
          const isUnknownApiKey = errorMessage.includes('Unknown API key') || errorMessage.includes('Invalid API key')

          if (isUnknownApiKey) {
            throw new Error(
              `Cloudinary Preset Bulunamadı!\n\n` +
              `Hata: "Unknown API key" - Bu, preset'in bulunamadığı anlamına gelir.\n\n` +
              `Kontrol Edin:\n` +
              `1. Preset adı: "${this.config.uploadPreset}"\n` +
              `2. Cloud Name: "${this.config.cloudName}"\n\n` +
              `Çözüm:\n` +
              `1. Cloudinary Dashboard > Settings > Upload > Upload presets\n` +
              `2. "${this.config.uploadPreset}" adında bir preset var mı kontrol edin\n` +
              `3. YOKSA: Yeni preset oluşturun (adı: "${this.config.uploadPreset}")\n` +
              `4. Signing mode: "Unsigned" seçin\n` +
              `5. Save butonuna tıklayın\n` +
              `6. Uygulamayı yeniden başlatın`
            )
          }

          throw new Error(
            `Cloudinary 401 Unauthorized hatası!\n\n` +
            `Muhtemel nedenler:\n` +
            `1. Upload Preset "${this.config.uploadPreset}" Signed modunda olabilir\n` +
            `2. Preset adı yanlış olabilir\n\n` +
            `Çözüm:\n` +
            `- Cloudinary Dashboard > Settings > Upload > Upload presets\n` +
            `- "${this.config.uploadPreset}" preset'ini bulun\n` +
            `- Signing mode: "Unsigned" olmalı\n` +
            `- Save butonuna tıklayın`
          )
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Cloudinary response'tan gelen URL'e otomatik optimizasyon parametrelerini ekle
      const rawUrl = data.secure_url || data.url
      let imageUrl = rawUrl

      if (rawUrl && rawUrl.includes('/upload/')) {
        imageUrl = rawUrl.replace('/upload/', '/upload/f_auto,q_auto/')
      }

      if (!imageUrl) {
        throw new Error('Cloudinary upload başarılı ama URL dönmedi. Response: ' + JSON.stringify(data))
      }


      return {
        url: imageUrl,
        path: data.public_id || `${folder}/${fileNameWithoutExt}`,
        metadata: {
          version: data.version,
          width: data.width,
          height: data.height,
          bytes: data.bytes,
          format: data.format,
        },
      }
    } catch (error) {
      console.error('[Cloudinary] Upload error:', error)
      throw error instanceof Error ? error : new Error('Upload failed')
    }
  }

  async delete(_path: string): Promise<void> {
    // Cloudinary'de silme işlemi için signed request gerekir (server-side)
    // Client-side'da sadece upload yapılabilir, silme için API endpoint gerekir
    console.warn('[Cloudinary] Delete operation should be done server-side')
  }

  getPublicUrl(path: string): string {
    const cloudName = this.config.cloudName
    // f_auto: Tarayıcı desteğine göre en iyi formatı (WebP, AVIF vb.) seçer
    // q_auto: Görsel kalitesini bozmadan dosya boyutunu küçültür
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${path}`
  }
}
