import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder first, then try parent folder
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// Support both SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL is missing! Backend cannot connect to database.');
} else {
    console.log('✅ Supabase URL configured');
}

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing! Admin operations will fail.');
} else {
    console.log('✅ Supabase Service Role Key configured');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
