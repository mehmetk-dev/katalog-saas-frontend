"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../services/supabase");
const redis_1 = require("../services/redis");
const router = (0, express_1.Router)();
// ... (HealthStatus interface)
// GET /health - Basic health check
router.get('/', async (req, res) => {
    let dbStatus = false;
    let redisStatus = false;
    try {
        // Quick DB check
        const { error } = await supabase_1.supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
        dbStatus = !error;
    }
    catch (e) {
        dbStatus = false;
    }
    try {
        // Quick Redis check
        if (redis_1.redis) {
            const pong = await redis_1.redis.ping();
            redisStatus = pong === 'PONG';
        }
    }
    catch (e) {
        redisStatus = false;
    }
    const health = {
        status: dbStatus && redisStatus ? 'ok' : (dbStatus || redisStatus ? 'degraded' : 'error'),
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
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
    catch (error) {
        res.status(503).json({ ready: false, error: 'Service not ready' });
    }
});
// GET /health/live - Liveness check (for Kubernetes)
router.get('/live', (req, res) => {
    // Simple check - if we can respond, we're alive
    res.status(200).json({ alive: true });
});
exports.default = router;
