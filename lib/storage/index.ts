/**
 * Storage Provider Factory
 * Environment variable'a göre uygun storage provider'ı döndürür
 * 
 * ÖNEMLİ: 
 * - NEXT_PUBLIC_ prefix'li env var'lar build zamanında bundle'a girer
 * - Production'da env var değiştirirseniz yeniden build gerekir
 * - Client-side'da çalıştığı için NEXT_PUBLIC_ prefix zorunlu
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
      // Detaylı hata mesajı ve debug bilgisi
      const debugInfo = {
        provider,
        cloudName: cloudName ? '✓ SET' : '✗ MISSING',
        uploadPreset: uploadPreset ? '✓ SET' : '✗ MISSING',
        envCheck: {
          NEXT_PUBLIC_STORAGE_PROVIDER: process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'NOT SET (defaults to supabase)',
          NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
          NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ? 'SET' : 'MISSING',
        }
      }

      console.error('[Storage] ❌ Cloudinary configuration missing!')
      console.error('[Storage] Debug info:', debugInfo)

      throw new Error(
        'Cloudinary configuration missing!\n\n' +
        'Please set the following environment variables in your hosting platform:\n' +
        '- NEXT_PUBLIC_STORAGE_PROVIDER=cloudinary\n' +
        '- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name\n' +
        '- NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name\n\n' +
        'Current status:\n' +
        `- Provider: ${debugInfo.envCheck.NEXT_PUBLIC_STORAGE_PROVIDER}\n` +
        `- Cloud Name: ${debugInfo.cloudName}\n` +
        `- Upload Preset: ${debugInfo.uploadPreset}\n\n` +
        '⚠️ IMPORTANT: After setting env vars, you MUST rebuild and redeploy!\n' +
        'NEXT_PUBLIC_ variables are bundled at build time.'
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

// Lazy singleton getter — avoids throwing at module import time.
// The provider is only created when first accessed, not when the module is imported.
export function getStorage(): StorageProvider {
  return createStorageProvider()
}

// Backward-compatible named export using a getter (lazy initialization)
// This ensures importing this module never throws — the error only happens
// when `storage` is actually accessed without proper env vars.
let _lazyStorage: StorageProvider | undefined
export const storage: StorageProvider = new Proxy({} as StorageProvider, {
  get(_target, prop, receiver) {
    if (!_lazyStorage) {
      _lazyStorage = createStorageProvider()
    }
    return Reflect.get(_lazyStorage, prop, receiver)
  }
})
