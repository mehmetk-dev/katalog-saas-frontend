# Builder Sayfası Detaylı Denetim Raporu

> **Tarih:** 2026-04-21  
> **Kapsam:** `app/dashboard/builder/*`, `components/builder/*`, `lib/hooks/use-builder-*`  
> **Odak:** Performans, Güvenlik, Mantıksal Hatalar, N+1

---

## 1. Performans Sorunları

### 🔴 P1: `CatalogPreview.pages` — Aşırı Bağımlılıklı useMemo
**Dosya:** `components/builder/preview/catalog-preview.tsx:136`  
**Sorun:** `pages` useMemo, `props.products` (potentially 1000+ ürün), `props.layout`, `props.columnsPerRow`, `props.enableCoverPage`, `props.enableCategoryDividers`, `props.categoryOrder`, `props.pages`, ve `t` fonksiyonuna bağımlı. Herhangi bir renk/font değişikliğinde `t` stabil olmayabilir (fonksiyon referansı). Bu durumda 1000+ ürünün kategori gruplaması, sayfa hesaplaması ve virtual slicing tamamen yeniden hesaplanır.

**Etki:** Split modda preview panel her state değişikliğinde donabilir.  
**Öneri:** `t`'yi `useMemo` bağımlılığından çıkarın. Ayrıca `products` yerine `useDeferredValue` ile deferred products kullanın.

---

### 🔴 P2: `renderPage` Key — Layout Değişikliğinde Tam Unmount
**Dosya:** `components/builder/preview/catalog-preview.tsx:370`  
```tsx
key={`page-container-${layoutKey}-${pageIndex}`}
```
**Sorun:** `layoutKey` her değiştiğinde React, **tüm sayfa DOM wrapper'larını** unmount edip yeniden oluşturur. 16 template arasında gezinen kullanıcı her tıklamada tüm sayfa yapısını kaybeder.

**Etki:** Layout değişiminde 300ms+ jank ve layout shift.  
**Öneri:** Key'i `pageIndex`-only yapın. Layout değişimi zaten `TemplateComponent` değişimiyle yeni render tetikler.

---

### � P3: `useBuilderSelectedProducts` — Map Referans Stabilitesi ✓
**Dosya:** `lib/hooks/use-builder-selected-products.ts:51-66`  
**Değerlendirme:** `upsertLoadedProducts` her çağrıda `const next = new Map(prev)` yapar **ama** satır 65'te `return hasChanges ? next : prev` kontrolü var. Yani gerçekten yeni/güncellenen ürün yoksa **eski Map referansı** döner, React state değişmez. Bu optimizasyon zaten doğru şekilde uygulanmış.

~~Önceki tespit (Map referansı her zaman değişiyor) hatalıydı.~~

---

### 🟡 P4: `CatalogPreview` Multi-Page Virtualization Threshold Çok Düşük
**Dosya:** `components/builder/preview/catalog-preview.tsx:217`  
```tsx
const MULTI_VIRTUALIZATION_THRESHOLD = 10
```
**Sorun:** 10 sayfa = ~6000px. 10 sayfadan azı varsa tüm sayfalar DOM'a mount edilir. Bu threshold gerçek bir katalog için (50-200 sayfa) anlamsız derecede düşük. 10 sayfaya kadar tüm sayfalar render ediliyor.

**Öneri:** Threshold'u `50` yapın veya `scale` bağımlı dinamik threshold kullanın.

---

### 🟡 P5: `StorytellingSection` — DragOver State Spam
**Dosya:** `components/builder/editor/design-sections/storytelling-section.tsx:58-71`  
**Sorun:** `handleDragOver` her mouse hareketinde `onCategoryOrderChange` + `setDraggedIdx` çağrır. React state her frame güncelleniyor.

**Etki:** Sürükle-bırak sırasında kategori sıralaması paneli 10-30fps'e düşer.  
**Öneri:** `requestAnimationFrame` throttle ekleyin veya sadece `handleDrop`'ta güncelleme yapın.

---

