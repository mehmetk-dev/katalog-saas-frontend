import Redis from 'ioredis';

// Redis bağlantısı - Upstash veya lokal Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;
let redisWarningShown = false;

// Redis bağlantısını başlat
export const initRedis = () => {
    try {
        redis = new Redis(REDIS_URL, {
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
            redis = null;
        });

        redis.on('connect', () => {

        });

        // Bağlantıyı test et
        redis.connect().catch(() => {
            if (!redisWarningShown) {
                console.warn('⚠️ Redis not available - running without cache');
                redisWarningShown = true;
            }
            redis = null;
        });
    } catch (error) {
        if (!redisWarningShown) {
            console.warn('⚠️ Redis initialization failed - running without cache');
            redisWarningShown = true;
        }
        redis = null;
    }
};

// Cache key oluştur
const createKey = (prefix: string, ...parts: string[]) => {
    return `katalog:${prefix}:${parts.join(':')}`;
};

// Cache'den oku
export const getCache = async <T>(key: string): Promise<T | null> => {
    if (!redis) return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.warn('Cache read error:', error);
        return null;
    }
};

// Cache'e yaz
export const setCache = async (key: string, data: any, ttlSeconds: number = 300): Promise<void> => {
    if (!redis) return;
    try {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
        console.warn('Cache write error:', error);
    }
};

// Cache'i sil (SCAN kullanarak performanslı silme)
export const deleteCache = async (pattern: string): Promise<void> => {
    if (!redis) return;
    try {
        const stream = redis.scanStream({
            match: pattern,
            count: 100
        });

        stream.on('data', async (keys: string[]) => {
            if (keys.length > 0) {
                const pipeline = redis?.pipeline();
                keys.forEach((key: string) => pipeline?.del(key));
                await pipeline?.exec();
            }
        });

        return new Promise((resolve, reject) => {
            stream.on('end', resolve);
            stream.on('error', reject);
        });
    } catch (error) {
        console.warn('Cache delete error:', error);
    }
};

/**
 * Get data from cache or fetch from source and cache it
 */
export const getOrSetCache = async <T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
): Promise<T> => {
    const cached = await getCache<T>(key);
    if (cached) return cached;

    const data = await fetchFn();
    if (data !== null && data !== undefined) {
        await setCache(key, data, ttlSeconds);
    }
    return data;
};

// Cache key helper'ları
export const cacheKeys = {
    // Ürünler
    products: (userId: string) => createKey('products', userId),
    product: (userId: string, productId: string) => createKey('product', userId, productId),

    // Kataloglar
    catalogs: (userId: string) => createKey('catalogs', userId),
    catalog: (userId: string, catalogId: string) => createKey('catalog', userId, catalogId),
    publicCatalog: (slug: string) => createKey('public', slug),

    // Şablonlar (global)
    templates: () => createKey('templates', 'all'),

    // Kullanıcı
    user: (userId: string) => createKey('user', userId),

    // Admin
    adminStats: () => createKey('admin', 'stats'),
};

// TTL değerleri (saniye)
export const cacheTTL = {
    products: 300,      // 5 dakika
    catalogs: 300,      // 5 dakika
    templates: 3600,    // 1 saat
    publicCatalog: 600, // 10 dakika
    user: 600,          // 10 dakika
    adminStats: 300,    // 5 dakika
};

export { redis };
