import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type FetchOptions = Omit<RequestInit, "headers"> & {
    headers?: Record<string, string>;
    /** Retry sayısı - varsayılan 0 */
    retries?: number;
    /** Retry delay (ms) - varsayılan 1000 */
    retryDelay?: number;
    /** Timeout (ms) - varsayılan endpoint tipine göre otomatik belirlenir */
    timeout?: number;
};

/**
 * Endpoint tipine göre uygun timeout süresini belirle
 */
function getDefaultTimeout(endpoint: string): number {
    // Bulk işlemler için daha uzun timeout
    if (endpoint.includes('/bulk-') || endpoint.includes('/import') || endpoint.includes('/export')) {
        return 120000; // 120 saniye
    }

    // Standart işlemler için orta timeout
    if (endpoint.includes('/upload') || endpoint.includes('/image')) {
        return 60000; // 60 saniye
    }

    // Normal işlemler için kısa timeout
    return 30000; // 30 saniye (varsayılan)
}

interface ApiError extends Error {
    status?: number;
    isRateLimit?: boolean;
    retryAfter?: number;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    // Timeout'u endpoint tipine göre otomatik belirle (kullanıcı belirtmemişse)
    const defaultTimeout = getDefaultTimeout(endpoint);
    const { retries = 0, retryDelay = 1000, timeout = defaultTimeout, ...fetchOptions } = options;
    const supabase = await createServerSupabaseClient();

    // Geçerli isteğin header'larını al (IP ve User-Agent iletmek için)
    const clientHeaders = await headers();
    const forwardedFor = clientHeaders.get("x-forwarded-for");
    const realIp = clientHeaders.get("x-real-ip");
    const userAgent = clientHeaders.get("user-agent");

    // Use getUser() instead of getSession() for security
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const headersList: Record<string, string> = {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
    };

    // Forward client info for analytics and rate limiting
    if (forwardedFor) headersList["x-forwarded-for"] = forwardedFor;
    if (realIp) headersList["x-real-ip"] = realIp;
    if (userAgent) headersList["user-agent"] = userAgent;

    // Get session for access token after user is validated
    if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            headersList["Authorization"] = `Bearer ${session.access_token}`;
            headersList["x-user-id"] = user.id;
        }
    }

    const fetchHeaders = headersList;
    let lastError: ApiError | null = null;
    let attempts = 0;
    // ... rest of the logic remains the same
    let timeoutId: NodeJS.Timeout | null = null;
    let controller: AbortController | null = null;

    while (attempts <= retries) {
        // Önceki timeout ve controller'ı temizle (memory leak önleme)
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (controller) {
            controller.abort();
        }

        // Her retry'da yeni AbortController ve timeout oluştur
        controller = new AbortController();
        timeoutId = setTimeout(() => {
            if (controller) {
                controller.abort();
            }
        }, timeout);

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                ...fetchOptions,
                headers: fetchHeaders,
                signal: controller.signal,
            });

            // Başarılı yanıt - timeout'u temizle
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            // Rate Limit kontrolü (429 Too Many Requests)
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '30', 10);
                const error: ApiError = new Error(
                    `Çok fazla istek gönderildi. Lütfen ${retryAfter} saniye bekleyin.`
                );
                error.status = 429;
                error.isRateLimit = true;
                error.retryAfter = retryAfter * 1000;

                // Retry varsa bekle ve tekrar dene
                if (attempts < retries) {
                    await new Promise(resolve => setTimeout(resolve, error.retryAfter));
                    attempts++;
                    continue;
                }

                throw error;
            }

            // Diğer HTTP hataları
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error: ApiError = new Error(
                    getErrorMessage(response.status, errorData.error || response.statusText)
                );
                error.status = response.status;

                // 5xx hatalar için retry
                if (response.status >= 500 && attempts < retries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
                    attempts++;
                    lastError = error;
                    continue;
                }

                throw error;
            }

            // Some endpoints might return empty body (e.g. 204 No Content)
            if (response.status === 204) {
                return {} as T;
            }

            return response.json();

        } catch (error: unknown) {
            // Her durumda timeout'u temizle
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            // Fetch failed - backend sunucusu çalışmıyor olabilir
            if (error instanceof Error && (
                error.message.includes('fetch failed') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ENOTFOUND') ||
                error.cause?.toString().includes('ECONNREFUSED')
            )) {
                const connectionError: ApiError = new Error(
                    `Backend sunucusuna bağlanılamıyor (${BASE_URL}). Lütfen backend sunucusunun çalıştığından emin olun.`
                );
                connectionError.status = 503;

                // Retry varsa ve son deneme değilse devam et
                if (attempts < retries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
                    attempts++;
                    lastError = connectionError;
                    continue;
                }

                throw connectionError;
            }

            // AbortError kontrolü - type guard ile
            if (error instanceof Error && error.name === 'AbortError') {
                const timeoutError: ApiError = new Error(
                    `İstek zaman aşımına uğradı (${Math.round(timeout / 1000)}s). Lütfen tekrar deneyin.`
                );
                timeoutError.status = 408;

                // Retry varsa ve son deneme değilse devam et
                if (attempts < retries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
                    attempts++;
                    lastError = timeoutError;
                    continue;
                }

                throw timeoutError;
            }

            // Network hatası - retry
            if (isNetworkError(error) && attempts < retries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
                attempts++;
                lastError = error as ApiError;
                continue;
            }

            throw error;
        } finally {
            // Her durumda timeout'u temizle (ekstra güvenlik)
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        }
    }

    // Tüm retry'lar tükendi - son cleanup
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    if (controller) {
        controller.abort();
    }

    throw lastError || new Error('İstek başarısız oldu.');
}

/**
 * HTTP status koduna göre kullanıcı dostu hata mesajı
 */
function getErrorMessage(status: number, defaultMessage: string): string {
    const messages: Record<number, string> = {
        400: 'Geçersiz istek. Lütfen bilgileri kontrol edin.',
        401: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.',
        403: 'Bu işlem için yetkiniz yok.',
        404: 'İstenen kaynak bulunamadı.',
        409: 'Bu kayıt zaten mevcut.',
        422: 'Girilen veriler geçersiz.',
        429: 'Çok fazla istek. Lütfen biraz bekleyin.',
        500: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
        502: 'Sunucu geçici olarak kullanılamıyor.',
        503: 'Hizmet geçici olarak kullanılamıyor.',
        504: 'Sunucu yanıt vermedi. Lütfen tekrar deneyin.',
    };

    return messages[status] || defaultMessage;
}

/**
 * Network hatası mı kontrol et
 */
function isNetworkError(error: unknown): boolean {
    if (!error) return false;

    const networkIndicators = [
        'network',
        'fetch',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ERR_NETWORK',
        'Failed to fetch'
    ];

    const message = (error instanceof Error ? error.message : '').toLowerCase();
    return networkIndicators.some(indicator => message.includes(indicator.toLowerCase()));
}
