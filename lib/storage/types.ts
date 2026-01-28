/**
 * Storage Provider Types
 * Farklı storage provider'lar için ortak interface
 */

export interface UploadOptions {
  path?: string
  fileName?: string
  contentType?: string
  cacheControl?: string
  signal?: AbortSignal
}

export interface UploadResult {
  url: string
  path: string
  metadata?: {
    version?: number
    width?: number
    height?: number
    bytes?: number
    format?: string
  }
}

export interface StorageProvider {
  upload(file: File | Blob, options?: UploadOptions): Promise<UploadResult>
  delete(path: string): Promise<void>
  getPublicUrl(path: string): string
}
