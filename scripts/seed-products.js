

// Initialize Supabase client
// Note: In a real scenario, you should use environment variables.
// Since this is a script to be run once, I'll need the user to ensure 
// process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
// are available or hardcode them temporarily for this execution if run manually.
// Because I cannot read the user's .env.local directly into this node process easily without dotenv,
// I will assume the user runs this with `node scripts/seed-products.js` having the env vars set or I will try to read .env.local via fs.

const fs = require('fs');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

function getEnvVars() {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const params = {};
        envFile.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                params[parts[0].trim()] = parts.slice(1).join('=').trim();
            }
        });
        return params;
    } catch (e) {
        console.error("Could not read .env.local");
        return {};
    }
}

const env = getEnvVars();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase credentials not found.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEMO_EMAIL = "mehmetkerem2109@gmail.com";

const DUMMY_PRODUCTS = [
    { name: "Modern Ofis Koltuğu", price: 4500, description: "Ergonomik tasarım, uzun süreli kullanım için ideal.", image_url: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&auto=format&fit=crop&q=60" },
    { name: "Ahşap Çalışma Masası", price: 3200, description: "Doğal meşe kaplama, geniş çalışma alanı.", image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop&q=60" },
    { name: "Masa Lambası", price: 750, description: "Ayarlanabilir ışık seviyesi, modern minimalist tasarım.", image_url: "https://images.unsplash.com/photo-1507473888900-52e1ad146957?w=500&auto=format&fit=crop&q=60" },
    { name: "Kitaplık - 5 Raflı", price: 2100, description: "Sağlam metal iskelet, modüler kurulum.", image_url: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=500&auto=format&fit=crop&q=60" },
    { name: "Deri Kanepe", price: 12500, description: "İtalyan derisi, 3 kişilik konforlu oturma.", image_url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&auto=format&fit=crop&q=60" },
    { name: "Orta Sehpa", price: 1800, description: "Cam yüzey, metal ayaklar.", image_url: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=500&auto=format&fit=crop&q=60" },
    { name: "Yemek Masası Takımı", price: 8500, description: "6 kişilik masa ve sandalye seti.", image_url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500&auto=format&fit=crop&q=60" },
    { name: "TV Ünitesi", price: 2900, description: "Geniş depolama alanı, şık görünüm.", image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&auto=format&fit=crop&q=60" },
    { name: "Komodin", price: 950, description: "İki çekmeceli, yatak başı için uygun.", image_url: "https://images.unsplash.com/photo-1532372320978-9b4d7a8855c7?w=500&auto=format&fit=crop&q=60" },
    { name: "Gardırop", price: 6500, description: "Aynalı kapak, 3 bölmeli geniş iç hacim.", image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&auto=format&fit=crop&q=60" },
    { name: "Berjer", price: 3400, description: "Kadife kumaş, konforlu tekli koltuk.", image_url: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500&auto=format&fit=crop&q=60" },
    { name: "Çalışma Sandalyesi", price: 2800, description: "Fileli sırt desteği, ayarlanabilir yükseklik.", image_url: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500&auto=format&fit=crop&q=60" },
    { name: "Lambader", price: 1200, description: "Kumaş başlık, ahşap gövde.", image_url: "https://images.unsplash.com/photo-1513506003013-d5347e0f34b2?w=500&auto=format&fit=crop&q=60" },
    { name: "Duvar Saati", price: 450, description: "Sessiz mekanizma, dekoratif metal çerçeve.", image_url: "https://images.unsplash.com/photo-1563861826100-9cb868c6218e?w=500&auto=format&fit=crop&q=60" },
    { name: "Halı - 160x230", price: 1900, description: "Yıkanabilir, kaymaz taban modern dokuma.", image_url: "https://images.unsplash.com/photo-1628147493867-5fb0b25e771d?w=500&auto=format&fit=crop&q=60" },
    { name: "Puf", price: 600, description: "Örgü tasarım, yumuşak oturum.", image_url: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=500&auto=format&fit=crop&q=60" },
    { name: "Banyo Dolabı", price: 2300, description: "Suya dayanıklı, aynalı üst modül.", image_url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&auto=format&fit=crop&q=60" },
    { name: "Mutfak Sandalyesi", price: 850, description: "Metal ayaklı, suni deri kaplama.", image_url: "https://images.unsplash.com/photo-1503602642458-23211144584b?w=500&auto=format&fit=crop&q=60" },
    { name: "Bar Taburesi", price: 1100, description: "Yüksek oturum, döner mekanizma.", image_url: "https://images.unsplash.com/photo-1503602642458-23211144584b?w=500&auto=format&fit=crop&q=60" },
    { name: "Ayakkabılık", price: 1400, description: "3 katlı, kapaklı düzenleyici.", image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&auto=format&fit=crop&q=60" },
    { name: "Portmanto", price: 3600, description: "Aynalı ve askılıklı geniş giriş mobilyası.", image_url: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=500&auto=format&fit=crop&q=60" },
    { name: "Çiçeklik", price: 400, description: "3 katlı metal stand.", image_url: "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=500&auto=format&fit=crop&q=60" },
    { name: "Tablo Seti", price: 900, description: "3'lü kanvas baskı, soyut sanat.", image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&auto=format&fit=crop&q=60" },
    { name: "Vazo", price: 250, description: "Seramik el yapımı dekoratif vazo.", image_url: "https://images.unsplash.com/photo-1581783342308-f792ea427963?w=500&auto=format&fit=crop&q=60" },
    { name: "Yatak Örtüsü", price: 1300, description: "Çift kişilik, pamuklu kumaş.", image_url: "https://images.unsplash.com/photo-1522771753035-1a5b6564f3a9?w=500&auto=format&fit=crop&q=60" }
];

async function seedProducts() {
    console.log("Seeding products for:", DEMO_EMAIL);

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    // Since listUsers is admin only, and we are using anon key, we might need to query the users table if enabled OR use auth.getUser() if we had the user's token.
    // BUT, we don't have the user's token or admin key here easily (unless service_role key is used).
    // Wait, I can only insert if I have the user's ID.
    // I will try to fetch the user by email if I have service role key, but I only have anon.
    // Actually, I can't easily get the UUID of a user with just anon key unless I'm logged in as them.

    // ALTERNATIVE: I will create a simple SQL script instead? No, I can't execute SQL directly.
    // I'll try to use the 'run_command' tool to execute a typescript file that uses the service role key if available?
    // I created 'lib/supabase/server.ts' but that's for Next.js.

    // Let's assume I need to ask the user to provide the UUID or I can't do it with anon key for a specific email without being that user.
    // HOWEVER, I am an "Agent" on the user's machine. I might be able to read the session? No.

    // Let's try to find the service role key in .env.local
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SERVICE_KEY) {
        console.log("Service role key not found in .env.local. Trying to login...");
        // I can't login without password.

        // I'll try to check if I can 'fake' it or just output the SQL for the user?
        // Or I can use the 'products' table RLS... if I'm not authed, I can't insert.

        console.error("Cannot insert products without Service Role Key or User Session.");
        console.log("Please add SUPABASE_SERVICE_ROLE_KEY to .env.local temporarily to run this script.");
        process.exit(1);
    }

    const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // List users to find the ID
    const { data: usersData, error: usersError } = await adminSupabase.auth.admin.listUsers();

    if (usersError) {
        console.error("Error fetching users:", usersError);
        process.exit(1);
    }

    const targetUser = usersData.users.find(u => u.email === DEMO_EMAIL);

    if (!targetUser) {
        console.error("User not found:", DEMO_EMAIL);
        process.exit(1);
    }

    console.log("Found user ID:", targetUser.id);

    const productsToInsert = DUMMY_PRODUCTS.map(p => ({
        user_id: targetUser.id,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: 'TRY', // Default currency
        image_url: p.image_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }));

    const { data: insertData, error: insertError } = await adminSupabase
        .from('products')
        .insert(productsToInsert)
        .select();

    if (insertError) {
        console.error("Error inserting products:", insertError);
    } else {
        console.log(`Successfully inserted ${insertData.length} products.`);
    }
}

seedProducts();
