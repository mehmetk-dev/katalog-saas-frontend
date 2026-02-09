"use strict";
// path import removed as it was unused
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const prom_client_1 = __importDefault(require("prom-client"));
const redis_1 = require("./services/redis");
const errorHandler_1 = require("./middlewares/errorHandler");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Cloudflare veya Docker arkasında olduğun için gerçek IP'yi görmesini sağlar.
app.set('trust proxy', 1);
// Varsayılan metrikleri (CPU, RAM vb.) toplamaya başla
const collectDefaultMetrics = prom_client_1.default.collectDefaultMetrics;
collectDefaultMetrics({ register: prom_client_1.default.register });
// Allowed origins for CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];
// Rate limiting configuration - higher limit for development
const isDev = process.env.NODE_ENV !== 'production';
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 10000 : 1000, // Increased: 10000 for dev, 1000 for production
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Auth rate limiter - stricter limits for login/signup to prevent brute-force attacks
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 100 : 10, // 10 attempts per 15 min in production
    message: { error: 'Too many login attempts, please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});
// Middleware
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests without origin (server-to-server, SSR, mobile apps, curl)
        // Next.js server-side requests don't send Origin header
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            // Log rejected origins for debugging
            console.warn(`CORS rejected origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, helmet_1.default)({
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
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' })); // Limit body size
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Prometheus'un verileri okuyacağı endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', prom_client_1.default.register.contentType);
        res.end(await prom_client_1.default.register.metrics());
    }
    catch (err) {
        res.status(500).end(err);
    }
});
// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Katalog SaaS Backend API is running 🚀', timestamp: new Date() });
});
const products_1 = __importDefault(require("./routes/products"));
const catalogs_1 = __importDefault(require("./routes/catalogs"));
const users_1 = __importDefault(require("./routes/users"));
const admin_1 = __importDefault(require("./routes/admin"));
const health_1 = __importDefault(require("./routes/health"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const auth_1 = __importDefault(require("./routes/auth"));
// Health check routes (no auth required)
app.use('/health', health_1.default);
// Public auth routes (no auth required) - with stricter rate limiting for brute-force protection
app.use('/api/v1/auth', authLimiter, auth_1.default);
// API Routes
app.use('/api/v1/products', products_1.default);
app.use('/api/v1/catalogs', catalogs_1.default);
app.use('/api/v1/users', users_1.default);
app.use('/api/v1/admin', admin_1.default);
app.use('/api/v1/notifications', notifications_1.default);
// Initialize Redis (optional - works without it)
(0, redis_1.initRedis)();
// 404 handler for undefined routes
app.use(errorHandler_1.notFoundHandler);
// Global error handler (must be last middleware)
app.use(errorHandler_1.errorHandler);
// Start Server
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on port ${PORT} 🚀`);
});
