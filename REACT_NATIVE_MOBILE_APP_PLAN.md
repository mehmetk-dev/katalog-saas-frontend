# FogCatalog React Native Mobil Uygulama Planı

Son güncelleme: 2026-04-26

Bu doküman, mevcut FogCatalog web uygulamasından React Native mobil uygulamaya geçiş için ana çalışma rehberidir. Başka AI ajanları veya geliştiriciler bu dosyayı okuyarak hangi ekranların, hangi sırayla, hangi teknolojilerle ve hangi backend sözleşmeleriyle geliştirileceğini anlamalıdır.

## 1. Ana Karar

Mobil uygulama mevcut Next.js web uygulamasını birebir taşımamalı. Mevcut Express API, Supabase Auth, Supabase/PostgreSQL ve Cloudinary altyapısı korunmalı; mobil tarafta ayrı bir Expo React Native uygulaması yazılmalı.

Önerilen yaklaşım:

| Karar | Seçim | Gerekçe |
| --- | --- | --- |
| Mobil framework | Expo + React Native + TypeScript | Hızlı geliştirme, EAS Build, native modül yönetimi, OTA update imkanı |
| Mobil klasör | `mobile/` | Web uygulamasını bozmadan monorepo içinde izole ilerleme |
| Navigasyon | Expo Router | Next.js App Router mantığına yakın dosya tabanlı yapı |
| Auth | Supabase Auth client + mevcut Express API Bearer token | Backend `requireAuth` zaten Supabase JWT doğruluyor |
| Veri çekme | TanStack Query | Web tarafında zaten kullanılıyor, React Native desteği var |
| Backend | Mevcut `backend/src` korunacak | Ürün, katalog, kullanıcı, admin, bildirim endpointleri hazır |
| Görsel depolama | Cloudinary veya backend üzerinden signed upload | Mevcut web upload adapter'ı DOM `File` kullandığı için mobilde yeniden yazılmalı |
| PDF | İlk fazda paylaşılabilir katalog URL'si, sonra server-side PDF veya `expo-print` | Mevcut `html-to-image` mobilde çalışmaz |

## 2. Resmi Sürüm Notu

26 Nisan 2026 kontrolüne göre:

| Teknoloji | Durum | Mobil proje kararı |
| --- | --- | --- |
| Expo SDK | Resmi dokümanda SDK 55 güncel görünüyor | Yeni proje SDK 55 ile başlatılabilir |
| React Native | React Native 0.85 aktif destekli görünüyor | Expo stabil çizgisi kullanılmalı; SDK 55 RN 0.83 ile geliyor |
| React | Expo SDK 55 React 19.2 ile eşleşiyor | Web tarafındaki React 19 çizgisiyle uyumlu |
| SDK 56 | Expo changelog SDK 56'nın Q2 2026 hedeflendiğini belirtiyor | Uygulamaya başlamadan hemen önce yeniden kontrol edilmeli |

Kaynaklar:

| Konu | Resmi kaynak |
| --- | --- |
| Expo SDK sürümleri | https://docs.expo.dev/versions/latest/ |
| Expo SDK 55 changelog | https://expo.dev/changelog/sdk-55 |
| React Native sürümleri | https://reactnative.dev/versions |
| Expo Router stack | https://docs.expo.dev/router/advanced/stack/ |
| Supabase Expo React Native | https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native |
| Supabase React Native Auth | https://supabase.com/docs/guides/auth/quickstarts/react-native |
| TanStack Query React Native | https://tanstack.com/query/latest/docs/react/react-native |
| Expo SecureStore | https://docs.expo.dev/versions/latest/sdk/securestore/ |
| Expo ImagePicker | https://docs.expo.dev/versions/latest/sdk/imagepicker/ |
| Expo FileSystem | https://docs.expo.dev/versions/latest/sdk/filesystem/ |
| Expo Print | https://docs.expo.dev/versions/latest/sdk/print/ |
| Expo Sharing | https://docs.expo.dev/versions/latest/sdk/sharing/ |

## 3. Mevcut Proje Envanteri

Mevcut uygulama iki ana parçadan oluşuyor:

| Katman | Konum | Not |
| --- | --- | --- |
| Web frontend | `app/`, `components/`, `lib/` | Next.js 16, React 19, Tailwind, Radix, Server Actions |
| Backend API | `backend/src/` | Express 5, Supabase Admin, Redis opsiyonel, Cloudinary |
| Veritabanı | `supabase/migrations/` | PostgreSQL, Supabase Auth, RLS |
| Statik varlıklar | `public/` | Logo, placeholder, blog görselleri, import CSV |
| Testler | `tests/`, `lib/__tests__/` | Vitest ağırlıklı web testleri |

Web tarafındaki bazı parçalar mobilde doğrudan kullanılamaz:

| Web parçası | Mobilde durum |
| --- | --- |
| Radix UI bileşenleri | React Native ile uyumsuz |
| Tailwind DOM class'ları | Native styling'e çevrilmeli |
| Next Server Actions | Mobilde çalışmaz, API client yazılmalı |
| `html-to-image` | Native DOM olmadığı için çalışmaz |
| `react-pageflip` | Native alternatifi veya farklı UX gerekir |
| `File`, `Blob`, `URL.createObjectURL` tabanlı upload | Mobil URI tabanlı upload adapter gerekir |
| Next route handler `/api/excel-ai/*` | Mobilin çağırması için web deploy URL'si veya Express'e taşıma gerekir |

## 4. Hedef Mobil Mimari

Önerilen klasör yapısı:

```text
mobile/
  app/
    _layout.tsx
    index.tsx
    (auth)/
      _layout.tsx
      login.tsx
      register.tsx
      forgot-password.tsx
      reset-password.tsx
      verify.tsx
    (tabs)/
      _layout.tsx
      dashboard.tsx
      products.tsx
      catalogs.tsx
      builder.tsx
      more.tsx
    products/
      [id].tsx
      new.tsx
      import.tsx
      bulk-actions.tsx
      bulk-images.tsx
    catalogs/
      [id].tsx
      [id]/preview.tsx
      [id]/publish.tsx
      templates.tsx
    builder/
      index.tsx
      [id].tsx
      product-picker.tsx
      design.tsx
      preview.tsx
    public-catalog/
      [slug].tsx
    more/
      analytics.tsx
      categories.tsx
      settings.tsx
      notifications.tsx
      subscription.tsx
      legal.tsx
      admin.tsx
  src/
    api/
      client.ts
      auth.ts
      products.ts
      catalogs.ts
      users.ts
      notifications.ts
      admin.ts
      excel-ai.ts
    auth/
      supabase.ts
      session-store.ts
      auth-provider.tsx
    components/
      ui/
      products/
      catalogs/
      builder/
      dashboard/
    constants/
      plans.ts
      templates.ts
    hooks/
    i18n/
    theme/
    types/
    utils/
  app.json
  package.json
  tsconfig.json
```

