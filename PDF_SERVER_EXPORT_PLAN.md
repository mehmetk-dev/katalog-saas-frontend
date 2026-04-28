# Server-Side PDF Export Architecture Plan

## Amaç

Mevcut client-side PDF export akışı büyük kataloglarda tarayıcıyı yoruyor: tüm sayfalar DOM'a basılıyor, görseller base64'e çevriliyor ve `html-to-image` ana thread üzerinde çalışıyor. Bu planın amacı PDF üretimini arka plana taşımak, kullanıcıya hazır olduğunda güvenli bir indirme linki vermek ve Supabase/Cloudinary depolama kotasını tüketmeden PDF'leri sunucuda kalıcı disk üzerinde yönetmek.

Bu doküman uygulama planıdır; mevcut client export hemen kaldırılmayacak. İlk aşamada server export yeni ve kontrollü bir yol olarak eklenecek.

## Hedef Mimari

```txt
Next.js Frontend
  |
  | POST /api/v1/pdf-exports
  v
Express API
  |
  | job kaydı + BullMQ enqueue
  v
Redis / BullMQ Queue
  |
  | job consume
  v
PDF Worker Process
  |
  | Playwright ile export-only route render
  v
Persistent Volume (/mnt/pdf-exports)
  |
  | auth kontrollü download endpoint
  v
User downloads PDF
```

## Temel Kararlar

- PDF üretimi Express API request'i içinde yapılmayacak.
- PDF üretimi ayrı bir Node worker process/container içinde yapılacak.
- Queue için Redis + BullMQ kullanılacak.
- PDF dosyaları Supabase Storage veya Cloudinary yerine sunucudaki persistent volume'da tutulacak.
- Dosyalar public klasöre yazılmayacak; indirme sadece auth kontrollü backend endpoint üzerinden yapılacak.
- Mevcut client-side export küçük kataloglar için fallback olarak korunacak.

## Neden BullMQ + Redis?

Postgres polling basit çalışır, ancak en sağlam yapı değildir. BullMQ bu iş için daha uygun:

- Concurrency kontrolü hazır.
- Retry/backoff hazır.
- Job progress update destekli.
- Aynı job'u iki worker'ın alma riski yok.
- Failed job takibi daha kolay.
- İleride birden fazla PDF worker eklemek kolay.
- Timeout ve cleanup stratejileri daha net yönetilir.

## Neden Persistent Volume?

Supabase/Cloudinary alanı sınırlıysa PDF dosyalarını object storage'a koymak istemeyiz. Bunun yerine worker'ın ve API'nin erişebildiği kalıcı disk kullanılır.

Örnek path:

```txt
/mnt/pdf-exports/{userId}/{jobId}.pdf
```

Önemli: Container içindeki geçici filesystem kullanılmamalı. Docker volume, VPS mounted disk veya hosting sağlayıcısının persistent volume özelliği kullanılmalı.

## Kullanıcı Akışı

1. Kullanıcı katalog builder'da "PDF hazırla" butonuna basar.
2. Frontend `POST /api/v1/pdf-exports` çağırır.
3. API kullanıcı planını, katalog sahipliğini ve aktif job limitini kontrol eder.
4. API `pdf_export_jobs` tablosunda `queued` kayıt oluşturur.
5. API BullMQ queue'ya `{ jobId, userId, catalogId }` ekler.
6. Frontend kullanıcıya "PDF hazırlanıyor" durumunu gösterir.
7. Worker job'u alır ve status'u `processing` yapar.
8. Worker Playwright ile export-only Next route'unu açar.
9. PDF dosyası üretilir ve persistent volume'a yazılır.
10. Worker job'u `completed` yapar.
11. Frontend polling veya realtime ile sonucu görür.
12. Kullanıcı indirme linkine basar.
13. Backend kullanıcı yetkisini kontrol edip dosyayı stream eder.

## Veritabanı Tasarımı

Migration önerisi:

