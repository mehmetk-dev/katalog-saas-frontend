import type { PdfExportStatus } from "@/lib/actions/pdf-export-types"

/**
 * Yayınlanmış katalog sayfasının PDF uç noktaları. Giriş gerektirmez; backend iş başına
 * imzalı bir token döner, durum sorgusu ve indirme bu token ile yapılır.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "")

export interface PublicPdfExportJob {
    id: string
    status: PdfExportStatus
    progress: number
    page_count: number | null
    error_message: string | null
}

export class PublicPdfExportError extends Error {
    constructor(message: string, readonly status: number, readonly code?: string) {
        super(message)
        this.name = "PublicPdfExportError"
    }
}

async function request<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers },
        cache: "no-store",
    })
    if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new PublicPdfExportError(data.error || `API error ${response.status}`, response.status, data.code)
    }
    return response.json()
}

export function createPublicPdfExport(slug: string): Promise<{ job: PublicPdfExportJob; token: string; reused: boolean }> {
    return request("/pdf-exports/public", { method: "POST", body: JSON.stringify({ slug }) })
}

export function getPublicPdfExport(id: string, token: string): Promise<{ job: PublicPdfExportJob }> {
    return request(`/pdf-exports/public/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`)
}

export function getPublicPdfDownloadUrl(id: string, token: string): string {
    return `${API_BASE}/pdf-exports/${encodeURIComponent(id)}/public-download?token=${encodeURIComponent(token)}`
}
