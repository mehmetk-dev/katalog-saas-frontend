"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_OPERATION_QUEUE_NAME = void 0;
exports.isPaymentOperationQueueConfigured = isPaymentOperationQueueConfigured;
exports.enqueuePaymentOperation = enqueuePaymentOperation;
exports.createPaymentOperationWorker = createPaymentOperationWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
exports.PAYMENT_OPERATION_QUEUE_NAME = 'garanti-payment-operations';
let queue = null;
function isPaymentOperationQueueConfigured() {
    return (process.env.GARANTI_OPERATIONS_ENABLED === 'true' && Boolean(process.env.REDIS_URL?.trim()));
}
function createConnection() {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (!redisUrl)
        throw new Error('REDIS_URL is required for payment operations');
    return new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false });
}
function getQueue() {
    if (!queue) {
        queue = new bullmq_1.Queue(exports.PAYMENT_OPERATION_QUEUE_NAME, {
            connection: createConnection(),
            defaultJobOptions: {
                // Financial mutations are not retried by BullMQ. The processor first
                // verifies ambiguous results with order history before any new action.
                attempts: 1,
                removeOnComplete: 500,
                removeOnFail: 1000,
            },
        });
    }
    return queue;
}
async function enqueuePaymentOperation(operationId) {
    if (!isPaymentOperationQueueConfigured())
        return;
    const activeQueue = getQueue();
    const existing = await activeQueue.getJob(operationId);
    if (existing) {
        const state = await existing.getState();
        if (state === 'completed' || state === 'failed')
            await existing.remove();
        else
            return;
    }
    await activeQueue.add('process-garanti-operation', { operationId }, { jobId: operationId });
}
function createPaymentOperationWorker(processor) {
    const parsed = Number(process.env.GARANTI_PAYMENT_WORKER_CONCURRENCY || 1);
    const concurrency = Number.isInteger(parsed) && parsed > 0 && parsed <= 4 ? parsed : 1;
    return new bullmq_1.Worker(exports.PAYMENT_OPERATION_QUEUE_NAME, processor, {
        connection: createConnection(),
        concurrency,
        lockDuration: 2 * 60 * 1000,
    });
}