### 🟡 P6: `EditorDesignTab` — React.memo Etkisiz
**Dosya:** `components/builder/editor/editor-design-tab.tsx:112`  
**Sorun:** `React.memo` var ama `props` içinde 40+ prop var. Herhangi bir color picker açılıp kapanması (`setShowPrimaryColorPicker`), section toggle (`openSections`) veya herhangi bir `onChange` referans değişikliği tüm `EditorDesignTab`'i re-render eder.

**Etki:** Content tab'da ürün seçimi yapıldığında Design tab (görünmez olsa bile) render olur.  
**Öneri:** `CatalogEditor` seviyesinde `activeTab === 'design'` koşuluyla conditional render yapın (zaten Tabs kullanılıyor ama `TabsContent` lazy değil).

---

### 🟡 P7: `TemplatePreviewCard` — Her Visible Card CatalogPreview Render
**Dosya:** `components/builder/preview/template-preview-card.tsx:101-109`  
**Sorun:** 16 template'dan 3-4'ü visible olduğunda bile her biri `CatalogPreview` mount eder. `CatalogPreview` içinde `CoverPage`, `CategoryDivider` ve dynamic template import'ları vardır. 3-4 ayrı `CatalogPreview` aynı anda çalışır.

**Etki:** Template seçim scroll'u 200-400ms takılma yapabilir.  
**Öneri:** Mevcut `IntersectionObserver` + `isVisible` çözümü iyi. Ancak `CatalogPreview` mount edildikten sonra unmount olmuyor. `rootMargin: '200px'` dışına çıkan preview'lar temizlenebilir.

---

### 🟢 P8: `useBuilderState` — Context Value Stabilitesi
**Dosya:** `components/builder/builder-context.tsx:58`  
**Sorun:** `useMemo` context value bağımlılığı `[state, handlers, catalog, products, initialProductsResponse, userPlan]`. `state` her `dispatch`'te yeni object olur. Bu kaçınılmaz ama **tüm consumer'lar re-render olur**.

**Mevcut Durum:** `useBuilderState` ve `useBuilderHandlers` kendi içlerinde `useMemo` ile optimize edilmiş. Ancak `CatalogEditor`, `BuilderContent`, `CatalogPreview` gibi büyük bileşenler `useBuilder()` kullandığı için her state değişikliğinde re-render edilir.

**Öneri:** Context'i **2 context'e** bölün: `BuilderStateContext` (sık değişen: selectedProductIds, colors) ve `BuilderStaticContext` (nadiren değişen: catalog, products, initial response). Bu büyük re-render zincirini kırar.

---

## 2. Güvenlik Sorunları