```sql
create table if not exists pdf_export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  catalog_id uuid not null,
  status text not null default 'queued',
  progress integer not null default 0,
  page_count integer,
  file_path text,
  file_size_bytes bigint,
  error_message text,
  attempts integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pdf_export_jobs_user_created
  on pdf_export_jobs (user_id, created_at desc);

create index if not exists idx_pdf_export_jobs_status_created
  on pdf_export_jobs (status, created_at asc);
```

Status değerleri:

```txt
queued
processing
completed
failed
cancelled
expired
```

Not: `file_path` absolute path yerine volume root'a göre relative path olarak da tutulabilir:

```txt
{userId}/{jobId}.pdf
```

Bu daha güvenli olur; backend gerçek path'i kendi config'inden üretir.

## Backend API

Önerilen endpoint'ler:

```txt
POST /api/v1/pdf-exports
GET  /api/v1/pdf-exports
GET  /api/v1/pdf-exports/:jobId
POST /api/v1/pdf-exports/:jobId/cancel
GET  /api/v1/pdf-exports/:jobId/download
```

### POST /api/v1/pdf-exports

Request:

```json
{
  "catalogId": "uuid",
  "quality": "standard"
}
```

Kontroller:

- Kullanıcı authenticated mı?
- Katalog bu kullanıcıya mı ait?
- Aynı kullanıcı için aktif job var mı?
- Plan bu export'a izin veriyor mu?
- Katalogda ürün var mı?
- Katalog tahmini sayfa limiti aşılmış mı?

Response:

```json
{
  "jobId": "uuid",
  "status": "queued"
}
```

### GET /api/v1/pdf-exports/:jobId

Response:

```json
{
  "id": "uuid",
  "catalogId": "uuid",
  "status": "processing",
  "progress": 45,
  "pageCount": 80,
  "errorMessage": null,
  "createdAt": "...",
  "completedAt": null,
  "expiresAt": null
}
```

### GET /api/v1/pdf-exports/:jobId/download

Kontroller:

- Job bu kullanıcıya ait mi?
- Status `completed` mı?
- `expires_at` dolmamış mı?
- Dosya path'i volume root dışına çıkmıyor mu?
- Dosya mevcut mu?

Sonra dosya stream edilir:

```txt
Content-Type: application/pdf
Content-Disposition: attachment; filename="catalog-name.pdf"
```

## Queue Tasarımı

Queue adı:

```txt
pdf-export
```

Job name:

```txt
render-catalog-pdf
```

Queue add örneği:

```ts
await pdfExportQueue.add(
  "render-catalog-pdf",
  { jobId, userId, catalogId, quality },
  {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  }
)
```

Worker başlangıç concurrency:

```ts
concurrency: 1
```

Chromium ağır olduğu için ilk sürümde `1` ile başlanmalı. Sunucu CPU/RAM ölçümlerinden sonra `2` denenebilir.

## Worker Sorumlulukları

Worker job alınca:

1. Job kaydını `processing` yapar.
2. `attempts` artırır.
3. Katalog ve ürünleri backend service/admin client ile çeker.
4. Export-only URL için kısa ömürlü token üretir.
5. Playwright browser açar.
6. Export route'a gider.
7. Sayfanın hazır olduğunu bekler.
8. PDF üretir.
9. PDF'i volume'a atomik şekilde yazar.
10. Job kaydını `completed` yapar.
11. Hata olursa `failed` yapar.
12. Browser'ı her durumda kapatır.

Atomik dosya yazımı:

```txt
/mnt/pdf-exports/{userId}/{jobId}.pdf.tmp
rename ->
/mnt/pdf-exports/{userId}/{jobId}.pdf
```

Bu sayede yarım dosya download edilmez.

## Export-Only Next Route

Önerilen route:

```txt
/export/catalog/[jobId]?token=...
```

Bu sayfa normal kullanıcı UI'ını render etmez:

- dashboard layout yok
- toolbar yok
- modal yok
- lightbox yok
- sadece PDF sayfaları var

Güvenlik:

