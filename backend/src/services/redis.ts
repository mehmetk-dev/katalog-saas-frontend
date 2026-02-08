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

// In-memory cache fallback (Redis yoksa kullanılır)
const memoryCache = new Map<string, { data: string; expires: number }>();

// Cache key oluştur
const createKey = (prefix: string, ...parts: string[]) => {
    return `katalog:${prefix}:${parts.join(':')}`;
};

// Cache'den oku
export const getCache = async <T>(key: string): Promise<T | null> => {
    // 1. Redis'ten dene
    if (redis) {
        try {
            const data = await redis.get(key);
            if (data) return JSON.parse(data);
        } catch (error) {
            console.warn('Redis read error:', error);
        }
    }

    // 2. Memory cache'den dene
    const memCached = memoryCache.get(key);
    if (memCached) {
        if (Date.now() < memCached.expires) {
            return JSON.parse(memCached.data);
        }
        memoryCache.delete(key);
    }

    return null;
};

// Cache'e yaz
export const setCache = async (key: string, data: unknown, ttlSeconds: number = 300): Promise<void> => {
    const stringData = JSON.stringify(data);

    // 1. Redis'e yaz
    if (redis) {
        try {
            await redis.setex(key, ttlSeconds, stringData);
        } catch (error) {
            console.warn('Redis write error:', error);
        }
    }

    // 2. Memory cache'e yaz
    memoryCache.set(key, {
        data: stringData,
        expires: Date.now() + (ttlSeconds * 1000)
    });
};

// Cache'i sil
export const deleteCache = async (pattern: string): Promise<void> => {
    const searchPattern = pattern.endsWith('*') ? pattern : `${pattern}*`;

    // 1. Redis'ten sil
    if (redis) {
        try {
            return new Promise((resolve, reject) => {
                const stream = redis!.scanStream({
                    match: searchPattern,
                    count: 100
                });

                stream.on('data', async (keys: string[]) => {
                    if (keys.length > 0) {
                        try {
                            const pipeline = redis?.pipeline();
                            keys.forEach((key: string) => pipeline?.del(key));
                            await pipeline?.exec();
                        } catch (err) {
                            console.warn('Redis pipeline error:', err);
                        }
                    }
                });

                stream.on('error', (err) => {
                    console.warn('Redis scan error:', err);
                    reject(err);
                });

                stream.on('end', () => {
                    resolve();
                });
            });
        } catch (error) {
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
    products: (userId: string, params?: Record<string, unknown>) => {
        if (!params) return createKey('products', userId);
        const queryPart = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(':');
        return createKey('products', userId, queryPart);
    },
    product: (userId: string, productId: string) => createKey('product', userId, productId),

    // Kataloglar
    catalogs: (userId: string, params?: Record<string, unknown>) => {
        if (!params) return createKey('catalogs', userId);
        const queryPart = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(':');
        return createKey('catalogs', userId, queryPart);
    },
    catalog: (userId: string, catalogId: string) => createKey('catalog', userId, catalogId),
    publicCatalog: (slug: string) => createKey('public', slug),

    // Şablonlar (global)
    templates: () => createKey('templates', 'all'),

    // Kullanıcı
    user: (userId: string) => createKey('user', userId),

    // Admin
    adminStats: () => createKey('admin', 'stats'),

    // Stats
    stats: (userId: string, params?: Record<string, unknown>) => {
        if (!params) return createKey('stats', userId);
        const queryPart = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(':');
        return createKey('stats', userId, queryPart);
    },
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
