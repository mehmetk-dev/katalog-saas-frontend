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
                backoff: { type: 'exponential', delay: 60_000 },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
        });
    }
    return queue;
}

const QUEUE_OPERATION_TIMEOUT_MS = 10_000;

/**
 * BullMQ bağlantısı maxRetriesPerRequest: null ile kurulu; Redis erişilemezse komutlar süresiz bekler.
 * API isteği asılı kalmasın diye kuyruk işlemlerine süre sınırı konur.
 */
async function withQueueTimeout<T>(operation: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('PDF export queue did not respond in time')), QUEUE_OPERATION_TIMEOUT_MS);
    });
    try {
        return await Promise.race([operation, timeout]);
    } finally {
        clearTimeout(timer);
    }
}

export async function enqueuePdfExportJob(payload: PdfExportQueuePayload): Promise<void> {
    await withQueueTimeout(getPdfExportQueue().add('render-catalog-pdf', payload, { jobId: payload.jobId }));
}

export async function removePdfExportQueueJob(jobId: string): Promise<void> {
    const queuedJob = await withQueueTimeout(getPdfExportQueue().getJob(jobId));
    // İşlenmekte olan (kilitli) iş kaldırılamaz; worker DB durumundan iptali kendisi fark eder
    await withQueueTimeout(queuedJob?.remove() ?? Promise.resolve());
}

export function createPdfExportWorker(
    processor: Processor<PdfExportQueuePayload, void, string>,
): Worker<PdfExportQueuePayload, void, string> {
    const concurrency = Number(process.env.PDF_EXPORT_WORKER_CONCURRENCY || 1);
    return new Worker<PdfExportQueuePayload, void, string>(PDF_EXPORT_QUEUE_NAME, processor, {
        connection: createBullConnection(),
        concurrency: Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 1,
        lockDuration: 30 * 60 * 1000,
    });
}

export type PdfExportBullJob = Job<PdfExportQueuePayload, void, string>;
