"use strict";
const __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.cacheTTL = exports.cacheKeys = exports.getOrSetCache = exports.deleteCache = exports.setCache = exports.getCache = exports.initRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
// Redis bağlantısı - Upstash veya lokal Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redis = null;
exports.redis = redis;
let redisWarningShown = false;
// Redis bağlantısını başlat
const initRedis = () => {
    try {
        exports.redis = redis = new ioredis_1.default(REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
            lazyConnect: true,
            retryStrategy: () => null, // Don't retry
        });
        redis.on('error', () => {
            if (!redisWarningShown) {
                console.warn('⚠️ Redis not available - running without cache');
                redisWarningShown = true;
            }
            exports.redis = redis = null;
        });
        redis.on('connect', () => {
        });
        // Bağlantıyı test et
        redis.connect().catch(() => {
            if (!redisWarningShown) {
                console.warn('⚠️ Redis not available - running without cache');
                redisWarningShown = true;
            }
            exports.redis = redis = null;
        });
    }
    catch (error) {
        if (!redisWarningShown) {
            console.warn('⚠️ Redis initialization failed - running without cache');
            redisWarningShown = true;
        }
        exports.redis = redis = null;
    }
};
exports.initRedis = initRedis;
// Cache key oluştur
const createKey = (prefix, ...parts) => {
    return `katalog:${prefix}:${parts.join(':')}`;
};
// Cache'den oku
const getCache = async (key) => {
    if (!redis)
        return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (error) {
        console.warn('Cache read error:', error);
        return null;
    }
};
exports.getCache = getCache;
// Cache'e yaz
const setCache = async (key, data, ttlSeconds = 300) => {
    if (!redis)
        return;
    try {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
    }
    catch (error) {
        console.warn('Cache write error:', error);
    }
};
exports.setCache = setCache;
// Cache'i sil (SCAN kullanarak performanslı silme)
const deleteCache = async (pattern) => {
    if (!redis)
        return;
    try {
        const stream = redis.scanStream({
            match: pattern,
            count: 100
        });
        stream.on('data', async (keys) => {
            if (keys.length > 0) {
                const pipeline = redis?.pipeline();
                keys.forEach((key) => pipeline?.del(key));
                await pipeline?.exec();
            }
        });
        return new Promise((resolve, reject) => {
            stream.on('end', resolve);
            stream.on('error', reject);
        });
    }
    catch (error) {
        console.warn('Cache delete error:', error);
    }
};
exports.deleteCache = deleteCache;
/**
 * Get data from cache or fetch from source and cache it
 */
const getOrSetCache = async (key, ttlSeconds, fetchFn) => {
    const cached = await (0, exports.getCache)(key);
    if (cached)
        return cached;
    const data = await fetchFn();
    if (data !== null && data !== undefined) {
        await (0, exports.setCache)(key, data, ttlSeconds);
    }
    return data;
};
exports.getOrSetCache = getOrSetCache;
// Cache key helper'ları
exports.cacheKeys = {
    // Ürünler
    products: (userId) => createKey('products', userId),
    product: (userId, productId) => createKey('product', userId, productId),
    // Kataloglar
    catalogs: (userId) => createKey('catalogs', userId),
    catalog: (userId, catalogId) => createKey('catalog', userId, catalogId),
    publicCatalog: (slug) => createKey('public', slug),
    // Şablonlar (global)
    templates: () => createKey('templates', 'all'),
    // Kullanıcı
    user: (userId) => createKey('user', userId),
    // Admin
    adminStats: () => createKey('admin', 'stats'),
};
// TTL değerleri (saniye)
exports.cacheTTL = {
    products: 300, // 5 dakika
    catalogs: 300, // 5 dakika
    templates: 3600, // 1 saat
    publicCatalog: 600, // 10 dakika
    user: 600, // 10 dakika
    adminStats: 300, // 5 dakika
};
