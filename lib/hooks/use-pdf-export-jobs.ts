"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    cancelPdfExportJob,
    getPdfExportShareLink,
    listPdfExportJobs,
} from "@/lib/actions/pdf-exports"
import { queryKeys } from "@/lib/contexts/query-provider"

export function usePdfExportJobs() {
    return useQuery({
        queryKey: queryKeys.pdfExports(),
        queryFn: () => listPdfExportJobs(),
        staleTime: 5 * 1000,
        refetchInterval: 5_000,
        refetchOnWindowFocus: true,
    })
}

export function usePdfExportShareLink(jobId: string | null | undefined) {
    return useQuery({
        queryKey: jobId ? queryKeys.pdfExportShareLink(jobId) : ["pdf-exports", "share-link", "none"],
        queryFn: () => getPdfExportShareLink(jobId as string),
        enabled: Boolean(jobId),
        staleTime: 60 * 1000,
        retry: false,
    })
}

export function useCancelPdfExportJob() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (jobId: string) => cancelPdfExportJob(jobId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.pdfExports() })
        },
    })
}
