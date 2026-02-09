"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../services/supabase");
const redis_1 = require("../services/redis");
const router = (0, express_1.Router)();
// GET /health - Basic health check (Optimized: No DB query)
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// GET /health/full - Full health check with DB and Redis checks
router.get('/full', async (req, res) => {
    let dbStatus = false;
    let redisStatus = false;
    try {
        const { error } = await supabase_1.supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
        dbStatus = !error;
    }
    catch {
        dbStatus = false;
    }
    try {
        if (redis_1.redis) {
            const pong = await redis_1.redis.ping();
            redisStatus = pong === 'PONG';
        }
    }
    catch {
        redisStatus = false;
    }
    const health = {
        status: dbStatus && redisStatus ? 'ok' : (dbStatus || redisStatus ? 'degraded' : 'error'),
        timestamp: new Date().toISOString(),
        checks: {
            database: dbStatus,
            redis: redisStatus,
        }
    };
    res.status(health.status === 'error' ? 503 : 200).json(health);
});
// GET /health/ready - Readiness check (for Kubernetes)
router.get('/ready', async (req, res) => {
    try {
        // Check if app is ready to receive traffic
        // Add your readiness checks here (DB connection, etc.)
        res.status(200).json({ ready: true });
    }
    catch {
        res.status(503).json({ ready: false, error: 'Service not ready' });
    }
});
// GET /health/live - Liveness check (for Kubernetes)
router.get('/live', (req, res) => {
    // Simple check - if we can respond, we're alive
    res.status(200).json({ alive: true });
});
exports.default = router;
