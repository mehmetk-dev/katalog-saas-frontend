"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    clientCancelPdfExportJob,
    clientGetPdfExportShareLink,
    clientListPdfExportJobs,
} from "@/lib/hooks/pdf-export-client-api"
import { queryKeys } from "@/lib/contexts/query-provider"

const PDF_EXPORT_POLL_INTERVAL = 3_000
const PDF_EXPORT_ACTIVE_POLL_INTERVAL = 2_000

function getActiveJobCount(jobs: { status: string }[]): number {
    return jobs.filter((j) => j.status === "queued" || j.status === "processing").length
}

export function usePdfExportJobs() {
    const query = useQuery({
        queryKey: queryKeys.pdfExports(),
        queryFn: () => clientListPdfExportJobs(),
        staleTime: 10_000,
        refetchInterval: (query) => {
            const jobs = query.state.data?.jobs
            if (!jobs) return PDF_EXPORT_POLL_INTERVAL
            const activeCount = getActiveJobCount(jobs)
            if (activeCount > 0) return PDF_EXPORT_ACTIVE_POLL_INTERVAL
            return PDF_EXPORT_POLL_INTERVAL
        },
        refetchOnWindowFocus: true,
    })
    return query
}

export function usePdfExportShareLink(jobId: string | null | undefined) {
    return useQuery({
        queryKey: jobId ? queryKeys.pdfExportShareLink(jobId) : ["pdf-exports", "share-link", "none"],
        queryFn: () => clientGetPdfExportShareLink(jobId as string),
        enabled: Boolean(jobId),
        staleTime: 2 * 60 * 1000,
        retry: 2,
        retryDelay: 2000,
        refetchOnWindowFocus: false,
    })
}

export function useCancelPdfExportJob() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (jobId: string) => clientCancelPdfExportJob(jobId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.pdfExports() })
        },
    })
}
