import type { Job, Processor } from 'bullmq'
import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'

export const PAYMENT_OPERATION_QUEUE_NAME = 'garanti-payment-operations'

export interface PaymentOperationQueuePayload {
    operationId: string
}

let queue: Queue<PaymentOperationQueuePayload> | null = null

export function isPaymentOperationQueueConfigured(): boolean {
    return (
        process.env.GARANTI_OPERATIONS_ENABLED === 'true' && Boolean(process.env.REDIS_URL?.trim())
    )
}

function createConnection(): IORedis {
    const redisUrl = process.env.REDIS_URL?.trim()
    if (!redisUrl) throw new Error('REDIS_URL is required for payment operations')
    return new IORedis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false })
}

function getQueue(): Queue<PaymentOperationQueuePayload> {
    if (!queue) {
        queue = new Queue(PAYMENT_OPERATION_QUEUE_NAME, {
            connection: createConnection(),
            defaultJobOptions: {
                // Financial mutations are not retried by BullMQ. The processor first
                // verifies ambiguous results with order history before any new action.
                attempts: 1,
                removeOnComplete: 500,
                removeOnFail: 1000,
            },
        })
    }
    return queue
}

export async function enqueuePaymentOperation(operationId: string): Promise<void> {
    if (!isPaymentOperationQueueConfigured()) return
    const activeQueue = getQueue()
    const existing = await activeQueue.getJob(operationId)
    if (existing) {
        const state = await existing.getState()
        if (state === 'completed' || state === 'failed') await existing.remove()
        else return
    }
    await activeQueue.add('process-garanti-operation', { operationId }, { jobId: operationId })
}

export function createPaymentOperationWorker(
    processor: Processor<PaymentOperationQueuePayload, void, string>
): Worker<PaymentOperationQueuePayload, void, string> {
    const parsed = Number(process.env.GARANTI_PAYMENT_WORKER_CONCURRENCY || 1)
    const concurrency = Number.isInteger(parsed) && parsed > 0 && parsed <= 4 ? parsed : 1
    return new Worker(PAYMENT_OPERATION_QUEUE_NAME, processor, {
        connection: createConnection(),
        concurrency,
        lockDuration: 2 * 60 * 1000,
    })
}

export type PaymentOperationBullJob = Job<PaymentOperationQueuePayload, void, string>
