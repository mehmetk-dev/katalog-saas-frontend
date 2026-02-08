import { Router, Request, Response } from 'express';

import { supabase } from '../services/supabase';
import { redis } from '../services/redis';

const router = Router();

// GET /health - Basic health check (Optimized: No DB query)
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// GET /health/full - Full health check with DB and Redis checks
router.get('/full', async (req: Request, res: Response) => {
    let dbStatus = false;
    let redisStatus = false;

    try {
        const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
        dbStatus = !error;
    } catch {
        dbStatus = false;
    }

    try {
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
        checks: {
            database: dbStatus,
            redis: redisStatus,
        }
    };

    res.status(health.status === 'error' ? 503 : 200).json(health);
});

// GET /health/ready - Readiness check (for Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
    try {
        // Check if app is ready to receive traffic
        // Add your readiness checks here (DB connection, etc.)
        res.status(200).json({ ready: true });
    } catch {
        res.status(503).json({ ready: false, error: 'Service not ready' });
    }
});

// GET /health/live - Liveness check (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
    // Simple check - if we can respond, we're alive
    res.status(200).json({ alive: true });
});

export default router;
