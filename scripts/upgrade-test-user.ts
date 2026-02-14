
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/Mehme/.gemini/antigravity/scratch/katalog-app/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function upgradeUser() {
    const email = 'test12345@gmail.com';
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
        console.log(`User ${email} NOT FOUND`);
        return;
    }

    const { error } = await supabase.from('users').update({ plan: 'pro' }).eq('id', user.id);
    if (error) {
        console.error('Error upgrading user:', error);
    } else {
        console.log(`User ${email} upgraded to PRO`);
    }
}

upgradeUser();