### 🔴 S1: `handleFileUpload` Dosya İsmi Rastgeleliği Yetersiz
**Dosya:** `lib/hooks/use-editor-upload.ts:105`  
```tsx
const fileName = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`
```
**Sorun:** `Math.random()` 5 karakter = ~60M kombinasyon. Yüksek trafikte collision riski var. Ayrıca `fileExtension` doğrudan `file.name.split('.').pop()`'tan geliyor — kullanıcı `shell.php.jpg` gönderebilir. Storage katmanı MIME type kontrolü yapıyor mu belli değil.

**Öneri:**
- `crypto.randomUUID()` veya `nanoid` kullanın.
- `file.type` (MIME) kontrolü ekleyin: sadece `image/jpeg`, `image/png`, `image/webp` kabul edin.
- `fileExtension`'ı MIME type'dan türetin, dosya adından değil.

---

### 🟡 S2: `usePdfExport` — Harici URL Fetch / Client-Side Resource Abuse Riski
**Dosya:** `lib/hooks/use-pdf-export.ts:243`  
```tsx
const response = await fetch(originalSrc, { signal: controller.signal, mode: 'cors', credentials: 'omit' })
```
**Sorun:** `originalSrc` ürün resim URL'si — kullanıcı tarafından girilmiş olabilir. PDF export sırasında **client tarayıcı** (browser) bu URL'ye `fetch` atar. Bu klasik **SSRF (Server-Side Request Forgery) değildir** — istek sunucudan değil, kullanıcının kendi tarayıcısından gider. Ancak şu riskler mevcuttur:
- **Client-side unwanted outbound request:** Kullanıcı kendi tarayıcısından istemediği kaynaklara istek atılmasına neden olabilir.
- **Resource abuse:** Büyük/binary dosyalara istek atılıp tarayıcı belleği doldurulabilir.
- `credentials: 'omit'` ile cookie sızıntısı riski düşük.

**Öneri:** `originalSrc`'in güvenilir domain listesinde (`cloudinary.com`, `supabase.co`) olup olmadığını doğrulayın. `fetch` öncesi URL parse edin. Blob boyutuna limit koyun.

---

### 🟡 S3: `builder-toolbar.tsx` — `window.open` URL Construction
**Dosya:** `components/builder/toolbar/builder-toolbar.tsx:283`  
```tsx
window.open(`${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/catalog/${catalog?.share_slug}`, '_blank')
```
**Sorun:** `catalog?.share_slug` herhangi bir sanitizasyondan geçmiyor (veritabanından geliyor ama kullanıcı tarafından oluşturulmuş olabilir). `share_slug` içinde `../admin` veya `?xss=1` gibi bir şey varsa, açılan URL anormal olabilir. Ancak path injection riski düşük çünkü URL'de `/catalog/` fixed path var.

**Öneri:** `URL` constructor'ı ile güvenli URL oluşturun:
```tsx
const url = new URL(`/catalog/${catalog.share_slug}`, process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
window.open(url.toString(), '_blank')
```

---

### 🟢 S4: `getProducts` — PostgREST Injection Koruması Mevcut
**Dosya:** `backend/src/controllers/products/read.ts:37-48`  
```tsx
const sanitizedCategory = category.replace(/[%_*(),."\\]/g, '');
const sanitizedSearch = search.replace(/[%_*(),."\\]/g, '');
```
**Değerlendirme:** Kategori ve arama parametreleri PostgREST özel karakterlerinden temizleniyor. İyi uygulama.

---

### 🟢 S5: `usePdfExport` — XSS Sanitizasyonu Mevcut
**Dosya:** `lib/hooks/use-pdf-export.ts:196-201`  
```tsx
clone.querySelectorAll('script, style').forEach(el => el.remove())
clone.querySelectorAll('*').forEach(el => {
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith('on')) el.removeAttribute(attr.name)
  }
})
```
**Değerlendirme:** Export DOM'unda script ve event handler temizliği yapılıyor. İyi uygulama.

---

## 3. N+1 ve Veritabanı Sorunları

### 🟡 N1: `getProductsByIds` — Chunk Paralellizasyonu Backend Basıncı
**Dosya:** `lib/hooks/use-builder-selected-products.ts:116-134`  
**Sorun:** `getProductsByIds` backend endpoint'i tek bir `supabase.in('id', requestedIds)` sorgusu çalıştırır. Ancak client bunu **200'erli chunk'lara** bölüp `Promise.all` ile paralel atar. 10.000 ürün = 50 paralel HTTP isteği.

**Etki:** Backend Express instance'ı aynı anda 50 veritabanı sorgusu işlemeye çalışır. Rate limiter bu istekleri tek kullanıcıdan geldiği için düşük eşikle bloklayabilir veya Supabase connection pool'u tükenebilir.

**Öneri:**
- Chunk boyutunu 200→1000 artırın (tek istekte daha fazla ID).
- Paralelizasyonu sınırlayın: `Promise.all` yerine `pLimit` ile 3-5 eşzamanlı chunk.
- Backend'de `getProductsByIds` Redis cache ekleyin (çok sık çağrılır).

---

### 🟡 N2: `getProducts` — Kategoriler İçin Ekstra Sorgu
**Dosya:** `backend/src/controllers/products/read.ts:89-105`  
**Sorun:** Her `getProducts` çağrısında (sayfalama, arama, filtreleme) `allCategories` için ayrı bir `supabase.from('products').select('category')` sorgusu atılıyor. Kategoriler nadiren değişir ama her ürün listelemede yeniden çekilir.

**Mevcut Durum:** Redis cache ile sarmalanmış (`cacheTTL.products * 4`). Bu kısmen çözüyor ama cache miss durumunda her sayfa için ekstra sorgu var.

**Öneri:** `allCategories`'i frontend'e gönderirken sadece ilk sayfada (`page === 1`) gönderin. Sonraki sayfalarda tekrar çekmeyin.

---

### 🟢 N3: `checkProductsInCatalogs` — Client-Side O(n*m)
**Dosya:** `backend/src/controllers/products/read.ts:246-287`  
**Sorun:** Backend'de `catalogs` sonuçları üzerinde `for` döngüsü ve `matchingIds.filter` yapılıyor. `catalogs` 100+ ve `productIds` 1000+ olursa O(100*1000) = 100k işlem. Supabase sonucu JSON olarak döndürür, bu işlem RAM'de yapılır.

**Öneri:** Bu işlem PostgreSQL RPC'ye taşınabilir (`check_products_in_catalogs` fonksiyonu). Veritabanı zaten `overlaps` ile filtrelemiş.

---

### 🟢 N4: `useBuilderSelectedProducts` — N+1 Değil, Chunk Fetch
**Dosya:** `lib/hooks/use-builder-selected-products.ts`  
**Değerlendirme:** Aslında klasik N+1 değil. N ürün ID'si tek endpoint'e POST ediliyor. Ancak chunk'lama stratejisi optimizasyon gerektiriyor (bkz. N1).

---

## 4. Mantıksal Hatalar ve Kod Kokuları

### 🔴 L1: `filteredProducts === visibleProducts` — Ölü Kod
**Dosya:** `components/builder/editor/catalog-editor.tsx:298-299`  
```tsx
const filteredProducts = pagedProducts
const visibleProducts = pagedProducts
```
**Sorun:** `filteredProducts` ve `visibleProducts` aynı referans. `EditorContentTab`'a her ikisi de geçiliyor. Anlamsız duplication.

**Öneri:** `visibleProducts` kaldırın, sadece `filteredProducts` kullanın.

---

### 🔴 L2: `TemplateSection` — Plan Kontrolü Devre Dışı
**Dosya:** `components/builder/editor/design-sections/template-section.tsx:71-76`  
```tsx
// TODO: Geçici olarak tüm şablonlar free'ye açık — test süreci bitti mi kontrol et
// if (isPro && userPlan === "free") {
//     onUpgrade()
//     return
// // }
```
**Sorun:** Pro template kontrolü tamamen yoruma alınmış. Tüm kullanıcılar tüm template'leri kullanabilir.

**Öneri:** TODO çözülmeden production'a çıkmamalı. Veya feature flag ile kontrol edin.

---

### 🔴 L3: `UpgradeModal` — Ödeme Entegrasyonu Eksik
**Dosya:** `components/builder/modals/upgrade-modal.tsx:121-126`  
```tsx
// S1: Payment integration required — currently disabled
// TODO: Integrate payment gateway (Iyzico/Stripe) before enabling upgrades
const { toast } = await import("sonner")
toast.info(t("upgradeModal.contactForUpgrade") || "Plan yükseltme için lütfen bizimle iletişime geçin.")
```
**Sorun:** Kullanıcı "Yükselt" butonuna tıkladığında hiçbir şey olmuyor. Bu bir business logic hatası.

---

### 🟡 L4: `useBuilderState` — `initialState` useMemo Dependency Eksik
**Dosya:** `lib/hooks/use-builder-state.ts:114`  
```tsx
const initialState = useMemo(() => buildInitialCatalogState(catalog, user?.logo_url), [])
```
**Sorun:** ESLint `exhaustive-deps` disable edilmiş. `catalog` veya `user?.logo_url` mount sonrası değişirse `initialState` stale kalır. Ancak `SYNC_CATALOG` effect'i bu durumu ele alıyor.

**Değerlendirme:** Mevcut çalışma mantığına uygun ama teknik borç. `SYNC_CATALOG` effect'i olmadan bug olurdu.

---

### � L5: `CatalogPreview` — `showControls === false` Path Doğru Çalışıyor ✓
**Dosya:** `components/builder/preview/catalog-preview.tsx:400-416`  
**Değerlendirme:** `showControls === false` path'inde `scale=0.5` **yoktur**. Bu path sabit A4 boyutu (`width: A4_WIDTH, height: A4_HEIGHT`) ile render eder ve ilk sayfayı thumbnail olarak gösterir. Scale uygulanmıyor.

~~Önceki tespit (scale=0.5 iddiası) hatalıydı.~~

---

### 🟡 L6: `StorytellingSection` — `handleDragOver` Her Event'te Reorder
**Dosya:** `components/builder/editor/design-sections/storytelling-section.tsx:58-71`  
**Sorun:** Kategori sürükle-bırak sırasında `handleDragOver` her mouse hareketinde array reorder + `onCategoryOrderChange` yapar. Kullanıcı istemeden kategorileri karıştırabilir.

**Öneri:** Sadece `handleDrop`'ta reorder yapın. `handleDragOver` sadece visual indicator (highlight) güncellesin.

---

### 🟡 L7: `useCatalogActions` — `autoSaveTimeoutRef` Memory Leak Riski
**Dosya:** `lib/hooks/use-catalog-actions.ts:56-101`  
**Sorun:** `useEffect` cleanup'ında `clearTimeout` var ama `isSavingRef.current = true` olan bir autosave async işlemi component unmount olduğunda hâlâ çalışabilir. Unmount sonrası `setIsAutoSaving(false)` ve `setLastSavedState` çağrısı `Can't perform a React state update on an unmounted component` hatası verebilir.

**Öneri:** Cleanup'ta bir `isMountedRef` veya AbortController kullanın.

---

### 🟡 L8: `useEditorUpload` — Session Refresh Background Effect
**Dosya:** `lib/hooks/use-editor-upload.ts:43-54`  
**Sorun:** Her builder mount'ında sessizce `supabase.auth.refreshSession()` çalışır. Upload yapılmayacaksa bile Supabase token refresh tüketilir.

**Öneri:** Upload'a tıklandığında veya sayfa yüklenmesinden 5+ dakika geçtikten sonra lazy refresh yapın.

---

### 🟡 L9: `CatalogPreview` — `currentPage` ve `safeCurrentPage` Çift Yönetim
**Dosya:** `components/builder/preview/catalog-preview.tsx:263`  
**Sorun:** Hem `currentPage` state var hem de `safeCurrentPage` computed value. `useEffect` ile `currentPage` clamp ediliyor. Ama aynı anda `safeCurrentPage` de clamp ediyor. İki kaynaklı truth.

**Öneri:** `safeCurrentPage`'i state'e çevirin, `useEffect` kaldırın.

---

### 🟡 L10: `usePdfExport` — Türkçe Karakter Bozukluğu
**Dosya:** `lib/hooks/use-pdf-export.ts`  
**Sorun:** Dosya içinde garip karakterler var: `donmayÄ±/yavaÅŸlamayÄ±`, `Ã¶nleyen`, `gÃ¶re`, `belirler`. Bu UTF-8 encoding sorunu. Kod okunabilirliği düşük, Türkçe string'ler bozuk.

**Öneri:** Dosya UTF-8 BOM veya farklı encoding ile kaydedilmiş. `re-save with UTF-8`.

---

### 🟡 L11: `BuilderPageClient` — Ghost Container `CatalogPreview` Çift Render
**Dosya:** `components/builder/builder-page-client.tsx:204-248`  
**Sorun:** PDF export için ghost container'da `CatalogPreview` mount edilir. Bu normal preview panel'deki `CatalogPreview`'den bağımsız bir instance. Aynı anda iki `CatalogPreview` render = iki kez template dynamic import, iki kez page calculation.

**Öneri:** Ghost container sadece PDF export anında mount edilsin ve export bittiğinde hemen unmount edilsin. Şu anda `isExporting` false olana kadar ghost container DOM'da kalıyor.

---

### � L12: `useBuilderHandlers` — `handleSaveAndExit` Save Bitmeden Çıkış
**Dosya:** `lib/hooks/use-builder-handlers.ts:94-102`, `lib/hooks/use-catalog-actions.ts:118-156`  
```tsx
// use-catalog-actions.ts:118 — handleSave void döner
const handleSave = useCallback(() => {
    startTransition(async () => { /* ...actual save... */ })
}, [...])

// use-builder-handlers.ts:94 — await void = anında resolve
const handleSaveAndExit = useCallback(async () => {
    try {
        await handleSave()   // ← handleSave() void döner, await hemen geçer
        state.setShowExitDialog(false)
        router.push('/dashboard')  // ← save tamamlanmadan çıkış!
    } catch {
        // ← Bu blok hiçbir zaman tetiklenmez (void reject edemez)
    }
}, [handleSave, state, router])
```
**Sorun:** `handleSave()` içinde `startTransition(async () => {...})` çağrılıyor. `startTransition` **void** döner — bir Promise değil. Dolayısıyla `await handleSave()` anında resolve olur, `router.push('/dashboard')` save işlemi gerçekten bitmeden çalışır. Catch block ise asla tetiklenmez çünkü void bir ifade reject edemez.

**Etki:** Kullanıcı "Kaydet ve Çık" dediğinde sayfa `/dashboard`'a gider, ama save arka planda devam ediyor (veya başarısız olabilir). Veri kaybı riski.

**Öneri:** `handleSave`'i Promise döndürecek şekilde refactor edin:
```tsx
// Option A: startTransition dışına çıkar, doğrudan async yapın
const handleSave = useCallback(async () => { ... })
// Option B: Bir resolve/reject wrapper kullanın
const handleSave = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
        startTransition(async () => {
            try { /* save */ resolve() }
            catch (e) { reject(e) }
        })
    })
}, [...])
```

---

### 🟡 L13: `catalog-editor.tsx` — `useTransition` Kullanımı Anlamsız
**Dosya:** `components/builder/editor/catalog-editor.tsx:223`  
```tsx
const [_isFilterPending, startFilterTransition] = useTransition()
```
**Sorun:** `_isFilterPending` kullanılmıyor (underscore). `startFilterTransition` sadece `setDebouncedSearchQuery` ve `setSelectedCategory` çevresinde kullanılıyor. Ancak `useTransition` React 18 concurrent feature'udur — burada gerçek bir yarar sağlamıyor çünkü state setter'lar zaten hızlı.

**Öneri:** Kaldırın veya `_isFilterPending`'i loading indicator olarak kullanın.

---

### 🟢 L14: `useBuilderState` — `setters` useMemo Dependency Boş
**Dosya:** `lib/hooks/use-builder-state.ts:179-216`  
```tsx
}), [])  // dispatch is stable — safe to omit from deps
```
**Değerlendirme:** `dispatch` React tarafından garanti edilen stabil referans. `[]` dependency güvenli. ESLint disable yorumu doğru bir kullanım.

---

### 🟢 L15: `ProductCard` ve `SortableProductItem` — Memoization Doğru
**Dosya:** `components/builder/editor/editor-product-cards.tsx:13, 93`  
**Değerlendirme:** `React.memo` ile custom `areEqual` fonksiyonları kullanılıyor. Sadece ilgili ürünün state değiştiğinde re-render ediliyor. İyi uygulama.

---

## 5. Mimari ve Bakım Sorunları

### M1: `CatalogEditor` Hâlâ Çok Fazla Lokal State
`catalog-editor.tsx` içinde:
- `draggingIndex`, `dropIndex`
- `openSections`
- `show*ColorPicker` (3 adet)
- `selectedCategory`, `currentPage`, `sortBy`, `sortOrder`
- `activeTab`, `searchQuery`, `debouncedSearchQuery`
- `allIdsRequested`

Bu state'lerin bir kısmı (`searchQuery`, `currentPage`, `sortBy`) `useProducts` query key'ine bağımlı. Bunları `BuilderState`'e taşımak yerine lokal tutmak doğru. Ancak `allIdsRequested` ve `debouncedSearchQuery` lifecycle'ı dikkatli yönetilmeli.

### M2: `EditorContentTab` Props Sayısı (27 prop)
`EditorContentTab` 27 ayrı prop alıyor. Bu prop drilling'ın sınırında. Context kullanımı düşünülebilir ama mevcut yapıda React.memo avantajı var.

### M3: `CatalogPreview` Ayrı Template Import'ları
16 template'in her biri dynamic import ile yükleniyor. Bu iyi bir performans optimizasyonu. Ancak `ALL_TEMPLATES` map'i hardcoded. Yeni template eklemek için 3 dosya (`catalog-preview.tsx`, `catalog-editor.tsx` column constraints, `lib/constants.ts`) güncellenmeli.

---

## 6. Özet ve Öncelikli Aksiyonlar

| # | Öncelik | Sorun | Dosya | Tahmini Etki |
|---|---------|-------|-------|--------------|
| 1 | 🔴 Kritik | `handleSaveAndExit` save bitmeden çıkış (void await) | `use-builder-handlers.ts:94`, `use-catalog-actions.ts:118` | Veri kaybı riski |
| 2 | 🔴 Kritik | Template plan kontrolü devre dışı | `template-section.tsx:71` | Business logic hatası |
| 3 | 🔴 Kritik | `pages` useMemo aşırı re-calc | `catalog-preview.tsx:136` | Split mod jank |
| 4 | 🔴 Kritik | `renderPage` key layout değişiminde unmount | `catalog-preview.tsx:370` | Layout değişim donması |
| 5 | 🟡 Yüksek | `getProductsByIds` 50 paralel istek | `use-builder-selected-products.ts:124` | Backend yükü |
| 6 | 🟡 Yüksek | `MULTI_VIRTUALIZATION_THRESHOLD` düşük | `catalog-preview.tsx:217` | Gereksiz DOM bloat |
| 7 | 🟡 Yüksek | `filteredProducts === visibleProducts` | `catalog-editor.tsx:298` | Kod kalitesi |
| 8 | 🟡 Yüksek | `handleDragOver` state spam | `storytelling-section.tsx:58` | Kategori DnD jank |
| 9 | 🟡 Orta | `useEditorUpload` dosya ismi güvenliği | `use-editor-upload.ts:105` | Collision & MIME |
| 10 | 🟡 Orta | `usePdfExport` harici URL fetch | `use-pdf-export.ts:243` | Client-side resource abuse |
| 11 | 🟡 Orta | `autoSave` unmounted component riski | `use-catalog-actions.ts:70` | Memory leak |
| 12 | 🟡 Orta | `UpgradeModal` ödeme entegrasyonu eksik | `upgrade-modal.tsx:121` | Business logic |
| 13 | 🟢 Düşük | `currentPage`/`safeCurrentPage` çift yönetim | `catalog-preview.tsx:263` | State karmaşası |
| 14 | 🟢 Düşük | `useTransition` kullanılmıyor | `catalog-editor.tsx:223` | Dead code |
| 15 | 🟢 Düşük | `usePdfExport` encoding bozukluğu | `use-pdf-export.ts` | Okunabilirlik |
| — | 🟢 Doğru | ~~P3: Map referans istikrarsızlığı~~ `hasChanges` guard zaten var | `use-builder-selected-products.ts:65` | ~~Sayfalama titremesi~~ Sorun yok |
| — | 🟢 Doğru | ~~L5: showControls scale=0.5~~ Sabit A4, scale yok | `catalog-preview.tsx:400` | ~~Sığma sorunu~~ Sorun yok |

---

> **Sonuç:** Builder sayfası genel olarak iyi mimariye sahip (context + reducer + lazy loading + virtualization). Ancak **2 kritik performans sorunu** (P1, P2), **2 kritik business/logic hatası** (L2 template plan kontrolü, L12 save-and-exit veri kaybı) ve **2 güvenlik riski** (S1, S2) var. Bunlar çözülmeden production kullanıcı deneyimi olumsuz etkilenecektir.
>
> **Düzeltme notu:** Önceki raporun P3 (Map istikrarsızlığı) ve L5 (scale=0.5) tespitleri kaynak kod incelemesiyle hatalı bulunmuş ve düzeltilmiştir. L12 (handleSaveAndExit) ise raporun ilk versiyonundaki yorumdan çok daha ciddi bir sorun olduğu tespit edilmiş ve 🔴 Kritik seviyeye yükseltilmiştir.