- Token kısa ömürlü olmalı.
- Token jobId + userId + catalogId içermeli.
- Worker secret ile imzalanmalı.
- Normal kullanıcı bu route'u direkt açamamalı.

CSS:

```css
@page {
  size: A4;
  margin: 0;
}

html,
body {
  margin: 0;
  padding: 0;
  background: white;
}

.catalog-export-document {
  width: 210mm;
}

.catalog-page {
  width: 210mm;
  height: 297mm;
  break-after: page;
  page-break-after: always;
  overflow: hidden;
}
```

Render readiness:

```ts
window.__FOGCATALOG_EXPORT_READY__ = true
```

Worker bunu bekler:

```ts
await page.waitForFunction(() => window.__FOGCATALOG_EXPORT_READY__ === true)
```

## Playwright PDF Üretimi

Temel örnek:

```ts
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})

const page = await browser.newPage({
  viewport: { width: 794, height: 1123 },
})

await page.goto(exportUrl, { waitUntil: "networkidle", timeout: 120000 })
await page.waitForFunction(() => window.__FOGCATALOG_EXPORT_READY__ === true, { timeout: 120000 })
await page.emulateMedia({ media: "screen" })

const pdfBuffer = await page.pdf({
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  timeout: 120000,
})

await browser.close()
```

## Kalite Seviyeleri

Server-side Playwright PDF'te kalite büyük ölçüde CSS, görsel URL kalitesi ve Chromium print çıktısına bağlıdır. Client tarafındaki `pixelRatio` mantığı burada birebir yoktur.

Önerilen quality preset:

```txt
standard
high
```

`standard`:

- normal görsel URL
- büyük kataloglarda tercih edilir
- daha hızlı üretim

`high`:

- Cloudinary `q_auto:best` veya daha yüksek çözünürlüklü URL
- Pro plan için
- daha fazla CPU/RAM/network kullanır

## Dosya Saklama ve Cleanup

Öneri:

- PDF dosyaları 7 gün saklansın.
- `expires_at = completed_at + interval '7 days'`.
- Cleanup job günde 1 kez çalışsın.
- Expired job status'u `expired` yapılsın.
- Dosya diskten silinsin.

Cleanup worker:

```txt
find completed jobs where expires_at < now()
delete file
update status = expired
```

Ek limitler:

- Kullanıcı başı aktif job: 1
- Kullanıcı başı tamamlanmış saklanan PDF: örn. 20
- Global disk kullanım alarmı: %80
- Disk doluysa yeni export kabul edilmez

## Güvenlik

Dosya path güvenliği:

- DB'den gelen path doğrudan kullanılmamalı.
- `path.resolve(EXPORT_ROOT, relativePath)` yapılmalı.
- Son path'in `EXPORT_ROOT` içinde kaldığı doğrulanmalı.

Download güvenliği:

- Auth zorunlu.
- Job ownership kontrolü.
- Completed status kontrolü.
- Expiry kontrolü.
- Dosya varlık kontrolü.

Export route güvenliği:

- Worker token zorunlu.
- Token kısa ömürlü.
- Token sadece ilgili job için geçerli.
- Route public catalog slug ile değil jobId/token ile çalışmalı.

## Sunucu Kaynak Yönetimi

Başlangıç önerisi:

```txt
PDF worker concurrency: 1
Job timeout: 10-15 dakika
Max retry: 2
Max active job per user: 1
Max global active job: worker concurrency kadar
```

Sunucu izleme:

- CPU
- RAM
- disk usage
- job duration
- failed job count
- average page count
- average PDF size

Chromium için Docker ayarları:

```txt
--disable-dev-shm-usage
--no-sandbox
```

Not: Production'da sandbox ayarı hosting ortamına göre tekrar değerlendirilmelidir.

## Frontend UI Değişiklikleri

Builder toolbar:

- "PDF indir" yerine plan/ürün sayısına göre seçenek:
  - "Hemen indir" küçük katalog/client fallback
  - "Arka planda hazırla" server export

PDF modal:

