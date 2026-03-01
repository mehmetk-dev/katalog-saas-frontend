 import Redis, { RedisOptions } from 'ioredis';

// Redis bağlantısı - Upstash (rediss://) veya lokal Redis (redis://)
const REDIS_URL = (process.env.REDIS_URL || 'redis://localhost:6379').trim();
const isTls = REDIS_URL.startsWith('rediss://');

let redis: Redis | null = null;
let redisWarningShown = false;

function getRedisOptions(): RedisOptions {
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
        } catch {
            return { ...base, tls: {} };
        }
    }
    return base;
}

// Redis bağlantısını başlat
export const initRedis = () => {
    if (!REDIS_URL) {
        redis = null;
        return;
    }
    try {
        redis = new Redis(REDIS_URL, getRedisOptions());

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
const createKey = (prefix: string, ...parts: string[]) => {
    return `katalog:${prefix}:${parts.join(':')}`;
};

// Production'da Redis yoksa ürün cache'i kullanma (çok instance'da kapak/güncelleme eski kalmasın)
const isProductKey = (key: string) => key.startsWith('katalog:product');

/** Ürün mutation (PUT/POST/DELETE) sonrası bu kullanıcı için cache'i kısa süre atla (race / eski veri önleme) */
const productsInvalidatedUntil = new Map<string, number>();
const PRODUCTS_INVALIDATE_MS = 5000;

export function setProductsInvalidated(userId: string, ms: number = PRODUCTS_INVALIDATE_MS): void {
    productsInvalidatedUntil.set(userId, Date.now() + ms);
}

function isProductsInvalidated(key: string): boolean {
    if (!isProductKey(key)) return false;
    const parts = key.split(':');
    const userId = parts[2]; // katalog:products:userId:... veya katalog:product:userId:...
    if (!userId) return false;
    const until = productsInvalidatedUntil.get(userId);
    if (!until) return false;
    if (Date.now() >= until) {
        productsInvalidatedUntil.delete(userId);
        return false;
    }
    return true;
}

export const getCache = async <T>(key: string): Promise<T | null> => {
    // 0. Ürün key'i ise ve yeni mutation sonrası penceredeyse cache atla (PUT sonrası eski veri dönmesin)
    if (isProductsInvalidated(key)) return null;

    // 1. Redis'ten dene
    if (redis) {
        try {
            const data = await redis.get(key);
            // Eğer Redis aktifse ama veri yoksa, memory cache'e düşme (çünkü silinmiş olabilir)
            // Sadece hata durumunda veya Redis kapalıyken memory cache kullanılmalı
            if (data) {
                try {
                    return JSON.parse(data);
                } catch {
                    // SECURITY: Corrupted cache data — delete and continue
                    console.warn('Redis corrupted data for key:', key);
                    await redis.del(key).catch(() => {});
                    return null;
                }
            }
            return null;
        } catch (error) {
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
            } catch {
                // Corrupted memory cache entry — remove and continue
                memoryCache.delete(key);
                return null;
            }
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

    // 2. Production'da Redis yokken ürün cache'ine yazma (tek instance memory cache kapak sorununa yol açar)
    if (process.env.NODE_ENV === 'production' && !redis && isProductKey(key)) {
        return;
    }

    // 3. Memory cache'e yaz
    // SECURITY: Evict oldest entries if cache exceeds size limit to prevent OOM
    if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
        const firstKey = memoryCache.keys().next().value;
        if (firstKey) memoryCache.delete(firstKey);
    }
    memoryCache.set(key, {
        data: stringData,
        expires: Date.now() + (ttlSeconds * 1000)
    });
};

// Cache'i sil
export const deleteCache = async (pattern: string, exact: boolean = false): Promise<void> => {
    if (exact) {
        // 1. Redis'ten tam eşleşmeyle sil
        if (redis) {
            try {
                await redis.del(pattern);
            } catch (error) {
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
                const stream = redis!.scanStream({
                    match: searchPattern,
                    count: 100
                });

                const deletionPromises: Promise<any>[] = [];

                stream.on('data', (keys: string[]) => {
                    if (keys.length > 0) {
                        try {
                            const pipeline = redis?.pipeline();
                            keys.forEach((key: string) => pipeline?.del(key));
                            deletionPromises.push(pipeline?.exec() || Promise.resolve());
                        } catch (err) {
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
                    } catch (err) {
                        reject(err);
                    }
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
