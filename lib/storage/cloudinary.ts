/**
 * Cloudinary Storage Provider
 * Cloudinary kullanarak gÃ¶rsel yÃ¼kleme ve yÃ¶netimi
 */

import type { StorageProvider, UploadOptions, UploadResult } from './types'

// =============================================================================
// SECURITY: Client-side upload constraints
// These mirror what should be configured in the Cloudinary unsigned upload preset
// =============================================================================
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
]
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_DIMENSION = 8192 // px â€” prevent absurd dimensions

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
    // ===========================================================================
    // SECURITY: Client-side file validation before sending to Cloudinary
    // ===========================================================================

    // 1. File size check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      throw new Error(`Dosya boyutu Ã§ok bÃ¼yÃ¼k: ${sizeMB}MB. Maksimum ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB izin verilmektedir.`)
    }

    if (file.size === 0) {
      throw new Error('BoÅŸ dosya yÃ¼klenemez.')
    }

    // 2. MIME type check
    const fileType = file.type || (file instanceof File ? file.type : '')
    if (fileType && !ALLOWED_MIME_TYPES.includes(fileType)) {
      throw new Error(`Desteklenmeyen dosya tÃ¼rÃ¼: ${fileType}. Ä°zin verilen: JPEG, PNG, WebP, GIF, AVIF, SVG`)
    }

    // 3. If it's a File, do a quick extension check too (defense-in-depth)
    if (file instanceof File && file.name) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg']
      if (ext && !allowedExts.includes(ext)) {
        throw new Error(`Desteklenmeyen dosya uzantÄ±sÄ±: .${ext}. Ä°zin verilen: ${allowedExts.join(', ')}`)
      }
    }

    // 4. Image dimension check (for File/Blob that we can read)
    if (typeof window !== 'undefined' && fileType && fileType.startsWith('image/') && fileType !== 'image/svg+xml') {
      await this.validateImageDimensions(file)
    }

    const formData = new FormData()

    // Dosya adÄ± oluÅŸtur (uzantÄ± OLMADAN - Cloudinary otomatik ekliyor)
    const fileNameWithoutExt = options.fileName
      ? options.fileName.replace(/\.[^/.]+$/, '') // UzantÄ±yÄ± kaldÄ±r
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Path oluÅŸtur (folder structure)
    const folder = options.path || 'product-images'

    // Unsigned preset iÃ§in SADECE izin verilen parametreler
    formData.append('file', file)
    formData.append('upload_preset', this.config.uploadPreset)

    // folder parametresi - preset'teki klasÃ¶r ayarÄ±nÄ± override eder
    // Bu parametre unsigned upload'larda kullanÄ±labilir
    formData.append('folder', folder)

    // public_id - uzantÄ± OLMADAN, sadece dosya adÄ± (folder parametresi klasÃ¶rÃ¼ belirler)
    // NOT: folder parametresi kullanÄ±ldÄ±ÄŸÄ±nda, public_id'de klasÃ¶r belirtmeye gerek yok
    formData.append('public_id', fileNameWithoutExt)


    try {
      // Preset adÄ± kontrolÃ¼
      if (!this.config.uploadPreset || this.config.uploadPreset.trim() === '') {
        throw new Error('Upload preset adÄ± boÅŸ! LÃ¼tfen .env.local dosyasÄ±nda NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET deÄŸerini kontrol edin.')
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
              `Cloudinary Preset BulunamadÄ±!\n\n` +
              `Hata: "Unknown API key" - Bu, preset'in bulunamadÄ±ÄŸÄ± anlamÄ±na gelir.\n\n` +
              `Kontrol Edin:\n` +
              `1. Preset adÄ±: "${this.config.uploadPreset}"\n` +
              `2. Cloud Name: "${this.config.cloudName}"\n\n` +
              `Ã‡Ã¶zÃ¼m:\n` +
              `1. Cloudinary Dashboard > Settings > Upload > Upload presets\n` +
              `2. "${this.config.uploadPreset}" adÄ±nda bir preset var mÄ± kontrol edin\n` +
              `3. YOKSA: Yeni preset oluÅŸturun (adÄ±: "${this.config.uploadPreset}")\n` +
              `4. Signing mode: "Unsigned" seÃ§in\n` +
              `5. Save butonuna tÄ±klayÄ±n\n` +
              `6. UygulamayÄ± yeniden baÅŸlatÄ±n`
            )
          }

          throw new Error(
            `Cloudinary 401 Unauthorized hatasÄ±!\n\n` +
            `Muhtemel nedenler:\n` +
            `1. Upload Preset "${this.config.uploadPreset}" Signed modunda olabilir\n` +
            `2. Preset adÄ± yanlÄ±ÅŸ olabilir\n\n` +
            `Ã‡Ã¶zÃ¼m:\n` +
            `- Cloudinary Dashboard > Settings > Upload > Upload presets\n` +
            `- "${this.config.uploadPreset}" preset'ini bulun\n` +
            `- Signing mode: "Unsigned" olmalÄ±\n` +
            `- Save butonuna tÄ±klayÄ±n`
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
        throw new Error('Cloudinary upload baÅŸarÄ±lÄ± ama URL dÃ¶nmedi. Response: ' + JSON.stringify(data))
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
    // Cloudinary'de silme iÅŸlemi iÃ§in signed request gerekir (server-side)
    // Client-side'da sadece upload yapÄ±labilir, silme iÃ§in backend API endpoint gerekir
    throw new Error('[Cloudinary] Delete operation requires server-side signed request. Use the backend API endpoint instead.')
  }

  getPublicUrl(path: string): string {
    const cloudName = this.config.cloudName
    // f_auto: En iyi format (WebP/AVIF)
    // q_auto: Otomatik kalite
    // w_1600,c_limit: GÃ¶rseli maks 1600px geniÅŸliÄŸe Ã§eker (eÄŸer orijinali daha bÃ¼yÃ¼kse)
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1600,c_limit/${path}`
  }

  /**
   * SECURITY: Validate image dimensions before upload
   * Prevents absurdly large images that could cause OOM on render
   */
  private validateImageDimensions(file: File | Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()

      const cleanup = () => URL.revokeObjectURL(url)

      img.onload = () => {
        cleanup()
        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          reject(new Error(`GÃ¶rsel boyutu Ã§ok bÃ¼yÃ¼k: ${img.width}x${img.height}px. Maksimum ${MAX_DIMENSION}x${MAX_DIMENSION}px.`))
        } else {
          resolve()
        }
      }

      img.onerror = () => {
        cleanup()
        // Can't read dimensions â€” allow upload, Cloudinary will validate
        resolve()
      }

      // Timeout â€” don't block forever
      setTimeout(() => {
        cleanup()
        resolve()
      }, 5000)

      img.src = url
    })
  }
}
