"use client"

/**
 * Client-side API helpers for PDF export operations.
 *
 * Why not server actions?
 * Server actions trigger Next.js RSC re-renders for the current page.
 * During PDF export polling (every 2s), this causes the builder page's
 * server component to re-render repeatedly. If any server component
 * throws (e.g., network blip), the client gets a generic
 * "An error occurred in the Server Components render" error —
 * crashing the entire PDF export flow even though the PDF was created.
 *
 * By using direct client→backend fetch, we bypass the RSC pipeline entirely.
 */

import { getSessionSafe } from "@/lib/supabase/client"
import type { PdfExportJob, PdfExportQuality } from "@/lib/actions/pdf-export-types"

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

async function getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getSessionSafe()
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    }
    if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
    }
    if (session?.user?.id) {
        headers["x-user-id"] = session.user.id
    }
    return headers
}

async function clientFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const authHeaders = await getAuthHeaders()
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            ...authHeaders,
            ...(options.headers as Record<string, string> | undefined),
        },
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
            errorData.error || `API error ${response.status}`,
        )
    }

    if (response.status === 204) return {} as T
    return response.json()
}

// ── PDF Export Client API ────────────────────────────────────────────

export async function clientCreatePdfExportJob(
    catalogId: string,
    quality: PdfExportQuality = "standard",
): Promise<{ job: PdfExportJob; reused: boolean }> {
    return clientFetch("/pdf-exports", {
        method: "POST",
        body: JSON.stringify({ catalogId, quality }),
    })
}

export async function clientGetPdfExportJob(
    id: string,
): Promise<{ job: PdfExportJob }> {
    return clientFetch(`/pdf-exports/${id}`)
}

export async function clientCancelPdfExportJob(
    id: string,
): Promise<{ job: PdfExportJob }> {
    return clientFetch(`/pdf-exports/${id}`, { method: "DELETE" })
}

export async function clientListPdfExportJobs(): Promise<{ jobs: PdfExportJob[] }> {
    return clientFetch("/pdf-exports")
}

export async function clientGetPdfExportShareLink(
    id: string,
): Promise<{ url: string; expiresAt: string }> {
    return clientFetch(`/pdf-exports/${id}/share-link`)
}
