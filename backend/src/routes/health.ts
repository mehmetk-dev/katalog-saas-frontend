import { Router } from 'express';

import { supabase } from '../services/supabase';
import { redis } from '../services/redis';

const router = Router();

// ... (HealthStatus interface)

// GET /health - Basic health check
router.get('/', async (req, res) => {
    let dbStatus = false;
    let redisStatus = false;

    try {
        // Quick DB check
        const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
        dbStatus = !error;
    } catch {
        dbStatus = false;
    }

    try {
        // Quick Redis check
        if (redis) {
            const pong = await redis.ping();
            redisStatus = pong === 'PONG';
        }
    } catch {
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
    } catch {
        res.status(503).json({ ready: false, error: 'Service not ready' });
    }
});

// GET /health/live - Liveness check (for Kubernetes)
router.get('/live', (req, res) => {
    // Simple check - if we can respond, we're alive
    res.status(200).json({ alive: true });
});

export default router;
