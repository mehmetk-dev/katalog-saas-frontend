"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDF_EXPORT_QUEUE_NAME = void 0;
exports.isPdfExportQueueConfigured = isPdfExportQueueConfigured;
exports.getPdfExportQueue = getPdfExportQueue;
exports.enqueuePdfExportJob = enqueuePdfExportJob;
exports.removePdfExportQueueJob = removePdfExportQueueJob;
exports.createPdfExportWorker = createPdfExportWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
exports.PDF_EXPORT_QUEUE_NAME = 'pdf-export';
let queue = null;
function isPdfExportQueueConfigured() {
    return Boolean(process.env.REDIS_URL?.trim());
}
function createBullConnection() {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (!redisUrl) {
        throw new Error('REDIS_URL is required for PDF export queue');
    }
    return new ioredis_1.default(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
}
function getPdfExportQueue() {
    if (!queue) {
        queue = new bullmq_1.Queue(exports.PDF_EXPORT_QUEUE_NAME, {
            connection: createBullConnection(),
            defaultJobOptions: {
                attempts: 2,
                backoff: { type: 'exponential', delay: 30000 },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
        });
    }
    return queue;
}
async function enqueuePdfExportJob(payload) {
    await getPdfExportQueue().add('render-catalog-pdf', payload, {
        jobId: payload.jobId,
    });
}
async function removePdfExportQueueJob(jobId) {
    const queuedJob = await getPdfExportQueue().getJob(jobId);
    await queuedJob?.remove();
}
function createPdfExportWorker(processor) {
    const concurrency = Number(process.env.PDF_EXPORT_WORKER_CONCURRENCY || 1);
    return new bullmq_1.Worker(exports.PDF_EXPORT_QUEUE_NAME, processor, {
        connection: createBullConnection(),
        concurrency: Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 1,
        lockDuration: 10 * 60 * 1000,
    });
}
