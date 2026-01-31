/**
 * Supabase Storage Provider
 * Supabase Storage kullanarak görsel yükleme ve yönetimi
 */

import type { StorageProvider, UploadOptions, UploadResult } from './types'
import { createClient } from '@/lib/supabase/client'

export class SupabaseProvider implements StorageProvider {
  private bucketName: string

  constructor(bucketName: string = 'product-images') {
    this.bucketName = bucketName
  }

  async upload(file: File | Blob, options: UploadOptions = {}): Promise<UploadResult> {
    const supabase = createClient()

    // Session validasyonu yapmak yerine direkt deniyoruz.
    // Auth hatası olursa zaten catch bloğuna düşecek.
    // Bu, "getSessionSafe" içinde oluşabilecek sonsuz bekleme/hang durumlarını engeller.

    let user = (await supabase.auth.getUser()).data.user

    // Eğer user bulunamazsa, session'ı bir kez tazelemeyi dene
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession()
      user = session?.user || null
    }

    if (!user) {
      throw new Error('User not found in Supabase client context. Please refresh your session.')
    }
    const userId = user.id

    const fileName = options.fileName || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const filePath = options.path ? `${options.path}/${fileName}` : `${userId}/${fileName}`

    // Upload
    const { error, data: _data } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        contentType: options.contentType || file.type || 'image/jpeg',
        cacheControl: options.cacheControl || '3600',
        upsert: true,
        // AbortSignal desteği için
        // @ts-expect-error - Supabase client types may not include signal yet
        signal: options.signal,
      })

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`)
    }

    // Public URL al
    const { data: { publicUrl } } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
      metadata: {},
    }
  }

  async delete(path: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([path])

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`)
    }
  }

  getPublicUrl(path: string): string {
    const supabase = createClient()
    const { data: { publicUrl } } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path)
    return publicUrl
  }
}
