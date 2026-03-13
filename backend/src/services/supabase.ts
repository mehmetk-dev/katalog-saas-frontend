import { createClient } from '@supabase/supabase-js';

// Environment variables are loaded once in index.ts via dotenv.config().
// Use backend-only env vars and fail fast for invalid runtime config.
function requireEnv(key: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
    const raw = process.env[key];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) {
        throw new Error(`[startup] Missing required environment variable: ${key}`);
    }
    return value;
}

function assertValidSupabaseUrl(url: string): void {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            throw new Error();
        }
    } catch {
        throw new Error('[startup] SUPABASE_URL is invalid. Expected a full http(s) URL.');
    }
}

const supabaseUrl = requireEnv('SUPABASE_URL');
const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
assertValidSupabaseUrl(supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey);
