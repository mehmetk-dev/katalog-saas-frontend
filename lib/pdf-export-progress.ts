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

export type ProgressTranslate = (key: string) => string

export function getPdfExportProgressDisplay(job: PdfExportProgressInput, t: ProgressTranslate): PdfExportProgressDisplay {
    const percent = clampPercent(job.progress)

    if (job.status === "queued") {
        return {
            stage: "queued",
            title: t("pdf.progressQueuedTitle"),
            description: t("pdf.progressQueuedDesc"),
            percent,
            isActive: true,
        }
    }

    if (job.status === "completed") {
        return {
            stage: "done",
            title: t("pdf.stageReady"),
            description: t("pdf.stageReadyDesc"),
            percent: 100,
            isActive: false,
        }
    }

    if (job.status === "failed") {
        return {
            stage: "error",
            title: t("pdf.phraseError"),
            description: job.error_message || t("pdf.progressFailedDesc"),
            percent,
            isActive: false,
        }
    }

    if (job.status === "cancelled" || job.status === "expired") {
        return {
            stage: "cancelled",
            title: job.status === "expired" ? t("pdf.progressExpiredTitle") : t("pdf.progressCancelledTitle"),
            description: job.status === "expired" ? t("pdf.progressExpiredDesc") : t("pdf.progressCancelledDesc"),
            percent,
            isActive: false,
        }
    }

    if (percent >= 90) {
        return {
            stage: "uploading",
            title: t("pdf.stageUploading"),
            description: t("pdf.progressUploadingDesc"),
            percent,
            isActive: true,
        }
    }

    if (percent >= 65) {
        return {
            stage: "generating",
            title: t("pdf.progressGeneratingTitle"),
            description: t("pdf.progressGeneratingDesc"),
            percent,
            isActive: true,
        }
    }

    if (percent >= 25) {
        return {
            stage: "rendering",
            title: t("pdf.progressRenderingTitle"),
            description: t("pdf.progressRenderingDesc"),
            percent,
            isActive: true,
        }
    }

    return {
        stage: "preparing",
        title: t("pdf.progressPreparingTitle"),
        description: t("pdf.progressPreparingDesc"),
        percent,
        isActive: true,
    }
}