Mobil taraf web dosyalarını import etmemeli. Paylaşılabilecek şeyler sadece saf TypeScript tipleri, validasyon mantıkları ve iş kurallarıdır. Bunlar da mümkünse `mobile/src/types` içine kopyalanmalı veya ileride ayrı bir `packages/shared` paketi oluşturulmalıdır.

## 5. Önerilen Mobil Teknoloji Yığını

| Kategori | Paket/teknoloji | Kullanım |
| --- | --- | --- |
| Runtime | Expo SDK 55 | Mobil uygulama altyapısı |
| Dil | TypeScript | Tip güvenliği |
| Navigasyon | Expo Router | Dosya tabanlı route ve deep link |
| API state | `@tanstack/react-query` | Server state, cache, retry |
| Auth | `@supabase/supabase-js` | Supabase Auth oturumu |
| Token saklama | `expo-secure-store`, gerekirse AsyncStorage adapter | Oturum kalıcılığı |
| Network | `fetch` tabanlı custom API client | Mevcut Express API ile Bearer token |
| Form | `react-hook-form` + `zod` | Ürün, profil, katalog formları |
| UI primitives | React Native core + kendi `src/components/ui` | Radix yerine native bileşenler |
| Styling | StyleSheet veya NativeWind | Ekip tercihine göre; web Tailwind class'ları birebir taşınmamalı |
| Liste | `FlatList`, büyük listede `@shopify/flash-list` | Ürün listesi, katalog ürün seçici, Excel grid |
| Görsel | `expo-image`, `expo-image-picker`, `expo-image-manipulator` | Görsel gösterme, seçme, sıkıştırma |
| Dosya | `expo-file-system`, `expo-document-picker` | CSV import/export, PDF indirme |
| Paylaşım | `expo-sharing` | Katalog linki/PDF paylaşımı |
| PDF | `expo-print` veya backend PDF endpoint | İlk MVP'de zorunlu değil |
| QR | `react-native-qrcode-svg` | Paylaşım ekranında QR üretimi |
| Grafik | `react-native-svg` + `victory-native` veya hafif chart paketi | Analitik grafikler |
| Toast/alert | Native alert + custom toast | `sonner` kullanılmaz |
| Hata izleme | Sentry React Native | Web Sentry ayrıdır |
| Build | EAS Build | iOS/Android build ve store akışı |

## 6. Mobil Env Değişkenleri

Mobil proje `NEXT_PUBLIC_` değil `EXPO_PUBLIC_` prefix kullanmalı.

| Env | Örnek | Not |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://...supabase.co` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `ey...` | Sadece anon key, service role asla mobilde olmaz |
| `EXPO_PUBLIC_API_URL` | `https://api.fogcatalog.com/api/v1` | Express API base URL |
| `EXPO_PUBLIC_WEB_URL` | `https://fogcatalog.com` | Public katalog linkleri, yasal sayfalar |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | `...` | Sadece unsigned upload kullanılırsa |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `...` | Preset güvenli kısıtlarla ayarlanmalı |

Backend notu:

| Konu | Durum |
| --- | --- |
| Native app origin | Native isteklerde çoğu zaman browser `Origin` header yoktur |
| Backend koruması | Mutative no-origin istekler `Authorization` header varsa kabul ediliyor |
| Expo Web/dev | Web veya Expo tunnel kullanılacaksa `ALLOWED_ORIGINS` içine ilgili origin eklenmeli |
| Mutations | Her `POST`, `PUT`, `PATCH`, `DELETE` isteği Bearer JWT göndermeli |

## 7. API Client Sözleşmesi

Mobilde Next `apiFetch` kullanılmayacak. Yeni bir `mobile/src/api/client.ts` yazılacak.

Zorunlu davranışlar:

| Davranış | Detay |
| --- | --- |
| Base URL | `EXPO_PUBLIC_API_URL` |
| Auth | Supabase session access token alınır, `Authorization: Bearer <token>` eklenir |
| Content-Type | JSON isteklerinde `application/json` |
| Timeout | Standart 30 saniye, image/upload 60 saniye, bulk/import 120 saniye |
| Retry | GET ve idempotent isteklerde retry, non-idempotent POST için varsayılan retry yok |
| 401 | Session refresh dene; yine başarısızsa auth stack'e yönlendir |
| 402/403 | Plan limiti veya yetki hatası olarak UI'da göster |
| 429 | Retry-after varsa kullanıcıya süre göster |
| 5xx | Toast + retry opsiyonu |

Mevcut Express endpointleri:

