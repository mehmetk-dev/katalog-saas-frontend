import { createServerSupabaseClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

type FetchOptions = Omit<RequestInit, "headers"> & {
    headers?: Record<string, string>;
    /** Retry sayısı - varsayılan 0 */
    retries?: number;
    /** Retry delay (ms) - varsayılan 1000 */
    retryDelay?: number;
    /** Timeout (ms) - varsayılan 60000 (60 saniye) */
    timeout?: number;
};

interface ApiError extends Error {
    status?: number;
    isRateLimit?: boolean;
    retryAfter?: number;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { retries = 0, retryDelay = 1000, timeout = 60000, ...fetchOptions } = options;
    const supabase = await createServerSupabaseClient();

    // Use getUser() instead of getSession() for security
    // getUser() validates the token server-side, getSession() only reads from cookie
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
    };

    // Get session for access token after user is validated
    if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
        }
    }

    // Timeout kontrolü için AbortController kullan
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout); // Parametrik timeout

    let lastError: ApiError | null = null;
    let attempts = 0;

    while (attempts <= retries) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                ...fetchOptions,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

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

        } catch (error: any) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                const timeoutError: ApiError = new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
                timeoutError.status = 408;
                throw timeoutError;
            }

            // Network hatası - retry
            if (isNetworkError(error) && attempts < retries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
                attempts++;
                lastError = error;
                continue;
            }

            throw error;
        }
    }

    // Tüm retry'lar tükendi
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
function isNetworkError(error: any): boolean {
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

    const message = (error?.message || '').toLowerCase();
    return networkIndicators.some(indicator => message.includes(indicator.toLowerCase()));
}
