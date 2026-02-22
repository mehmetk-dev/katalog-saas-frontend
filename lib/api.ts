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
    details?: any;
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
                cache: "no-store",
            });

            // Başarılı yanıt - timeout'u temizle
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            // Diğer HTTP hataları
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const connectionError: ApiError = new Error(
                    errorData.error || getErrorMessage(response.status)
                );
                connectionError.status = response.status;
                connectionError.details = errorData;

                // 429 Rate Limit
                if (response.status === 429) {
                    connectionError.isRateLimit = true;
                    const retryAfterHeader = response.headers?.get?.('Retry-After');
                    connectionError.retryAfter = parseInt(retryAfterHeader || '30', 10) * 1000;
                }

                // 5xx hatalar veya 429 için retry
                if ((response.status >= 500 || response.status === 429) && attempts < retries) {
                    const delay = response.status === 429 ? connectionError.retryAfter || 30000 : retryDelay * (attempts + 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    attempts++;
                    lastError = connectionError;
                    continue;
                }

                throw connectionError;
            }

            // Some endpoints might return empty body (e.g. 204 No Content)
            if (response.status === 204) {
                return {} as T;
            }

            return response.json();

        } catch (error: any) {
            // Her durumda timeout'u temizle
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            // AbortError kontrolü
            if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
                const timeoutError: ApiError = new Error('api.error.gatewayTimeout');
                timeoutError.status = 408;

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
                const networkError: ApiError = new Error('api.error.serviceUnavailable');
                networkError.status = 503;
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
                attempts++;
                lastError = networkError;
                continue;
            }

            throw error;
        } finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        }
    }

    // Tüm retry'lar tükendi
    if (timeoutId) clearTimeout(timeoutId);
    if (controller) controller.abort();

    throw lastError || new Error('İstek başarısız oldu.');
}

/**
 * HTTP status koduna göre kullanıcı dostu hata mesajı anahtarı
 */
function getErrorMessage(status?: number): string {
    const messages: Record<number, string> = {
        400: 'api.error.badRequest',
        401: 'api.error.unauthorized',
        403: 'api.error.forbidden',
        404: 'api.error.notFound',
        409: 'api.error.conflict',
        422: 'api.error.validationError',
        429: 'api.error.rateLimit',
        500: 'api.error.serverError',
        502: 'api.error.serverUnavailable',
        503: 'api.error.serviceUnavailable',
        504: 'api.error.gatewayTimeout',
    };

    return (status && messages[status]) || 'api.error.unknown';
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

    const message = (error && typeof error === 'object' && 'message' in error ? String(error.message) : '').toLowerCase();
    return networkIndicators.some(indicator => message.includes(indicator.toLowerCase()));
}
