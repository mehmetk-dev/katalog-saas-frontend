# 🔧 Analitik Sistem Düzeltme Planı

> Oluşturulma: 2026-04-21 | Durum: ✅ Tamamlandı

---

## P0 — Kritik (Yanıltıcı / Bozuk Veri)

### 1. Fallback yolunda cache invalidation tamamen atlanıyor
- **Dosya:** `backend/src/controllers/catalogs/public.ts:178`
- **Sorun:** `smart_increment_view_count` RPC hata verirse `inserted || !error` = `false` → hiçbir cache silinmiyor
- **Çözüm:** Koşulu `true` yap (fallback başarılıysa da invalidate et), + `cacheKeys.stats(ownerId)` ekle

### 2. Stats cache hiçbir zaman invalidate edilmiyor (view tracking sonrası)
- **Dosya:** `backend/src/controllers/catalogs/public.ts:179`
- **Sorun:** View kaydedildikten sonra sadece `catalogs` cache'i siliniyor, `stats` cache'i 2dk boyunca eski kalıyor
- **Çözüm:** `deleteCache(cacheKeys.stats(ownerId))` ekle

### 3. KPI Trend hesaplaması bozuk — previousValue her zaman 0
- **Dosya:** `components/analytics/analytics-client.tsx:156-163`
- **Sorun:** `calculateTrend(currentValue, 0)` → veri varsa her zaman +100% gösteriyor
- **Çözüm:** Backend'den önceki dönem verisi döndür (prevTotalViews, prevUniqueVisitors) ve frontend'e bağla

### 4. totalViews sadece dönem içi görüntülenme sayıyor
- **Dosya:** `backend/src/controllers/catalogs/stats.ts:122`
- **Sorun:** KPI "Toplam Görüntülenme" diyor ama sadece 7d/30d/90d aralığını sayıyor
- **Çözüm:** `catalogs.view_count` toplamını all-time totalViews olarak döndür, dönem içini ayrı alan olarak ekle (periodViews)

### 5. topCatalogs dönem bazlı sıralıyor, all-time değil
- **Dosya:** `backend/src/controllers/catalogs/stats.ts:123-126`
- **Sorun:** "En Çok Görüntülenme" all-time olmalı ama sadece dönem view'larına göre sıralanıyor
- **Çözüm:** `catalogs.view_count` (all-time) ile sırala, dönem view'larını ayrı alan olarak göster

---

## P1 — Önemli (Eski Veri / Veri Kaybı)

### 6. Client invalidate sadece 30d cache'i hedefliyor
- **Dosya:** `lib/hooks/use-catalogs.ts:79`, `lib/contexts/query-provider.tsx:17`
- **Sorun:** `queryKeys.dashboardStats()` = `["dashboard-stats","30d"]` → sadece 30d cache'i temizlenir, 7d/90d eski kalır
- **Çözüm:** `invalidateQueries({ queryKey: ["dashboard-stats"] })` ile prefix-based invalidate yap

### 7. Backend timezone kayması — toISOString() UTC'ye çeviriyor
- **Dosya:** `backend/src/controllers/catalogs/stats.ts:18`
- **Sorun:** `toISOString()` UTC tarih döndürür, DB `CURRENT_DATE` lokal timezone'da → son gün verisi kaybolabilir
- **Çözüm:** `toLocaleDateString('sv-SE')` veya PostgreSQL ile tutarlı lokal tarih formatı kullan

### 8. Frontend timezone kayması — barChartData tarih eşleşmiyor
- **Dosya:** `components/analytics/analytics-client.tsx:118-120`
- **Sorun:** `d.toISOString().split('T')[0]` UTC, DB'den gelen `view_date` lokal → grafikte yanlış/eksik günler
- **Çözüm:** `toLocaleDateString('sv-SE')` kullanarak lokal tarih üret

### 9. Fallback increment_view_count dedup kontrolü yok
- **Dosya:** `backend/src/controllers/catalogs/public.ts:175`
- **Sorun:** RPC hatası durumunda basit `increment_view_count` çağrılıyor, aynı ziyaretçi tekrar sayılıyor
- **Çözüm:** Fallback yolunda da visitor_hash kontrolü yap, veya insert+increment birlikte yap

### 10. useDashboardStats staleTime: Infinity eski veri sorunu
- **Dosya:** `lib/hooks/use-catalogs.ts:60`
- **Sorun:** SSR initialData ile `staleTime: Infinity` → 30d'ye geçişte cache'deki sonsuz fresh veri döndürülüyor
- **Çözüm:** `staleTime`'ı timeRange değişikliğinde resetle, veya `initialData` staleTime'ını makul değere çek (5dk)

