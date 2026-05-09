"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    clientCancelPdfExportJob,
    clientGetPdfExportShareLink,
    clientListPdfExportJobs,
} from "@/lib/hooks/pdf-export-client-api"
import { queryKeys } from "@/lib/contexts/query-provider"

export function usePdfExportJobs() {
    return useQuery({
        queryKey: queryKeys.pdfExports(),
        queryFn: () => clientListPdfExportJobs(),
        staleTime: 5 * 1000,
        refetchInterval: 5_000,
        refetchOnWindowFocus: true,
    })
}

export function usePdfExportShareLink(jobId: string | null | undefined) {
    return useQuery({
        queryKey: jobId ? queryKeys.pdfExportShareLink(jobId) : ["pdf-exports", "share-link", "none"],
        queryFn: () => clientGetPdfExportShareLink(jobId as string),
        enabled: Boolean(jobId),
        staleTime: 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
