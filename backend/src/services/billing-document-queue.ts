import { Job, Processor, Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'

export const BILLING_DOCUMENT_QUEUE_NAME = 'billing-document'

export interface BillingDocumentQueuePayload {
    documentId: string
    userId: string
}

let queue: Queue<BillingDocumentQueuePayload> | null = null

export function isBillingDocumentQueueConfigured(): boolean {
    return Boolean(process.env.REDIS_URL?.trim())
}

function createBullConnection(): IORedis {
    const redisUrl = process.env.REDIS_URL?.trim()
    if (!redisUrl) {
        throw new Error('REDIS_URL is required for billing document queue')
    }

    return new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    })
}

function getBillingDocumentQueue(): Queue<BillingDocumentQueuePayload> {
    if (!queue) {
        queue = new Queue<BillingDocumentQueuePayload>(BILLING_DOCUMENT_QUEUE_NAME, {
            connection: createBullConnection(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 60_000 },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
        })
    }
    return queue
}

export async function enqueueBillingDocument(payload: BillingDocumentQueuePayload): Promise<void> {
    const billingDocumentQueue = getBillingDocumentQueue()
    const existingJob = await billingDocumentQueue.getJob(payload.documentId)

    if (existingJob) {
        const state = await existingJob.getState()
        if (state === 'failed' || state === 'completed') {
            await existingJob.remove()
        } else {
            return
        }
    }

    await billingDocumentQueue.add('render-payment-receipt', payload, {
        jobId: payload.documentId,
    })
}

export function createBillingDocumentWorker(
    processor: Processor<BillingDocumentQueuePayload, void, string>
): Worker<BillingDocumentQueuePayload, void, string> {
    const configuredConcurrency = Number(process.env.BILLING_DOCUMENT_WORKER_CONCURRENCY || 1)
    const concurrency =
        Number.isFinite(configuredConcurrency) && configuredConcurrency > 0
            ? configuredConcurrency
            : 1

    return new Worker<BillingDocumentQueuePayload, void, string>(
        BILLING_DOCUMENT_QUEUE_NAME,
        processor,
        {
            connection: createBullConnection(),
            concurrency,
            lockDuration: 10 * 60 * 1000,
        }
    )
}

export type BillingDocumentBullJob = Job<BillingDocumentQueuePayload, void, string>
