import { Job, Processor, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

export const PDF_EXPORT_QUEUE_NAME = 'pdf-export';

export interface PdfExportQueuePayload {
    jobId: string;
    userId: string;
    catalogId: string;
    quality: 'standard' | 'high';
}

let queue: Queue<PdfExportQueuePayload> | null = null;

export function isPdfExportQueueConfigured(): boolean {
    return Boolean(process.env.REDIS_URL?.trim());
}

function createBullConnection(): IORedis {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (!redisUrl) {
        throw new Error('REDIS_URL is required for PDF export queue');
    }

    return new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
}

export function getPdfExportQueue(): Queue<PdfExportQueuePayload> {
    if (!queue) {
        queue = new Queue<PdfExportQueuePayload>(PDF_EXPORT_QUEUE_NAME, {
            connection: createBullConnection(),
            defaultJobOptions: {
                attempts: 2,
                backoff: { type: 'exponential', delay: 30_000 },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
        });
    }
    return queue;
}

export async function enqueuePdfExportJob(payload: PdfExportQueuePayload): Promise<void> {
    await getPdfExportQueue().add('render-catalog-pdf', payload, {
        jobId: payload.jobId,
    });
}

export async function removePdfExportQueueJob(jobId: string): Promise<void> {
    const queuedJob = await getPdfExportQueue().getJob(jobId);
    await queuedJob?.remove();
}

export function createPdfExportWorker(
    processor: Processor<PdfExportQueuePayload, void, string>,
): Worker<PdfExportQueuePayload, void, string> {
    const concurrency = Number(process.env.PDF_EXPORT_WORKER_CONCURRENCY || 1);
    return new Worker<PdfExportQueuePayload, void, string>(PDF_EXPORT_QUEUE_NAME, processor, {
        connection: createBullConnection(),
        concurrency: Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 1,
        lockDuration: 10 * 60 * 1000,
    });
}

export type PdfExportBullJob = Job<PdfExportQueuePayload, void, string>;
