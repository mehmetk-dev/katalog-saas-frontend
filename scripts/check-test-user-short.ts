
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/Mehme/.gemini/antigravity/scratch/katalog-app/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const email = 'test12345@gmail.com';
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
        console.log(`User ${email} NOT FOUND`);
        return;
    }

    const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single();
    const { count } = await supabase.from('catalogs').select('id', { count: 'exact', head: true }).eq('user_id', user.id);

    console.log(`USER: ${email}`);
    console.log(`PLAN: ${profile?.plan || 'free'}`);
    console.log(`CATALOG COUNT: ${count}`);
}

checkUser();
