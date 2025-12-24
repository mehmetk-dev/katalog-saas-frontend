import path from 'path';

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { initRedis } from './services/redis';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Allowed origins for CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

// Rate limiting configuration - higher limit for development
const isDev = process.env.NODE_ENV !== 'production';
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 1000 : 100, // 1000 for dev, 100 for production
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth requests per windowMs
    message: { error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // In production, require origin header for security
        if (!origin) {
            // Allow requests without origin only in development (mobile apps, curl, etc.)
            if (isDev) {
                return callback(null, true);
            }
            // In production, block requests without origin for better security
            return callback(new Error('Origin header required'));
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Health check routes (no auth required)
app.use('/health', healthRoutes);

// API Routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/catalogs', catalogRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Initialize Redis (optional - works without it)
initRedis();

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🚀`);
});
