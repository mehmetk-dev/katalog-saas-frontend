import { createServerSupabaseClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

type FetchOptions = Omit<RequestInit, "headers"> & {
    headers?: Record<string, string>;
};

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const supabase = await createServerSupabaseClient();

    // Use getUser() instead of getSession() for security
    // getUser() validates the token server-side, getSession() only reads from cookie
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
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
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API Error: ${response.statusText}`);
        }

        // Some endpoints might return empty body (e.g. 204 No Content)
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
        }
        throw error;
    }
}
