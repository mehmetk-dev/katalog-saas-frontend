export type PdfExportTrackingStatus = "queued" | "processing" | "completed" | "failed" | "cancelled" | "expired"

export type PdfExportTrackingStage =
    | "queued"
    | "preparing"
    | "rendering"
    | "generating"
    | "uploading"
    | "done"
    | "error"
    | "cancelled"

export interface PdfExportProgressInput {
    status: PdfExportTrackingStatus
    progress: number
    error_message?: string | null
}

export interface PdfExportProgressDisplay {
    stage: PdfExportTrackingStage
    title: string
    description: string
    percent: number
    isActive: boolean
}

function clampPercent(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(100, Math.round(value)))
}

export function getPdfExportProgressDisplay(job: PdfExportProgressInput): PdfExportProgressDisplay {
    const percent = clampPercent(job.progress)

    if (job.status === "queued") {
        return {
            stage: "queued",
            title: "Sırada",
            description: "PDF işi worker kuyruğuna alındı.",
            percent,
            isActive: true,
        }
    }

    if (job.status === "completed") {
        return {
            stage: "done",
            title: "Hazır",
            description: "PDF hazır, indirebilirsin.",
            percent: 100,
            isActive: false,
        }
    }

    if (job.status === "failed") {
        return {
            stage: "error",
            title: "PDF oluşturulamadı",
            description: job.error_message || "Worker PDF işini tamamlayamadı.",
            percent,
            isActive: false,
        }
    }

    if (job.status === "cancelled" || job.status === "expired") {
        return {
            stage: "cancelled",
            title: job.status === "expired" ? "Süresi doldu" : "İptal edildi",
            description: job.status === "expired" ? "PDF indirme süresi doldu." : "PDF işi iptal edildi.",
            percent,
            isActive: false,
        }
    }

    if (percent >= 90) {
        return {
            stage: "uploading",
            title: "Yükleniyor",
            description: "PDF dosyası güvenli depolamaya yükleniyor.",
            percent,
            isActive: true,
        }
    }

    if (percent >= 65) {
        return {
            stage: "generating",
            title: "PDF oluşturuluyor",
            description: "Render edilen katalog PDF dosyasına çevriliyor.",
            percent,
            isActive: true,
        }
    }

    if (percent >= 25) {
        return {
            stage: "rendering",
            title: "Katalog render ediliyor",
            description: "Katalog sayfaları tarayıcıda hazırlanıyor.",
            percent,
            isActive: true,
        }
    }

    return {
        stage: "preparing",
        title: "Hazırlanıyor",
        description: "Worker katalog verilerini ve render ekranını hazırlıyor.",
        percent,
        isActive: true,
    }
}
