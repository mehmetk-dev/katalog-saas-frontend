// path import removed as it was unused

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import client from 'prom-client';

import { initRedis } from './services/redis';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Cloudflare veya Docker arkasında olduğun için gerçek IP'yi görmesini sağlar.
app.set('trust proxy', 1);

// Varsayılan metrikleri (CPU, RAM vb.) toplamaya başla
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Allowed origins for CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

// Rate limiting configuration - higher limit for development
const isDev = process.env.NODE_ENV !== 'production';
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 10000 : 1000, // Increased: 10000 for dev, 1000 for production
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth rate limiter - stricter limits for login/signup to prevent brute-force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 100 : 10, // 10 attempts per 15 min in production
    message: { error: 'Too many login attempts, please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests without origin (server-to-server, SSR, mobile apps, curl)
        // Next.js server-side requests don't send Origin header
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Log rejected origins for debugging
            console.warn(`CORS rejected origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet({
    contentSecurityPolicy: isDev ? false : undefined, // Disable CSP in dev for easier debugging
    crossOriginEmbedderPolicy: false, // Allow embedding for catalog previews
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin image loading
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xContentTypeOptions: true, // nosniff
    xDnsPrefetchControl: { allow: false },
    xDownloadOptions: true, // noopen
    xFrameOptions: { action: 'deny' }, // Prevent clickjacking
    xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
    xPoweredBy: false, // Remove X-Powered-By header
    xXssProtection: true, // Enable XSS filter
}));
app.use(morgan('dev'));
app.use(compression()); // gzip/brotli response compression
app.use(express.json({ limit: '10mb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Prometheus'un verileri okuyacağı endpoint
app.get('/metrics', async (req: Request, res: Response) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Katalog SaaS Backend API is running 🚀', timestamp: new Date() });
});

import productRoutes from './routes/products';
import catalogRoutes from './routes/catalogs';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import healthRoutes from './routes/health';
import notificationRoutes from './routes/notifications';
import authRoutes from './routes/auth';

// Health check routes (no auth required)
app.use('/health', healthRoutes);

// Public auth routes (no auth required) - with stricter rate limiting for brute-force protection
app.use('/api/v1/auth', authLimiter, authRoutes);

// API Routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/catalogs', catalogRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Initialize Redis (optional - works without it)
initRedis();

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on port ${PORT} 🚀`);
});