| Alan | Endpoint | Auth | Mobil kullanım |
| --- | --- | --- | --- |
| Health | `GET /health` | Yok | Debug ve bağlantı kontrolü |
| Auth helper | `POST /api/v1/auth/check-provider` | Yok | Login ekranında opsiyonel |
| Products list | `GET /api/v1/products?page&limit&category&search&sortBy&sortOrder` | Var | Ürün listeleme |
| Product stats | `GET /api/v1/products/stats` | Var | Dashboard ve ürün özet kartları |
| Product detail | `GET /api/v1/products/:id` | Var | Ürün detay ekranı |
| Product create | `POST /api/v1/products` | Var | Ürün formu |
| Product update | `PUT /api/v1/products/:id` | Var | Ürün formu |
| Product delete | `DELETE /api/v1/products/:id` | Var | Ürün silme |
| Products by IDs | `POST /api/v1/products/by-ids` | Var | Builder ürün seçimi |
| Bulk import | `POST /api/v1/products/bulk-import` | Var | CSV import |
| Bulk delete | `POST /api/v1/products/bulk-delete` | Var | Toplu işlem |
| Bulk price | `POST /api/v1/products/bulk-price-update` | Var | Toplu fiyat |
| Bulk image | `POST /api/v1/products/bulk-image-update` | Var | Toplu görsel |
| Bulk fields | `POST /api/v1/products/bulk-update-fields` | Var | Excel benzeri düzenleme |
| Reorder | `POST /api/v1/products/reorder` | Var | Sıralama |
| Rename category | `POST /api/v1/products/rename-category` | Var | Kategori yönetimi |
| Delete category | `POST /api/v1/products/delete-category` | Var | Kategori yönetimi |
| Check catalogs | `POST /api/v1/products/check-catalogs` | Var | Silme öncesi uyarı |
| Catalogs list | `GET /api/v1/catalogs` | Var | Katalog listeleme |
| Catalog detail | `GET /api/v1/catalogs/:id` | Var | Builder edit |
| Catalog create | `POST /api/v1/catalogs` | Var | Katalog oluşturma |
| Catalog update | `PUT /api/v1/catalogs/:id` | Var | Builder kaydetme |
| Catalog delete | `DELETE /api/v1/catalogs/:id` | Var | Katalog silme |
| Catalog publish | `PATCH /api/v1/catalogs/:id/publish` | Var | Yayınla/yayından kaldır |
| Templates | `GET /api/v1/catalogs/templates` | Var | Şablon seçici |
| Dashboard stats | `GET /api/v1/catalogs/stats?timeRange=7d|30d|90d` | Var | Dashboard/analytics |
| Public catalog | `GET /api/v1/catalogs/public/:slug` | Yok | Public viewer ve share preview |
| Public metadata | `GET /api/v1/catalogs/public/:slug/meta` | Yok | Hafif preview/meta |
| User me | `GET /api/v1/users/me` | Var | Auth bootstrap, settings |
| User update | `PUT /api/v1/users/me` | Var | Profil |
| User delete | `DELETE /api/v1/users/me` | Var | Hesap silme |
| Export counter | `POST /api/v1/users/me/export` | Var | PDF indirme limiti |
| Upgrade | `POST /api/v1/users/me/upgrade` | Var | Şu an ödeme yok, 403 döner |
| Welcome notification | `POST /api/v1/users/me/welcome` | Var | İlk kayıt sonrası |
| Notifications | `GET /api/v1/notifications` | Var | Bildirim merkezi |
| Notification read | `PATCH /api/v1/notifications/:id/read` | Var | Bildirim okundu |
| All notifications read | `PATCH /api/v1/notifications/read-all` | Var | Tümünü okundu |
| Delete notification | `DELETE /api/v1/notifications/:id` | Var | Silme |
| Delete all notifications | `DELETE /api/v1/notifications/delete-all` | Var | Toplu silme |
| Cancel subscription | `POST /api/v1/notifications/cancel-subscription` | Var | Abonelik aksiyonu |
| Admin users | `GET /api/v1/admin/users` | Admin | Mobilde düşük öncelik |
| Admin stats | `GET /api/v1/admin/stats` | Admin | Mobilde düşük öncelik |
| Admin deleted users | `GET /api/v1/admin/deleted-users` | Admin | Mobilde düşük öncelik |
| Admin plan update | `PUT /api/v1/admin/users/:id/plan` | Admin | Mobilde düşük öncelik |

Next.js içinde kalan API route'ları:

| Route | Durum | Mobil kararı |
| --- | --- | --- |
| `/api/excel-ai/intent` | Next route handler | P4 öncesinde Express backend'e taşınmalı veya mobil `EXPO_PUBLIC_WEB_URL` üzerinden çağırmalı |
| `/api/excel-ai/generate-descriptions` | Next route handler | Express'e taşınması daha doğru |
| `/api/excel-ai/generate-categories` | Next route handler | Express'e taşınması daha doğru |
| `/api/excel-ai/fix-names` | Next route handler | Express'e taşınması daha doğru |
| `/api/excel-ai/enrich-descriptions` | Next route handler | Express'e taşınması daha doğru |
| `/api/excel-ai/translate` | Next route handler | Express'e taşınması daha doğru |
| `/api/admin/activity-logs` | Next proxy | Mobil admin fazında ayrıca değerlendirilir |
| `/api/health` | Next health | Mobil Express `/health` kullanmalı |

## 8. Veri Modelleri

Mobil tipleri web dosyalarından kopyalanırken sadeleştirilmeli.

Product:

| Alan | Tip | Not |
| --- | --- | --- |
| `id` | string | UUID |
| `user_id` | string | Sahip |
| `sku` | string veya null | Stok kodu |
| `name` | string | Zorunlu |
| `description` | string veya null | Maksimum 5000 |
| `price` | number | 0 veya pozitif |
| `stock` | number | integer |
| `category` | string veya null | Virgülle çoklu kategori olabilir |
| `image_url` | string veya null | Ana görsel |
| `images` | string[] | Maksimum 20 |
| `product_url` | string veya null | Satış/detay linki |
| `custom_attributes` | `{ name, value, unit? }[]` | Maksimum 50 |
| `order` veya `display_order` | number | Backend tarafında `display_order` kullanılabiliyor |
| `created_at`, `updated_at` | string | ISO |

Catalog:

| Alan | Tip | Not |
| --- | --- | --- |
| `id` | string | UUID |
| `template_id` | string veya null | DB template ID veya layout |
| `name` | string | Katalog adı |
| `description` | string veya null | Açıklama |
| `layout` | string | Template key |
| `primary_color` | string | Tema rengi |
| `show_prices` | boolean | Fiyat görünürlüğü |
| `show_descriptions` | boolean | Açıklama görünürlüğü |
| `show_attributes` | boolean | Özellik görünürlüğü |
| `show_sku` | boolean | SKU görünürlüğü |
| `show_urls` | boolean | Ürün linkleri |
| `is_published` | boolean | Yayın durumu |
| `share_slug` | string veya null | Public URL slug |
| `product_ids` | string[] | Seçili ürünler |
| `columns_per_row` | number | 1-6 |
| `background_color` | string | Arka plan |
| `background_image` | string veya null | Kapak/arka plan |
| `background_gradient` | string veya null | Web CSS gradient, native karşılığı sınırlı |
| `logo_url` | string veya null | Firma logosu |
| `logo_position` | string veya null | Header/footer pozisyonları |
| `logo_size` | small, medium, large | Logo boyutu |
| `title_position` | left, center, right | Başlık hizası |
| `product_image_fit` | cover, contain, fill | Görsel fit |
| `enable_cover_page` | boolean | Kapak sayfası |
| `cover_image_url` | string veya null | Kapak görseli |
| `cover_description` | string veya null | Maksimum 500 |
| `enable_category_dividers` | boolean | Kategori ayraçları |
| `category_order` | string[] | Kategori sırası |
| `cover_theme` | string | Kapak tema key |
| `show_in_search` | boolean | SEO için webde anlamlı |

