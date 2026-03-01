import { createClient } from '@supabase/supabase-js';

// Environment variables are loaded once in index.ts via dotenv.config()
// SECURITY: Only use backend-specific env vars (not NEXT_PUBLIC_ frontend vars)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL is missing! Backend cannot connect to database.');
}

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing! Admin operations will fail.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
