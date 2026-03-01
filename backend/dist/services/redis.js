"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.cacheTTL = exports.cacheKeys = exports.getOrSetCache = exports.deleteCache = exports.setCache = exports.getCache = exports.initRedis = void 0;
exports.setProductsInvalidated = setProductsInvalidated;
const ioredis_1 = __importDefault(require("ioredis"));
// Redis bağlantısı - Upstash (rediss://) veya lokal Redis (redis://)
const REDIS_URL = (process.env.REDIS_URL || 'redis://localhost:6379').trim();
const isTls = REDIS_URL.startsWith('rediss://');
let redis = null;
exports.redis = redis;
let redisWarningShown = false;
function getRedisOptions() {
    const base = {
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        lazyConnect: true,
        retryStrategy: () => null,
    };
    // rediss:// (TLS) kullanıyorsa hostname'i TLS servername olarak ver (Upstash vb. için)
    if (isTls) {
        try {
            const hostname = new URL(REDIS_URL).hostname;
            return { ...base, tls: { servername: hostname, rejectUnauthorized: true } };
        }
        catch {
            return { ...base, tls: {} };
        }
    }
    return base;
}
// Redis bağlantısını başlat
const initRedis = () => {
    if (!REDIS_URL) {
        exports.redis = redis = null;
        return;
    }
    try {
        exports.redis = redis = new ioredis_1.default(REDIS_URL, getRedisOptions());
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
// In-memory cache fallback (Redis yoksa kullanılır)
const memoryCache = new Map();
// SECURITY: Prevent OOM — cap memory cache size
const MAX_MEMORY_CACHE_SIZE = 5000;
// Memory leak protection - GC every 1 minute
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of memoryCache.entries()) {
        if (now >= val.expires) {
            memoryCache.delete(key);
        }
    }
    // GC productsInvalidatedUntil entries
    for (const [userId, until] of productsInvalidatedUntil.entries()) {
        if (now >= until) {
            productsInvalidatedUntil.delete(userId);
        }
    }
}, 60000).unref();
// Cache key oluştur
const createKey = (prefix, ...parts) => {
    return `katalog:${prefix}:${parts.join(':')}`;
};
// Production'da Redis yoksa ürün cache'i kullanma (çok instance'da kapak/güncelleme eski kalmasın)
const isProductKey = (key) => key.startsWith('katalog:product');
/** Ürün mutation (PUT/POST/DELETE) sonrası bu kullanıcı için cache'i kısa süre atla (race / eski veri önleme) */
const productsInvalidatedUntil = new Map();
const PRODUCTS_INVALIDATE_MS = 5000;
function setProductsInvalidated(userId, ms = PRODUCTS_INVALIDATE_MS) {
    productsInvalidatedUntil.set(userId, Date.now() + ms);
}
function isProductsInvalidated(key) {
    if (!isProductKey(key))
        return false;
    const parts = key.split(':');
    const userId = parts[2]; // katalog:products:userId:... veya katalog:product:userId:...
    if (!userId)
        return false;
    const until = productsInvalidatedUntil.get(userId);
    if (!until)
        return false;
    if (Date.now() >= until) {
        productsInvalidatedUntil.delete(userId);
        return false;
    }
    return true;
}
const getCache = async (key) => {
    // 0. Ürün key'i ise ve yeni mutation sonrası penceredeyse cache atla (PUT sonrası eski veri dönmesin)
    if (isProductsInvalidated(key))
        return null;
    // 1. Redis'ten dene
    if (redis) {
        try {
            const data = await redis.get(key);
            // Eğer Redis aktifse ama veri yoksa, memory cache'e düşme (çünkü silinmiş olabilir)
            // Sadece hata durumunda veya Redis kapalıyken memory cache kullanılmalı
            if (data) {
                try {
                    return JSON.parse(data);
                }
                catch {
                    // SECURITY: Corrupted cache data — delete and continue
                    console.warn('Redis corrupted data for key:', key);
                    await redis.del(key).catch(() => { });
                    return null;
                }
            }
            return null;
        }
        catch (error) {
            console.warn('Redis read error:', error);
            // Hata durumunda memory cache'e devam edebilir
        }
    }
    // 2. Production'da Redis yokken ürün cache'i kullanma (kapak/güncelleme tüm instance'larda görünsün)
    if (process.env.NODE_ENV === 'production' && !redis && isProductKey(key)) {
        return null;
    }
    // 3. Memory cache'den dene
    const memCached = memoryCache.get(key);
    if (memCached) {
        if (Date.now() < memCached.expires) {
            try {
                return JSON.parse(memCached.data);
            }
            catch {
                // Corrupted memory cache entry — remove and continue
                memoryCache.delete(key);
                return null;
            }
        }
        memoryCache.delete(key);
    }
    return null;
};
exports.getCache = getCache;
// Cache'e yaz
const setCache = async (key, data, ttlSeconds = 300) => {
    const stringData = JSON.stringify(data);
    // 1. Redis'e yaz
    if (redis) {
        try {
            await redis.setex(key, ttlSeconds, stringData);
        }
        catch (error) {
            console.warn('Redis write error:', error);
        }
    }
    // 2. Production'da Redis yokken ürün cache'ine yazma (tek instance memory cache kapak sorununa yol açar)
    if (process.env.NODE_ENV === 'production' && !redis && isProductKey(key)) {
        return;
    }
    // 3. Memory cache'e yaz
    // SECURITY: Evict oldest entries if cache exceeds size limit to prevent OOM
    if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
        const firstKey = memoryCache.keys().next().value;
        if (firstKey)
            memoryCache.delete(firstKey);
    }
    memoryCache.set(key, {
        data: stringData,
        expires: Date.now() + (ttlSeconds * 1000)
    });
};
exports.setCache = setCache;
// Cache'i sil
const deleteCache = async (pattern, exact = false) => {
    if (exact) {
        // 1. Redis'ten tam eşleşmeyle sil
        if (redis) {
            try {
                await redis.del(pattern);
            }
            catch (error) {
                console.warn('Redis delete exact error:', error);
            }
        }
        // 2. Memory cache'den tam eşleşmeyle sil
        memoryCache.delete(pattern);
        return;
    }
    const searchPattern = pattern.endsWith('*') ? pattern : `${pattern}*`;
    // 1. Redis'ten sil
    if (redis) {
        try {
            return new Promise((resolve, reject) => {
                const stream = redis.scanStream({
                    match: searchPattern,
                    count: 100
                });
                const deletionPromises = [];
                stream.on('data', (keys) => {
                    if (keys.length > 0) {
                        try {
                            const pipeline = redis?.pipeline();
                            keys.forEach((key) => pipeline?.del(key));
                            deletionPromises.push(pipeline?.exec() || Promise.resolve());
                        }
                        catch (err) {
                            console.warn('Redis pipeline error:', err);
                        }
                    }
                });
                stream.on('error', (err) => {
                    console.warn('Redis scan error:', err);
                    reject(err);
                });
                stream.on('end', async () => {
                    try {
                        await Promise.all(deletionPromises);
                        resolve();
                    }
                    catch (err) {
                        reject(err);
                    }
                });
            });
        }
        catch (error) {
            console.warn('Redis delete error:', error);
        }
    }
    // 2. Memory cache'den sil
    const regexPattern = new RegExp('^' + searchPattern.replace(/\*/g, '.*') + '$');
    for (const key of memoryCache.keys()) {
        if (regexPattern.test(key)) {
            memoryCache.delete(key);
        }
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
    products: (userId, params) => {
        if (!params)
            return createKey('products', userId);
        const queryPart = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(':');
        return createKey('products', userId, queryPart);
    },
    product: (userId, productId) => createKey('product', userId, productId),
    // Kataloglar
    catalogs: (userId, params) => {
        if (!params)
            return createKey('catalogs', userId);
        const queryPart = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(':');
        return createKey('catalogs', userId, queryPart);
    },
    catalog: (userId, catalogId) => createKey('catalog', userId, catalogId),
    publicCatalog: (slug) => createKey('public', slug),
    // Şablonlar (global)
    templates: () => createKey('templates', 'all'),
    // Kullanıcı
    user: (userId) => createKey('user', userId),
    // Admin
    adminStats: () => createKey('admin', 'stats'),
    // Stats
    stats: (userId, params) => {
        if (!params)
            return createKey('stats', userId);
        const queryPart = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(':');
        return createKey('stats', userId, queryPart);
    },
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