User:

| Alan | Tip | Not |
| --- | --- | --- |
| `id` | string | Supabase user ID |
| `email` | string | Auth email |
| `name` | string | Backend `users/me` döndürür |
| `company` | string | Firma |
| `avatar_url` | string veya undefined | Profil görseli |
| `logo_url` | string veya null | Firma logosu |
| `plan` | `free`, `plus`, `pro` | Plan |
| `productsCount` | number | Sayaç |
| `catalogsCount` | number | Sayaç |
| `maxProducts` | number | Free 50, Plus 1000, Pro 999999 |
| `maxCatalogs` | number | Free 1, Plus 10, Pro 999999 |
| `maxExports` | number | Free 1, Plus 50, Pro 999999 |
| `exportsUsed` | number | PDF export sayacı |
| `isAdmin` | boolean | Admin UI için |

Plan limitleri:

| Plan | Katalog | Ürün | PDF export |
| --- | ---: | ---: | ---: |
| Free | 1 | 50 | 1 |
| Plus | 10 | 1000 | 50 |
| Pro | Sınırsız | Sınırsız | Sınırsız |

## 9. Öncelik Sırası

Mobil geliştirme tek seferde tüm webi taşımaya çalışmamalı. Aşağıdaki sıra takip edilmeli.

### P0 - Temel Altyapı

Amaç: Mobil uygulama açılır, auth çalışır, API bağlantısı doğrulanır.

| Sıra | Ekran/modül | Dosya hedefi | Bağımlılıklar | Kabul kriteri |
| ---: | --- | --- | --- | --- |
| 1 | Expo proje kurulumu | `mobile/` | Expo SDK, TypeScript | `npx expo start` çalışır |
| 2 | Root layout | `mobile/app/_layout.tsx` | Expo Router | Auth/app stack ayrımı var |
| 3 | Supabase client | `mobile/src/auth/supabase.ts` | Supabase, SecureStore | Session persist eder |
| 4 | API client | `mobile/src/api/client.ts` | Supabase session | `/health`, `/users/me` çağrılır |
| 5 | Auth provider | `mobile/src/auth/auth-provider.tsx` | Supabase | Login state global |
| 6 | Theme/UI base | `mobile/src/theme`, `mobile/src/components/ui` | RN primitives | Button, Input, Card, EmptyState var |
| 7 | i18n base | `mobile/src/i18n` | TR/EN | İlk ekranlarda dil anahtarı var |
| 8 | Error/loading states | ortak UI | TanStack Query | Hata, boş, loading durumları standart |

### P1 - Auth ve Dashboard MVP

Amaç: Kullanıcı giriş yapar, ana panelde temel sayıları görür.

| Sıra | Ekran | Web referansı | API | Not |
| ---: | --- | --- | --- | --- |
| 1 | Welcome/landing | `app/(main)/page.tsx` | Yok | Mobilde kısa onboarding yeterli |
| 2 | Login | `app/auth/page.tsx` | Supabase Auth | Email/password, Google sonra |
| 3 | Register | `app/auth/page.tsx` | Supabase Auth | KVKK/terms linkleri web URL |
| 4 | Forgot password | `app/auth/forgot-password/page.tsx` | Supabase Auth | Deep link gerekli |
| 5 | Reset password | `app/auth/reset-password/page.tsx` | Supabase Auth | `fogcatalog://auth/reset-password` |
| 6 | Verify email | `app/auth/verify/page.tsx` | Supabase Auth | Basit bilgi ekranı |
| 7 | Dashboard | `app/dashboard/page.tsx` | `/catalogs/stats`, `/products`, `/catalogs` | KPI kartları, hızlı aksiyonlar |
| 8 | More tab | `components/dashboard/sidebar.tsx` | `/users/me` | Menü ve profil özeti |

### P2 - Ürün Yönetimi

Amaç: Mobilde ürün CRUD kullanılabilir hale gelir. Bu faz uygulamanın ticari değerinin temelidir.

| Sıra | Ekran | Web referansı | API | Kabul kriteri |
| ---: | --- | --- | --- | --- |
| 1 | Products list | `app/dashboard/products/page.tsx` | `GET /products` | Arama, kategori filtresi, sayfalama |
| 2 | Product detail | `components/products/table/*` | `GET /products/:id` | Görsel galeri, fiyat, stok, kategori |
| 3 | Product create | `components/products/modals/product-modal.tsx` | `POST /products` | Zod validasyon, plan limiti |
| 4 | Product edit | `components/products/modals/product-modal.tsx` | `PUT /products/:id` | Tüm ana alanlar düzenlenir |
| 5 | Image picker/upload | `lib/hooks/use-product-images.ts` | Cloudinary + `PUT /products/:id` | Kamera/galeri, sıkıştırma, max 20 |
| 6 | Product delete | `components/products/table/components/delete-alert-dialog.tsx` | `DELETE /products/:id` | Katalogda kullanılıyorsa uyarı |
| 7 | Bulk delete | `components/products/toolbar/bulk-actions-bar.tsx` | `POST /products/bulk-delete` | Çoklu seçim |
| 8 | Bulk price | `components/products/bulk/bulk-price-modal.tsx` | `POST /products/bulk-price-update` | Yüzde/sabit artış/azalış |
| 9 | CSV import | `components/products/modals/import-export-modal.tsx` | `POST /products/bulk-import` | İlk sürümde CSV yeterli |
| 10 | CSV export | `components/products/export/download-products-csv.ts` | `GET /products` sayfalı | Dosyaya yaz ve paylaş |
| 11 | Bulk image match | `components/products/bulk/bulk-image-upload-modal.tsx` | Cloudinary + bulk image | P2 sonu veya P3 başı |