### 11. Trend etiketi "vsLastMonth" sabit, dönem değişken olmalı
- **Dosya:** `components/analytics/analytics-client.tsx:249`
- **Sorun:** Kullanıcı 7d seçse bile "Geçen aya göre" yazıyor
- **Çözüm:** timeRange'e göre dinamik etiket ("Geçen 7 güne göre", "Geçen aya göre", "Geçen 3 aya göre")

---

## P2 — Orta (UI Tutarsızlığı / Güvenlik)

### 12. Device stats yüzdeleri toplamı ≠100%
- **Dosya:** `backend/src/controllers/catalogs/stats.ts:79`
- **Sorun:** Her cihaz ayrı yuvarlanıyor → toplam 99% veya 102% olabilir
- **Çözüm:** Son kalan tipi `100 - sum(others)` olarak hesapla

### 13. get_unique_visitors_multi search_path fix eksik
- **Dosya:** `supabase/migrations/fix_security_warnings.sql`
- **Sorun:** Supabase security advisor uyarı verecek
- **Çözüm:** `ALTER FUNCTION get_unique_visitors_multi SET search_path = public;` ekle

### 14. Bot/crawler detection yok
- **Dosya:** `backend/src/controllers/catalogs/public.ts:145-147`
- **Sorun:** Botlar "desktop" olarak sayılıyor, view şişirmesi
- **Çözüm:** UA'da bot pattern tespiti yap (`/bot|crawler|spider|headless/i`), is_owner gibi sayma

### 15. Gerçek zamanlı takip iddiası ama polling yok
- **Dosya:** `components/analytics/analytics-client.tsx:481`
- **Sorun:** UI "Gerçek Zamanlı Takip" yazıyor ama refetchInterval yok
- **Çözüm:** `refetchInterval: 60_000` ekle veya iddiayı kaldır

---

## İlerleme Takibi

| # | Durum | Uygulama Detayı |
|---|-------|-----|
| 1 | ✅ | `inserted \|\| !error` koşulu kaldırıldı, her durumda `deleteCache` çağrılıyor |
| 2 | ✅ | `deleteCache(cacheKeys.stats(ownerId))` eklendi, Promise.all ile paralel |
| 3 | ✅ | Backend: prevTotalViews/prevUniqueVisitors dönüyor, Frontend: `calculateTrend(periodViews, prevTotalViews)` |
| 4 | ✅ | `totalViews` = all-time from `catalogs.view_count`, `periodViews` = current period from `catalog_views` |
| 5 | ✅ | `topCatalogs` all-time `view_count` ile sıralanıyor, `periodViews` ayrı alan olarak ekli |
| 6 | ✅ | `invalidateQueries({ queryKey: ["dashboard-stats"] })` — prefix-based, tüm timeRange'leri temizler |
| 7 | ✅ | `toLocaleDateString('sv-SE')` kullanılıyor, `toISOString()` kaldırıldı |
| 8 | ✅ | `d.toLocaleDateString('sv-SE')` kullanılıyor, `toISOString().split('T')[0]` kaldırıldı |
| 9 | ✅ | Fallback: önce `catalog_views.insert` (ON CONFLICT DO NOTHING), sadece insert başarılıysa `increment_view_count` |
| 10 | ✅ | `staleTime: 5 * 60 * 1000` (Infinity yerine), `refetchOnMount: true` |
| 11 | ✅ | `trendLabel` useMemo ile timeRange'e göre dinamik, i18n key'leri eklendi (vsLast7Days, vsLast90Days) |
| 12 | ✅ | Son device tipi `100 - sum(others)` ile hesaplanıyor, toplam her zaman 100% |
| 13 | ✅ | `ALTER FUNCTION get_unique_visitors_multi SET search_path = public;` eklendi |
| 14 | ✅ | `isBot` regex pattern ile tespit, `smartIncrementViewCount`'da early return |
| 15 | ✅ | `refetchInterval: 60 * 1000` eklendi, 60 saniyede bir otomatik güncelleme |

---

## Değiştirilen Dosyalar

| Dosya | Değişiklikler |
|-------|---------------|
| `backend/src/controllers/catalogs/public.ts` | #1, #2, #9, #14 |
| `backend/src/controllers/catalogs/stats.ts` | #3, #4, #5, #7, #12 |
| `lib/actions/catalogs.ts` | DashboardStats interface güncellendi |
| `lib/hooks/use-catalogs.ts` | #6, #10, #15 |
| `components/analytics/analytics-client.tsx` | #3, #8, #11 |
| `lib/translations/dashboard.ts` | i18n key'leri (vsLast7Days, vsLast90Days) |
| `supabase/migrations/fix_security_warnings.sql` | #13 |
