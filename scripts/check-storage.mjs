import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkStorage() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase URL or Key')
        return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Checking buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
        console.error('Error listing buckets:', bucketsError.message)
    } else {
        console.log('Buckets found:', buckets.map(b => b.name).join(', '))
    }

    const interestingBuckets = ['product-images', 'company-logos', 'catalog-backgrounds']

    for (const bucket of interestingBuckets) {
        console.log(`Checking files in bucket: ${bucket}...`)
        const { data: files, error: filesError } = await supabase.storage.from(bucket).list('', {
            limit: 10,
            offset: 0,
        })

        if (filesError) {
            console.error(`Error listing files in ${bucket}:`, filesError.message)
        } else {
            console.log(`Files in ${bucket}:`, files ? files.length : 0)
            if (files && files.length > 0) {
                files.forEach(f => console.log(` - ${f.name}`))
            }
        }
    }
}

checkStorage()