```txt
PDF hazırlanıyor
%45
Bu işlem büyük kataloglarda birkaç dakika sürebilir.
Sayfadan ayrılabilirsiniz; hazır olduğunda bildireceğiz.
```

Tamamlanınca:

```txt
PDF hazır
İndir
7 gün boyunca erişilebilir
```

Dashboard'a export history eklenebilir:

```txt
Katalog adı | Durum | Tarih | Boyut | İndir
```

## Migration Stratejisi

1. Client export korunur.
2. Server export altyapısı eklenir.
3. Sadece Pro/Plus veya büyük kataloglar için aktif edilir.
4. Başarısız olursa kullanıcıya client fallback gösterilir.
5. Telemetry ile süre/hata/boyut izlenir.
6. Stabil olduktan sonra server export ana yol yapılır.

## Uygulama Adımları

### Aşama 1 - Altyapı

- Redis bağlantısı ekle.
- BullMQ dependency ekle.
- `pdf_export_jobs` migration ekle.
- `PDF_EXPORT_ROOT` env ekle.
- `WORKER_EXPORT_SECRET` env ekle.

### Aşama 2 - Backend API

- `backend/src/services/pdf-export-queue.ts`
- `backend/src/controllers/pdf-exports.ts`
- `backend/src/routes/pdf-exports.ts`
- ownership ve active job kontrolleri
- download endpoint

### Aşama 3 - Worker

- `backend/src/workers/pdf-export-worker.ts`
- Playwright setup
- job status update
- PDF file write
- error handling
- cleanup on failure

### Aşama 4 - Export Route

- `app/export/catalog/[jobId]/page.tsx`
- signed token doğrulama
- catalog/products fetch
- A4 export CSS
- readiness flag

### Aşama 5 - Frontend

- Builder PDF butonunu server job başlatacak hale getir.
- Progress polling hook ekle.
- Completed download state ekle.
- Error/fallback UI ekle.

### Aşama 6 - Cleanup ve Monitoring

- expired PDF cleanup worker/cron
- disk usage kontrolü
- job metrics
- failed job logları

## Riskler ve Çözümler

### Risk: Chromium çok RAM kullanır

Çözüm:

- concurrency 1
- job timeout
- büyük katalog kalite limiti
- worker ayrı process/container

### Risk: Disk dolar

Çözüm:

- 7 günlük expiry
- kullanıcı başı dosya limiti
- disk usage alarmı
- yeni job kabul etmeden önce free space kontrolü

### Risk: PDF tasarımı client preview ile farklı görünür

Çözüm:

- export route aynı template component'lerini kullanmalı
- A4 CSS ayrı test edilmeli
- Playwright screenshot/PDF regression yapılmalı

### Risk: Worker ölürse job processing'de kalır

Çözüm:

- BullMQ stalled job handling
- processing job heartbeat
- çok uzun süredir processing kalan job'ları failed/queued yapacak recovery task

### Risk: Kullanıcı aynı anda çok export başlatır

Çözüm:

- user başı 1 active job
- mevcut queued/processing job varsa yeni job yerine onu döndür

## İlk MVP İçin Net Kapsam

MVP'de şunlar olsun:

- BullMQ + Redis queue
- Tek worker concurrency 1
- `pdf_export_jobs` tablosu
- persistent volume'a PDF yazma
- auth download endpoint
- export-only route
- frontend polling
- 7 gün cleanup

MVP'de şunlar sonraya kalabilir:

- email bildirimi
- detaylı export history sayfası
- çoklu worker autoscale
- gelişmiş kalite presetleri
- PDF cache reuse

## Sonuç

Bu yapı Supabase/Cloudinary depolama alanını tüketmeden, büyük katalog PDF üretimini kullanıcı tarayıcısından çıkarır. En kritik kural PDF üretimini API server request lifecycle'ından ayırmaktır. API sadece job oluşturur ve durum döner; ağır iş ayrı worker tarafından yapılır.

Önerilen hedef yapı:

```txt
BullMQ + Redis + PDF Worker + Playwright + Persistent Volume + Auth Download Endpoint
```
