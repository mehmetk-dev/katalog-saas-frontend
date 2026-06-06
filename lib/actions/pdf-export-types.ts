export type PdfExportStatus = "queued" | "processing" | "completed" | "failed" | "cancelled" | "expired"
export type PdfExportQuality = "standard" | "high"

export interface PdfExportJob {
  id: string
  user_id: string
  catalog_id: string
  status: PdfExportStatus
  quality: PdfExportQuality
  progress: number
  page_count: number | null
  file_path: string | null
  file_size_bytes: number | null
  error_message: string | null
  attempts: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  expires_at: string | null
}
