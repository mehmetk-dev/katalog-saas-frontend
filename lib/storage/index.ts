/**
 * Storage Provider Factory
 * Environment variable'a göre uygun storage provider'ı döndürür
 */

import type { StorageProvider } from './types'
import { CloudinaryProvider } from './cloudinary'
import { SupabaseProvider } from './supabase'

let storageInstance: StorageProvider | null = null

export function createStorageProvider(): StorageProvider {
  // Singleton pattern - aynı instance'ı döndür
  if (storageInstance) {
    return storageInstance
  }

  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'supabase'

  if (provider === 'cloudinary') {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error(
        'Cloudinary configuration missing! Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file.'
      )
    }

    storageInstance = new CloudinaryProvider({
      cloudName,
      uploadPreset,
    })
  } else {
    // Default: Supabase
    storageInstance = new SupabaseProvider('product-images')
  }

  return storageInstance
}

// Export singleton instance
export const storage = createStorageProvider()
