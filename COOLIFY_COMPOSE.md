# Coolify Compose Kurulumu

Bu yapı tek container değil, tek Coolify kaynağı altında çalışan dört container kullanır: `frontend`, `backend`, `pdf-worker` ve `redis`.

## Coolify Ayarı

1. Yeni kaynak oluştururken **Docker Compose** seçin.
2. Compose dosyası olarak `/docker-compose.coolify.yml` kullanın.
3. Public domain'i `frontend` servisine ve `3000` portuna bağlayın.
4. `backend`, `pdf-worker` ve `redis` servislerine public domain veya host port vermeyin.
5. Gerekli environment değişkenlerini Coolify kaynağına ekleyip tüm stack'i yeniden deploy edin.
6. Yeni stack hazır olduktan sonra eski worker kaynağını durdurun; aksi halde PDF işleri eski worker tarafından alınabilir.

## Zorunlu Değişkenler

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `WORKER_EXPORT_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Production adresi Compose içinde `https://fogcatalog.com` olarak sabitlenmiştir. Frontend `/api/v1` isteklerini Compose iç ağında `backend:4000` servisine yönlendirir.

## Worker Kontrolü

Worker logunda önce `ready — frontend: http://frontend:3000`, PDF işleminde ise `uploaded ... to R2` ve `completed` satırları görülmelidir. Worker için domain veya port tanımlanmaz; Redis ve frontend'e Compose servis adları üzerinden bağlanır.
