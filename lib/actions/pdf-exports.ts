"use server"

import { apiFetch } from "@/lib/api"
import type { PdfExportJob, PdfExportQuality } from "./pdf-export-types"

export type { PdfExportStatus, PdfExportQuality, PdfExportJob } from "./pdf-export-types"

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