Mobil ürün UX önerisi:

| Web davranışı | Mobil karşılığı |
| --- | --- |
| Büyük tablo | Kart liste + arama + filtre sheet |
| Modal form | Stack screen veya bottom sheet |
| Desktop bulk toolbar | Seçim modunda alt action bar |
| Drag reorder | Uzun basma ile reordering, sonraki faz |
| Çoklu attribute formu | Dinamik list item editor |

### P3 - Katalog Yönetimi ve Builder MVP

Amaç: Kullanıcı mobilde katalog oluşturur, ürün seçer, tema ayarlar ve yayınlar.

| Sıra | Ekran | Web referansı | API | Kabul kriteri |
| ---: | --- | --- | --- | --- |
| 1 | Catalogs list | `app/dashboard/catalogs/page.tsx` | `GET /catalogs` | Yayın durumu, görüntülenme, aksiyonlar |
| 2 | Create catalog | `components/catalogs/catalogs-page-client.tsx` | `POST /catalogs` | Ad, açıklama, ürün seçimi opsiyonel |
| 3 | Catalog detail | `GET /catalogs/:id` | `GET /catalogs/:id` | Özet, ürün sayısı, share slug |
| 4 | Template picker | `app/dashboard/templates/page.tsx` | `GET /catalogs/templates` | Free/Pro ayrımı |
| 5 | Product picker | `components/builder/editor/editor-content-tab.tsx` | `GET /products`, `POST /products/by-ids` | Arama, kategori, çoklu seçim |
| 6 | Builder basics | `components/builder/editor/catalog-editor.tsx` | `PUT /catalogs/:id` | İsim, açıklama, görünürlük ayarları |
| 7 | Builder design | `components/builder/editor/editor-design-tab.tsx` | `PUT /catalogs/:id` | Renk, layout, kolon, logo |
| 8 | Cover/story | `components/builder/editor/design-sections/storytelling-section.tsx` | `PUT /catalogs/:id` | Kapak ve kategori ayraçları |
| 9 | Native preview | `components/builder/preview/catalog-preview.tsx` | local state | İlk sürümde native approximate preview |
| 10 | Publish/share | `components/catalogs/share-modal.tsx` | `PATCH /catalogs/:id/publish` | Link, QR, share sheet |

Builder mobil UX önerisi:

| Web editör | Mobil karşılığı |
| --- | --- |
| Sol editör, sağ live preview | Stepper: İçerik -> Tasarım -> Önizleme -> Yayınla |
| Desktop drag/drop ürün seçimi | Checkbox list + sıralama screen |
| A4 sayfa preview | Kart/page preview, pinch zoom sonraki faz |
| Çok template | Template horizontal carousel |
| Upgrade modal | Plan limit banner + modal |

### P4 - Public Catalog, Analytics, Settings, Notifications

Amaç: Paylaşılan kataloglar mobilde düzgün görüntülenir; kullanıcı ayarları ve analitik tamamlanır.

| Sıra | Ekran | Web referansı | API | Kabul kriteri |
| ---: | --- | --- | --- | --- |
| 1 | Public catalog viewer | `app/catalog/[slug]/public-catalog-client.tsx` | `GET /catalogs/public/:slug` | Arama, kategori, ürün listeleme |
| 2 | Share screen | `components/catalogs/share-modal.tsx` | Public URL | QR, native share sheet |
| 3 | PDF action MVP | `use-public-pdf-export.ts` | `/users/me/export` + `expo-print` veya server endpoint | Limit ve paylaşım çalışır |
| 4 | Analytics | `app/dashboard/analytics/page.tsx` | `GET /catalogs/stats` | 7/30/90 gün, top kataloglar |
| 5 | Categories | `app/dashboard/categories/page.tsx` | Ürün endpointleri + category metadata | Kategori listesi, rename/delete |
| 6 | Settings | `components/settings/settings-page-client.tsx` | `/users/me` | Profil, firma, logo, sosyal linkler |
| 7 | Notifications | `lib/actions/notifications.ts` | `/notifications` | Liste, okundu, sil |
| 8 | Subscription | `components/settings/tabs/subscription-tab.tsx` | `/users/me` | Plan görünümü; upgrade ödeme yoksa pasif |

Settings uyarısı:

Mevcut backend `PUT /users/me` şu anda `full_name`, `company`, `avatar_url`, `logo_url` kabul ediyor. Web tarafında sosyal URL alanları var, ancak backend controller bu alanları yazmıyor. Mobil settings sosyal linkleri P4'te yapılacaksa önce backend schema güncellenmeli.

### P5 - Excel/AI, Admin ve İleri Özellikler

Amaç: Webdeki güçlü ama karmaşık özellikler native olarak veya mobil uyumlu alternatifle taşınır.

| Özellik | Web referansı | Mobil öneri | Öncelik |
| --- | --- | --- | --- |
| Excel editor | `app/dashboard/excel/page.tsx`, `components/excel/*` | FlashList/grid tabanlı basit toplu editör | P5 |
| Excel AI chat | `components/excel/ai/*`, `/api/excel-ai/*` | Önce Express'e taşı, sonra mobil panel | P5 |
| AI bulk engine | `components/excel/ai/bulk-engine/*` | Saf TS logic port edilebilir | P5 |
| Admin panel | `app/admin/*`, `components/admin/*` | Sadece admin kullanıcıya More -> Admin | P5 |
| Blog | `app/blog/*`, `content/blog/*` | Mobilde WebView veya web link | P5 dışı |
| Marketing pages | `features`, `pricing`, `faq`, `contact` | Auth öncesi minimal ekran + web link | P5 dışı |
| Legal pages | `app/legal/*`, `privacy`, `terms` | WebView veya statik text | P3/P4, store için gerekli |

## 10. Route Eşleme Tablosu

