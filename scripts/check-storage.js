const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manuel env okuma
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('URL or Key missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- STORAGE CHECK ---');
    console.log('URL:', supabaseUrl);

    const { data: buckets, error: bError } = await supabase.storage.listBuckets();
    if (bError) {
        console.error('Buckets Error:', bError);
        return;
    }

    console.log('Buckets found:', buckets.length);
    for (const b of buckets) {
        console.log(`- Bucket: ${b.name} (Public: ${b.public})`);
        const { data: files, error: fError } = await supabase.storage.from(b.name).list('', { limit: 5 });
        if (fError) {
            console.log(`  Error listing files: ${fError.message}`);
        } else {
            console.log(`  Files count: ${files.length}`);
            files.forEach(f => console.log(`    * ${f.name}`));
        }
    }
    console.log('--- END CHECK ---');
}

run();
