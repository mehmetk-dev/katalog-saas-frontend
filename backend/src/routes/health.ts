import { Router } from 'express';

const router = Router();

interface HealthStatus {
    status: 'ok' | 'degraded' | 'error';
    timestamp: string;
    uptime: number;
    version: string;
    checks: {
        database: boolean;
        redis: boolean;
    };
}

// GET /health - Basic health check
router.get('/', (req, res) => {
    const health: HealthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        checks: {
            database: true, // Will be updated by actual check
            redis: true,    // Will be updated by actual check
        }
    };

    res.json(health);
});

// GET /health/ready - Readiness check (for Kubernetes)
router.get('/ready', async (req, res) => {
    try {
        // Check if app is ready to receive traffic
        // Add your readiness checks here (DB connection, etc.)
        res.status(200).json({ ready: true });
    } catch (error) {
        res.status(503).json({ ready: false, error: 'Service not ready' });
    }
});

// GET /health/live - Liveness check (for Kubernetes)
router.get('/live', (req, res) => {
    // Simple check - if we can respond, we're alive
    res.status(200).json({ alive: true });
});

export default router;