| Mevcut web route | Mobil route | Öncelik | Not |
| --- | --- | --- | --- |
| `/` | `app/index.tsx` | P1 | Welcome/onboarding |
| `/auth` | `app/(auth)/login.tsx`, `register.tsx` | P1 | Tek screen içinde tab da olabilir |
| `/auth/forgot-password` | `app/(auth)/forgot-password.tsx` | P1 | Supabase password reset |
| `/auth/reset-password` | `app/(auth)/reset-password.tsx` | P1 | Deep link ile |
| `/auth/verify` | `app/(auth)/verify.tsx` | P1 | Bilgilendirme |
| `/dashboard` | `app/(tabs)/dashboard.tsx` | P1 | KPI ve hızlı aksiyonlar |
| `/dashboard/products` | `app/(tabs)/products.tsx` + `app/products/*` | P2 | Ana iş ekranı |
| `/dashboard/catalogs` | `app/(tabs)/catalogs.tsx` + `app/catalogs/*` | P3 | Liste ve aksiyon |
| `/dashboard/builder?id=` | `app/(tabs)/builder.tsx`, `app/builder/[id].tsx` | P3 | Stepper tabanlı |
| `/dashboard/templates` | `app/catalogs/templates.tsx` | P3 | Builder içine de gömülebilir |
| `/dashboard/categories` | `app/more/categories.tsx` | P4 | Ürün kategorileri |
| `/dashboard/analytics` | `app/more/analytics.tsx` | P4 | Grafikler |
| `/dashboard/settings` | `app/more/settings.tsx` | P4 | Profil ve plan |
| `/dashboard/excel` | `app/more/excel.tsx` | P5 | Büyük kapsam |
| `/dashboard/admin` | `app/more/admin.tsx` | P5 | Admin claim gerektirir |
| `/admin` | `app/more/admin.tsx` | P5 | Ayrı mobil admin stack |
| `/catalog/[slug]` | `app/public-catalog/[slug].tsx` | P4 | Deep link ve public viewer |
| `/pricing` | `app/more/subscription.tsx` veya WebView | P4 | Mobil plan görünümü |
| `/features`, `/how-it-works`, `/faq`, `/contact` | WebView veya external link | P5 dışı | Pazarlama webde kalabilir |
| `/privacy`, `/terms`, `/legal/*` | `app/more/legal.tsx` veya WebView | P3/P4 | Store incelemesi için erişilebilir olmalı |
| `/blog/*` | WebView/external browser | P5 dışı | Mobil MVP kapsamı değil |

## 11. Template ve Katalog Preview Stratejisi

Mevcut web template registry:

| Template key | Mobil durumu |
| --- | --- |
| `modern-grid` | P3 MVP native kart grid |
| `compact-list` | P3 MVP native liste |
| `product-tiles` | P3/P4 native grid |
| `magazine` | P4 |
| `minimalist` | P4 |
| `bold` | P4 |
| `elegant-cards` | P4 |
| `classic-catalog` | P4 |
| `showcase` | P4 |
| `catalog-pro` | P4 |
| `fashion-lookbook` | P4 |
| `industrial` | P4 |
| `luxury` | P4 |
| `retail` | P4 |
| `tech-modern` | P4 |
| `clean-white` | P4 |

İlk mobil builder hedefi piksel-piksel PDF çıktısı değil, kullanıcıya katalog içeriğini doğru seçtiren ve yayınlatan native UX olmalı. Webdeki A4 tasarımların tam karşılığı P4/P5'te ele alınmalı.

Preview için üç aşama:

| Aşama | Yaklaşım | Ne zaman |
| --- | --- | --- |
| Native approximate preview | React Native kart/list template | P3 |
| Public mobile viewer | Public katalogu native liste/grid göster | P4 |
| Exact PDF/web preview | WebView veya server-rendered PDF görüntüleme | P5 |

## 12. Görsel Upload Planı

Mevcut web `lib/storage/cloudinary.ts` DOM `File`, `Blob`, image dimension validation ve `URL.createObjectURL` kullanıyor. Mobil için ayrı adapter şart.

Mobil upload akışı:

| Sıra | İşlem | Paket |
| ---: | --- | --- |
| 1 | Kullanıcı kamera/galeri seçer | `expo-image-picker` |
| 2 | Görsel sıkıştırılır ve boyutlandırılır | `expo-image-manipulator` |
| 3 | URI -> multipart FormData hazırlanır | React Native `FormData` |
| 4 | Cloudinary unsigned upload veya backend signed endpoint çağrılır | `fetch` |
| 5 | Dönen URL `f_auto,q_auto` optimize edilir | Cloudinary URL |
| 6 | Product `images` ve `image_url` güncellenir | `PUT /products/:id` |

Güvenlik kararı:

| Seçenek | Artı | Eksi | Karar |
| --- | --- | --- | --- |
| Cloudinary unsigned upload | Hızlı, mevcut yapıya yakın | Preset iyi kısıtlanmazsa risk | MVP'de kullanılabilir |
| Backend signed upload | Daha güvenli, denetlenebilir | Endpoint yazmak gerekir | Production için önerilir |

Backend image host kısıtı `res.cloudinary.com`, `api.cloudinary.com`, `images.unsplash.com`, `plus.unsplash.com` ile sınırlı. Mobil upload bu hostlardan URL üretmeli.

## 13. PDF ve Paylaşım Planı

Mevcut web PDF export `jsPDF` + `html-to-image` ile DOM üzerinden çalışıyor. Bu mobilde doğrudan kullanılamaz.

Fazlı yaklaşım:

| Faz | Yaklaşım | Not |
| --- | --- | --- |
| P3 | Public link paylaşımı | En hızlı değer |
| P4 | `expo-print` ile HTML tabanlı basit PDF | Görseller için base64/remote URL sorunları test edilmeli |
| P4 | Export limit için `POST /users/me/export` | Free/Plus limitleri korunmalı |
| P5 | Server-side PDF endpoint | En doğru ve tutarlı çözüm |
| P5 | PDF önizleme | Native PDF viewer veya WebView |

Önerilen backend geliştirmesi:

| Endpoint | Amaç |
| --- | --- |
| `POST /api/v1/catalogs/:id/export-pdf` | Auth kullanıcı için PDF üret |
| `GET /api/v1/catalogs/public/:slug/pdf` | Public veya signed PDF indirme |

Bu endpointler mevcut Express API'ye eklenirse web ve mobil aynı PDF motorunu kullanabilir.

## 14. Auth ve Deep Link Planı

Supabase Auth mobilde ayrı ele alınmalı.

Gerekenler:

| Konu | Yapılacak |
| --- | --- |
| App scheme | `fogcatalog://` veya `com.fogcatalog.app://` |
| Supabase redirect URLs | Mobil callback URL'leri Supabase dashboard'a eklenmeli |
| Email confirm | Email linki mobil app'e veya web callback'e dönebilir |
| Password recovery | `fogcatalog://auth/reset-password` ile açılmalı |
| OAuth Google | İlk MVP sonrası eklenmeli |
| Token refresh | Supabase auto refresh açık olmalı |
| API token | Her request öncesi session access token alınmalı |
| Logout | Supabase signOut + query cache clear |

Mevcut backend `Authorization: Bearer <access_token>` ile Supabase `auth.getUser(token)` doğruluyor. Mobil API client sadece access token göndermeli; service role veya secret key mobil bundle'a girmemeli.

## 15. UI ve Tasarım İlkeleri

Mobil uygulama webin küçültülmüş kopyası olmamalı.

| Alan | Mobil karar |
| --- | --- |
| Dashboard | KPI kartları, son kataloglar, son ürünler, hızlı aksiyon |
| Tab bar | Dashboard, Ürünler, Kataloglar, Builder, Daha Fazla |
| Ürün listesi | Kart tabanlı, hızlı arama, filtre bottom sheet |
| Formlar | Tam ekran veya bottom sheet, tek kolon |
| Builder | Çok adımlı akış, her adımda kaydet/devam et |
| Preview | Basitleştirilmiş native preview, sonra WebView/PDF |
| Empty state | Her ana ekranda aksiyonlu boş durum |
| Plan limitleri | Pasif buton yerine açıklayıcı limit kartı |
| Kritik aksiyonlar | Native confirm dialog veya custom bottom sheet |

Önerilen mobil tab yapısı:

| Tab | İçerik |
| --- | --- |
| Dashboard | Özet, hızlı aksiyon, son kataloglar |
| Ürünler | Liste, arama, filtre, ekle |
| Kataloglar | Liste, yayınla, paylaş, düzenle |
| Builder | Yeni katalog başlat veya son katalog düzenle |
| Daha Fazla | Analitik, kategoriler, ayarlar, bildirimler, yasal, destek |

## 16. i18n Planı

Mevcut web çevirileri `lib/translations/*` altında modüler. Mobilde başlangıç için aynı anahtar mantığı korunabilir, ancak web UI metinlerinin tamamı kopyalanmamalı.

Mobil i18n önceliği:

| Faz | Kapsam |
| --- | --- |
| P0 | Dil provider, `tr` varsayılan, `en` opsiyonel |
| P1 | Auth, dashboard, genel hata metinleri |
| P2 | Ürünler |
| P3 | Katalog/builder |
| P4 | Analitik/settings/legal |
| P5 | Excel AI/admin |

## 17. Test Planı

Mobil testler web Vitest testlerinden ayrı düşünülmeli.

| Test türü | Araç | Kapsam |
| --- | --- | --- |
| Type check | `tsc --noEmit` | Mobil TS hataları |
| Unit | Jest veya Vitest mobile config | API mapper, utils, validation |
| Component | React Native Testing Library | Form ve kart bileşenleri |
| Integration | Mock API + TanStack Query | Auth, products, catalogs |
| E2E | Maestro veya Detox | Login, ürün ekle, katalog oluştur |
| Manual | iOS simulator, Android emulator, fiziksel cihaz | Kamera, galeri, paylaşım, deep link |

Minimum kabul testleri:

| Faz | Test |
| --- | --- |
| P0 | App açılır, login state restore edilir, `/users/me` çağrılır |
| P1 | Login/register/logout, dashboard stats görünür |
| P2 | Ürün ekle, düzenle, sil, görsel yükle |
| P3 | Katalog oluştur, ürün seç, tema seç, yayınla |
| P4 | Public katalog aç, link paylaş, analitik görüntüle |
| P5 | Excel bulk edit, AI intent, admin ekranı |

## 18. Bilinen Backend Eksikleri ve Riskler

| Risk/eksik | Etki | Çözüm fazı |
| --- | --- | --- |
| Sosyal URL'ler backend `PUT /users/me` içinde yok | Mobil settings sosyal alanları kaydetmez | P4 öncesi backend güncelle |
| Excel AI route'ları Next içinde | Mobil doğrudan Express API ile çalışmaz | P5 öncesi Express'e taşı |
| PDF export DOM tabanlı | Mobilde birebir çalışmaz | P4/P5 server-side PDF |
| Cloudinary client unsigned upload | Mobil bundle preset taşır | Production için signed upload endpoint |
| Web template'ler DOM/Tailwind bağımlı | Native preview yeniden yazılır | P3/P4 |
| Admin endpointleri güçlü yetki ister | Mobil admin UI yanlış kullanıcıya gösterilmemeli | P5 |
| Plan upgrade endpointi 403 döner | Mobilde upgrade satışı yapılamaz | Ödeme entegrasyonu sonrası |
| Public catalog analytics user-agent'a bağlı | Mobil viewer user-agent/device tipi farklı olabilir | P4 test |
| Category metadata API server action/Supabase direct | Mobil için Express endpoint gerekebilir | P4 |

Önerilen ek Express endpointleri:

| Endpoint | Gerekçe |
| --- | --- |
| `GET /api/v1/categories` | Mobil categories ekranı için server action bağımlılığını kaldırır |
| `PUT /api/v1/categories/:name/metadata` | Kategori renk/kapak güncelleme |
| `POST /api/v1/uploads/image` | Signed Cloudinary upload |
| `DELETE /api/v1/uploads/image` | Görsel silme/arşivleme |
| `POST /api/v1/catalogs/:id/export-pdf` | Web/mobil ortak PDF |
| `POST /api/v1/excel-ai/intent` | Next bağımlılığını kaldırır |

## 19. Uygulama Yol Haritası

### Milestone 1 - Mobil iskelet

Çıktılar:

| Çıktı | Kabul |
| --- | --- |
| `mobile/` Expo app | iOS/Android dev açılır |
| Auth stack/app stack | Session'a göre yönlenir |
| API client | `/health` ve `/users/me` çalışır |
| Base UI | Button/Input/Card/Screen/EmptyState var |

### Milestone 2 - Auth ve dashboard

Çıktılar:

| Çıktı | Kabul |
| --- | --- |
| Login/register | Supabase ile çalışır |
| Forgot/reset | Deep link test edilir |
| Dashboard | KPI ve hızlı aksiyonlar |
| More tab | Profil, çıkış, yasal linkler |

### Milestone 3 - Ürün CRUD

Çıktılar:

| Çıktı | Kabul |
| --- | --- |
| Ürün listesi | Arama, filtre, pagination |
| Ürün formu | Create/update/delete |
| Görsel upload | Kamera/galeri, Cloudinary URL |
| Bulk delete/price | Seçim modu |

### Milestone 4 - Katalog ve builder MVP

Çıktılar:

| Çıktı | Kabul |
| --- | --- |
| Katalog listesi | Yayın durumu ve aksiyonlar |
| Katalog oluşturma | Plan limitiyle |
| Ürün seçici | Çoklu seçim |
| Tasarım ayarları | Renk, template, görünürlük |
| Publish/share | Link ve QR |

### Milestone 5 - Public viewer ve ayarlar

Çıktılar:

| Çıktı | Kabul |
| --- | --- |
| Public catalog | Slug ile açılır |
| Native share | Link paylaşılır |
| Settings | Profil/logo güncellenir |
| Notifications | Liste/okundu/sil |

### Milestone 6 - Analitik ve kategoriler

Çıktılar:

| Çıktı | Kabul |
| --- | --- |
| Analytics | 7/30/90 gün grafikleri |
| Categories | Liste, rename/delete |
| Dashboard polish | Trend ve top catalog |

### Milestone 7 - PDF ve import/export

Çıktılar:

| Çıktı | Kabul |
| --- | --- |
| CSV import | Mobil dosya seçimi |
| CSV export | Dosya oluştur ve paylaş |
| PDF MVP | Link veya basit PDF |
| Export limit | `/users/me/export` ile korunur |

### Milestone 8 - Excel AI ve admin

Çıktılar:

| Çıktı | Kabul |
| --- | --- |
| Bulk field editor | Ürünleri tablo benzeri düzenler |
| AI intent | Express'e taşınmış route ile |
| Admin mobile | Sadece admin kullanıcı |

## 20. AI Ajanları İçin Çalışma Kuralları

Bu projede mobil geliştirme yapan her AI ajanı aşağıdaki kurallara uymalıdır.

| Kural | Açıklama |
| --- | --- |
| Webi bozma | Mobil iş için mevcut Next.js sayfalarını gereksiz değiştirme |
| Önce API kullan | Supabase tablolarına mobilde doğrudan yazmak yerine mevcut Express API'yi tercih et |
| Service role yok | Mobil app içine `SUPABASE_SERVICE_ROLE_KEY`, Cloudinary secret veya admin secret koyma |
| Server action taşıma | `lib/actions/*` mobilde çalışmaz; API client fonksiyonuna dönüştür |
| Radix taşıma | `components/ui/*` web Radix bileşenlerini React Native'e import etme |
| DOM bağımlılığı yok | `window`, `document`, `File`, `URL.createObjectURL`, `html-to-image` kullanma |
| Küçük PR | Her çalışma bir milestone veya ekranla sınırlı olmalı |
| Tipleri koru | Product/Catalog/User tiplerini güncel backend response ile eşleştir |
| Plan limitlerini koru | Free/Plus/Pro limitleri mobilde de görünür olmalı |
| Hata durumlarını yaz | Loading, empty, error ve retry durumları olmadan ekran bitmiş sayılmaz |
| Offline varsayma | Offline destek P5 dışıdır; ancak network hataları düzgün gösterilmeli |
| UTF-8 koru | Türkçe karakterler bozulmamalı |
| Bu dosyayı güncelle | Yeni karar veya sapma olursa bu dokümana kısa not ekle |

## 21. İlk Uygulama Komutları

Başlangıçta önerilen komutlar:

```bash
mkdir mobile
cd mobile
npx create-expo-app@latest . --template default@sdk-55
npx expo install @supabase/supabase-js react-native-url-polyfill expo-secure-store @react-native-async-storage/async-storage
npm install @tanstack/react-query zod react-hook-form
npx expo install expo-router expo-linking expo-constants expo-image expo-image-picker expo-image-manipulator expo-file-system expo-document-picker expo-sharing expo-print
```

Notlar:

| Not | Açıklama |
| --- | --- |
| SDK kontrolü | Komutları çalıştırmadan önce Expo SDK latest tekrar kontrol edilmeli |
| npm/pnpm | Root projede `package-lock.json` ve `pnpm-lock.yaml` var; mobilde tek paket yöneticisi seçilmeli |
| Monorepo | İlk fazda `mobile/` kendi `package.json` ve lock dosyasıyla izole kalabilir |
| Expo Router | Default template router içermiyorsa kurulum dokümanına göre eklenmeli |

## 22. Definition of Done

Bir ekran veya modül tamamlandı sayılmadan önce:

| Kontrol | Zorunlu |
| --- | --- |
| TypeScript hatası yok | Evet |
| Loading state var | Evet |
| Empty state var | Evet |
| Error state var | Evet |
| API hataları kullanıcıya anlamlı gösteriliyor | Evet |
| Auth token doğru gönderiliyor | Auth gereken ekranlarda evet |
| Plan limitleri dikkate alınıyor | İlgili ekranlarda evet |
| iOS ve Android görünümü test edildi | Evet |
| Küçük ekran test edildi | Evet |
| İlgili endpoint dokümanda işaretlendi | Evet |

## 23. En Kritik İlk 10 İş

Başka AI ajanı nereden başlayacağını bilmiyorsa bu sırayı takip etsin:

| Sıra | İş |
| ---: | --- |
| 1 | `mobile/` Expo app scaffold |
| 2 | Supabase mobile client ve secure session store |
| 3 | API client ve `/users/me` bootstrap |
| 4 | Auth stack: login/register/logout |
| 5 | App tab layout: Dashboard, Ürünler, Kataloglar, Builder, Daha Fazla |
| 6 | Dashboard stats ve current user kartı |
| 7 | Products list + search/filter |
| 8 | Product create/edit/delete |
| 9 | Image picker + Cloudinary upload adapter |
| 10 | Catalog create + product picker + publish/share MVP |
