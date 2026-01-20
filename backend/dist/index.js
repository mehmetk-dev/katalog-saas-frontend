"use strict";
const __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const redis_1 = require("./services/redis");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Allowed origins for CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];
// Rate limiting configuration - higher limit for development
const isDev = process.env.NODE_ENV !== 'production';
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 1000 : 100, // 1000 for dev, 100 for production
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Stricter rate limit for auth endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth requests per windowMs
    message: { error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
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
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' })); // Limit body size
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
// Public auth routes (no auth required)
app.use('/api/v1/auth', auth_1.default);
// API Routes
app.use('/api/v1/products', products_1.default);
app.use('/api/v1/catalogs', catalogs_1.default);
app.use('/api/v1/users', users_1.default);
app.use('/api/v1/admin', admin_1.default);
app.use('/api/v1/notifications', notifications_1.default);
// Initialize Redis (optional - works without it)
(0, redis_1.initRedis)();
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🚀`);
});
