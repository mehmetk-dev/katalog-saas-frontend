
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/Mehme/.gemini/antigravity/scratch/katalog-app/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const email = 'test12345@gmail.com';

    // Check if user exists in auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Error listing users:', authError);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.log(`User ${email} does not exist in Auth.`);
        return;
    }

    console.log(`User ID: ${user.id}`);

    // Check user profile
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
    } else {
        console.log('User Profile:', profile);
    }

    // Check user catalogs
    const { data: catalogs, error: catalogsError } = await supabase
        .from('catalogs')
        .select('id, name, is_published')
        .eq('user_id', user.id);

    if (catalogsError) {
        console.error('Error fetching catalogs:', catalogsError);
    } else {
        console.log(`User Catalogs (${catalogs.length}):`, catalogs);
    }
}

checkUser();
