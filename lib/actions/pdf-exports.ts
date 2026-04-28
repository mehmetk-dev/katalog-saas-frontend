"use server"

import { apiFetch } from "@/lib/api"

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
  created_at: string
  updated_at: string
  expires_at: string | null
}

export async function createPdfExportJob(
  catalogId: string,
  quality: PdfExportQuality = "standard",
): Promise<{ job: PdfExportJob; reused: boolean }> {
  return apiFetch("/pdf-exports", {
    method: "POST",
    body: JSON.stringify({ catalogId, quality }),
    timeout: 30_000,
  })
}

export async function listPdfExportJobs(): Promise<{ jobs: PdfExportJob[] }> {
  return apiFetch("/pdf-exports")
}

export async function getPdfExportJob(id: string): Promise<{ job: PdfExportJob }> {
  return apiFetch(`/pdf-exports/${id}`)
}

export async function cancelPdfExportJob(id: string): Promise<{ job: PdfExportJob }> {
  return apiFetch(`/pdf-exports/${id}`, {
    method: "DELETE",
  })
}

export async function getPdfExportShareLink(id: string): Promise<{ url: string; expiresAt: string }> {
  return apiFetch(`/pdf-exports/${id}/share-link`)
}
