"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BILLING_DOCUMENT_QUEUE_NAME = void 0;
exports.isBillingDocumentQueueConfigured = isBillingDocumentQueueConfigured;
exports.enqueueBillingDocument = enqueueBillingDocument;
exports.createBillingDocumentWorker = createBillingDocumentWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
exports.BILLING_DOCUMENT_QUEUE_NAME = 'billing-document';
let queue = null;
function isBillingDocumentQueueConfigured() {
    return Boolean(process.env.REDIS_URL?.trim());
}
function createBullConnection() {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (!redisUrl) {
        throw new Error('REDIS_URL is required for billing document queue');
    }
    return new ioredis_1.default(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
}
function getBillingDocumentQueue() {
    if (!queue) {
        queue = new bullmq_1.Queue(exports.BILLING_DOCUMENT_QUEUE_NAME, {
            connection: createBullConnection(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 60000 },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
        });
    }
    return queue;
}
async function enqueueBillingDocument(payload) {
    const billingDocumentQueue = getBillingDocumentQueue();
    const existingJob = await billingDocumentQueue.getJob(payload.documentId);
    if (existingJob) {
        const state = await existingJob.getState();
        if (state === 'failed' || state === 'completed') {
            await existingJob.remove();
        }
        else {
            return;
        }
    }
    await billingDocumentQueue.add('render-payment-receipt', payload, {
        jobId: payload.documentId,
    });
}
function createBillingDocumentWorker(processor) {
    const configuredConcurrency = Number(process.env.BILLING_DOCUMENT_WORKER_CONCURRENCY || 1);
    const concurrency = Number.isFinite(configuredConcurrency) && configuredConcurrency > 0
        ? configuredConcurrency
        : 1;
    return new bullmq_1.Worker(exports.BILLING_DOCUMENT_QUEUE_NAME, processor, {
        connection: createBullConnection(),
        concurrency,
        lockDuration: 10 * 60 * 1000,
    });
}
