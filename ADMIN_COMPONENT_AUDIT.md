# 🔍 components/admin — Production Audit Report

> **Tarih:** 28 Şubat 2026  
> **Kapsam:** `components/admin/` klasörü ve tüm alt klasörleri  
> **Denetçi:** Senior TypeScript/React Architect (15 yıl deneyim)  
> **Öncelik Seviyeleri:** 🔴 Kritik | 🟡 Orta | 🟢 Düşük | ℹ️ Bilgi

---

## 📁 Klasör 1: `components/admin/` (Kök Dosyalar)

### Dosyalar:
- `activity-logs-client.tsx` (~240 satır)
- `admin-dashboard.tsx` (~95 satır)

---

### 🔴 1. PERFORMANS ANALİZİ

#### 1.1 🔴 İlk Render'da initialLogs Atılıyor (activity-logs-client.tsx:76-80)

```tsx
// SORUN: initialLogs SSR'dan geliyor ama useEffect fetchLogs'u hemen çağırıyor
// İlk sayfa yüklendiğinde initialLogs ile render → sonra aynı veri tekrar fetch
const [logs, setLogs] = useState<ActivityLog[]>(initialLogs)

useEffect(() => {
    fetchLogs()  // ← initialLogs zaten var, neden tekrar çekiyorsun?
}, [fetchLogs])
```

**Etki:** SSR avantajı tamamen kaybediliyor. Kullanıcı önce SSR verisini görüyor, sonra loading state'e düşüyor, sonra aynı veri tekrar yükleniyor. Boş yere network request + kullanıcı deneyimi bozulması.

**Düzeltme:**
```tsx
// fetchLogs'u sadece page veya filter değiştiğinde çağır
useEffect(() => {
    // İlk render'da skip et, sadece filtre/sayfa değişince fetch yap
    if (page === 1 && activityFilter === "all") return
    fetchLogs()
}, [fetchLogs])
```

#### 1.2 🟡 `limit` Değişkeni useCallback Dependency'sinde (activity-logs-client.tsx:61)

```tsx
const limit = 25  // Her render'da yeni değer (referans aynı ama semantic olarak gereksiz)

const fetchLogs = useCallback(async () => {
    // ...
}, [page, activityFilter, limit])  // ← limit sabit, dependency'de olmasına gerek yok
```

**Düzeltme:** `limit`'i component dışına `const LIMIT = 25` olarak taşı veya dependency'den çıkar.

#### 1.3 🟡 Client-Side Filtering + Server-Side Pagination Çelişkisi (activity-logs-client.tsx:82-87)

```tsx
// SORUN: Server'dan paginated veri çekiyorsun (25/sayfa)
// Ama searchTerm ile client-side filtreleme yapıyorsun
// Eğer aranan kayıt başka sayfadaysa, hiçbir zaman bulunamaz!
const filteredLogs = searchTerm
    ? logs.filter(log =>
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : logs
```

**Etki:** Kullanıcı "Ahmet" diye arar, Ahmet 2. sayfadaysa sonuç boş döner. Bu bir **bug**.

**Düzeltme:** `searchTerm`'i server'a gönder (query param olarak), ya da tüm logları çekip client'ta filtrele (ölçeklenemez).

#### 1.4 🟡 filteredLogs Her Render'da Yeniden Hesaplanıyor

```tsx
// useMemo kullanılmamış — her render'da filter çalışır
const filteredLogs = searchTerm ? logs.filter(...) : logs
```

**Düzeltme:** `useMemo` ile sarmalayın:
```tsx
const filteredLogs = useMemo(() =>
    searchTerm
        ? logs.filter(log => ...)
        : logs,
    [logs, searchTerm]
)
```

#### 1.5 🟡 Inline Fonksiyonlar (IIFE) Her Render'da Yeniden Oluşuyor (activity-logs-client.tsx:147-156, 191-200)

JSX içinde iki adet IIFE `(() => { try { ... } catch { ... } })()` kullanılmış. Her render'da yeniden oluşturuluyorlar.

**Düzeltme:** Bir `formatLogDate(dateStr, language)` utility fonksiyonu oluşturun ve component dışına taşıyın.

---

### 🔴 2. GÜVENLİK ANALİZİ

#### 2.1 🔴 IP Adresi Frontend'de Filtresiz Gösteriliyor (activity-logs-client.tsx:168-170)

```tsx
{log.ip_address && (
    <span className="hidden sm:inline">
        IP: {log.ip_address}
    </span>
)}
```

**Risk:** Admin paneli güvenliğinin düşük olduğu senaryolarda (paylaşılan hesap vb.), IP adresleri PII (Personally Identifiable Information) kapsamındadır. KVKK/GDPR açısından risk taşır.

**Öneri:** IP adresini maskelemek için: `192.168.1.***` formatında göster veya admin seviyesine göre koşullu aç.

#### 2.2 🔴 Metadata JSON.stringify ile Ham Gösteriliyor (activity-logs-client.tsx:173-177)

```tsx
{log.metadata && Object.keys(log.metadata).length > 0 && (
    <pre className="overflow-x-auto">
        {JSON.stringify(log.metadata, null, 2)}
    </pre>
)}
```

**Risk:** `metadata` backend'den gelen kontrol dışı bir JSONB alanı. İçinde:
- Hassas token'lar, şifreler veya session bilgileri olabilir
- XSS payload'ları olabilir (React `<pre>` içinde otomatik escape eder ama `dangerouslySetInnerHTML` kullanılırsa patlardı)
- İç sistem path'leri, DB schema bilgileri sızabilir

**Düzeltme:** Metadata'yı göstermeden önce whitelist-tabanlı filtreleme yapın:
```tsx
const SAFE_METADATA_KEYS = ['action', 'entity', 'entityId', 'changes']
const safeMetadata = Object.fromEntries(
    Object.entries(log.metadata).filter(([key]) => SAFE_METADATA_KEYS.includes(key))
)
```

#### 2.3 🟡 API Yanıtı Validasyonsuz Kullanılıyor (activity-logs-client.tsx:68-73)

```tsx
const response = await fetch(`/api/admin/activity-logs?${params}`)
const data = await response.json()
if (data.logs) {
    setLogs(data.logs)    // ← response.ok kontrolü yok!
    setTotal(data.total)  // ← data.total undefined olabilir
}
```

**Risk:** HTTP 401/403/500 response'ları bile `response.json()` ile parse ediliyor. Hatalı durumda `data.logs` undefined olur ama `data.total` da undefined olur → `totalPages = NaN`.

**Düzeltme:**
```tsx
if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
}
const data = await response.json()
setLogs(data.logs ?? [])
setTotal(data.total ?? 0)
```

#### 2.4 🟡 Admin API Route'da Tutarsız Tablo Adı (route.ts:18-20)

```tsx
// route.ts → "profiles" tablosunu kullanıyor
const { data: profile } = await supabase
    .from("profiles")  // ← "profiles"
    .select("is_admin")

// Ama lib/actions/admin.ts → "users" tablosunu kullanıyor
const { data: profile } = await supabase
    .from('users')      // ← "users"
    .select('is_admin')
```

**Risk:** `profiles` ve `users` farklı tablolar. Birinde `is_admin` varken diğerinde yoksa authorization bypass riski. Bu bir **tutarsızlık bug'ı**.

---

### 🟡 3. KOD KALİTESİ

#### 3.1 🟡 Hardcoded Türkçe String'ler (activity-logs-client.tsx)

```tsx
// i18n kullanılmasına rağmen birçok string hardcoded:
"Aktivite Logları"           // Satır 109
"Tüm kullanıcı aktivitelerini..." // Satır 112
"Yenile"                     // Satır 116
"Email, isim veya açıklama ile ara..." // Satır 126
"Tüm Aktiviteler"           // Satır 134
"Son Aktiviteler"            // Satır 143
"Toplam {total} aktivite kaydı" // Satır 145
"Aktivite kaydı bulunamadı"  // Satır 159
"Bilinmeyen Kullanıcı"       // Satır 170
"Bilinmiyor"                 // Satır 183, 184
"Sayfa {page} / {totalPages}" // Satır 207
```

**Etki:** İngilizce dil seçildiğinde bu string'ler Türkçe kalır. i18n desteği eksik/kırık.

#### 3.2 🟡 Duplicate ActivityLog Type Tanımı

```tsx
// components/admin/admin-dashboard/types.ts
export interface ActivityLog { id, created_at, user_email, user_name, activity_type, description, ip_address }

// lib/services/activity-logger.ts
export interface ActivityLog { ... (muhtemelen daha fazla alan) }
```

**Risk:** İki farklı `ActivityLog` tipi var. `activity-logs-client.tsx` birini, `use-admin-dashboard.tsx` diğerini import ediyor. Alanlar uyumsuz olabilir → runtime hataları.

#### 3.3 🟢 Dead Code — `users` Prop'u Kullanılmıyor (users-tab.tsx:21)

```tsx
export function UsersTab({ filteredUsers, searchTerm, onSearchChange, onPlanUpdate, t }: UsersTabProps) {
    // ↑ `users` prop tanımlı ama destructure edilmemiş → hiç kullanılmıyor
}

interface UsersTabProps {
    users: AdminUser[]       // ← Bu prop'a ihtiyaç yok
    filteredUsers: AdminUser[]
    // ...
}
```

**Düzeltme:** `users` prop'unu interface'den ve parent'tan kaldır.

#### 3.4 🟢 `as ActivityType` Type Assertion Riski (activity-logs-client.tsx:164-165)

```tsx
const Icon = getActivityIcon(log.activity_type as ActivityType)
const colorClass = getActivityColor(log.activity_type as ActivityType)
```

**Risk:** `log.activity_type` backend'den gelir. Geçersiz bir type gelirse runtime hatası oluşur.

**Düzeltme:** Guard clause ekle:
```tsx
const isValidType = (type: string): type is ActivityType => type in ACTIVITY_TYPE_LABELS
const activityType = isValidType(log.activity_type) ? log.activity_type : 'default'
```

---

### 🟡 4. MİMARİ ANALİZ

#### 4.1 🟡 İki Ayrı Activity Logs Sayfası — Duplikasyon

- `components/admin/activity-logs-client.tsx` → Ayrı sayfa, kendi fetch logic'i, kendi pagination'ı
- `components/admin/admin-dashboard/activity-logs-tab.tsx` + `use-admin-dashboard.tsx` → Dashboard tab'ı, farklı fetch logic

**Risk:** İki bileşen aynı veriyi farklı yollarla çekiyor:
1. `activity-logs-client.tsx` → Next.js API route (`/api/admin/activity-logs`) üzerinden
2. `use-admin-dashboard.tsx` → Doğrudan Supabase client ile (`createClient()`)

Bu hem code duplication hem tutarsızlık riski yaratır. RLS politikaları farklı çalışabilir.

**Düzeltme:** Tek bir `useActivityLogs` hook'u oluşturup her iki yerde kullanın.

#### 4.2 🟡 Supabase Client Doğrudan Hook İçinde (use-admin-dashboard.tsx:57-58)

```tsx
const client = createClient()  // ← Browser-side Supabase client
const { data, error } = await client
    .from("activity_logs")
    .select("*")
```

**Risk:**
- RLS politikaları bu client üzerinden farklı çalışabilir (anon key vs service role)
- Admin yetkisi burada kontrol edilmiyor — client-side Supabase browser client'ı kullanıcı JWT'si ile çalışır
- Activity logs tablosuna RLS yoksa herkes okuyabilir
- `select("*")` ile gereksiz alan çekme (over-fetching)

**Düzeltme:** Activity log'ları da server action veya API route üzerinden çekin. Direkt Supabase client kullanmaktan kaçının.

---

## 📁 Klasör 2: `components/admin/admin-dashboard/`

### Dosyalar:
- `types.ts` (~38 satır)
- `use-admin-dashboard.tsx` (~195 satır) — Ana hook
- `admin-header.tsx` (~28 satır)
- `overview-tab.tsx` (~60 satır)
- `users-tab.tsx` (~105 satır)
- `deleted-users-tab.tsx` (~74 satır)
- `feedbacks-tab.tsx` (~230 satır)
- `activity-logs-tab.tsx` (~110 satır)

---

### 🔴 1. PERFORMANS ANALİZİ

#### 1.1 🔴 Waterfall API Çağrıları (use-admin-dashboard.tsx:98-116)

```tsx
const loadData = useCallback(async () => {
    setLoading(true)
    setLogsPage(0)
    fetchActivityLogs(0).catch(...)  // ← fire-and-forget (paralel ama bağımsız hata yönetimi)

    const statsData = await getAdminStats()      // ← 1. await — sıralı!
    setStats(statsData)

    const [usersData, deletedUsersData, feedbacksData] = await Promise.all([
        getAdminUsers(),       // ← 2-4 paralel ✅
        getDeletedUsers(),
        getFeedbacks(),
    ])
    // ...
}, [fetchActivityLogs, t])
```

**Sorun:** `getAdminStats()` tamamlanana kadar diğer 3 çağrı bekleniyor. Her biri bağımsız olduğu için hepsi paralel olabilir.

**Düzeltme:**
```tsx
const [statsData, usersData, deletedUsersData, feedbacksData] = await Promise.all([
    getAdminStats(),
    getAdminUsers(),
    getDeletedUsers(),
    getFeedbacks(),
])
```

**Kazanç:** getAdminStats ~200ms sürüyorsa, toplam yükleme süresi 200ms kısalır.

#### 1.2 🔴 İki Ayrı Supabase Query — Birleştirilebilir (use-admin-dashboard.tsx:52-73)

```tsx
// Sorgu 1: Sadece count
const { count, error: countError } = await client
    .from("activity_logs")
    .select("*", { count: "exact", head: true })

// Sorgu 2: Veriyi çek
const { data, error } = await client
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to)
```

**Sorun:** İki ayrı HTTP isteği yapılıyor. Supabase tek sorguda hem count hem data dönebilir.

**Düzeltme:**
```tsx
const { data, count, error } = await client
    .from("activity_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)
```

**Kazanç:** 1 network round-trip tasarrufu.

#### 1.3 🟡 `loadData` Her `t` Değişiminde Yeniden Oluşuyor

```tsx
const loadData = useCallback(async () => {
    // ...
    toast.error(t("toasts.errorOccurred"))
}, [fetchActivityLogs, t])  // ← t değişirse loadData yeniden oluşur
```

**Sorun:** `t` fonksiyonu her dil değişiminde yeni referans alır → `loadData` yeniden oluşur → useEffect tekrar çalışır → tüm veriler tekrar çekilir.

**Düzeltme:** `t`'yi dependency'den çıkarın, catch bloğunda `t`'yi doğrudan kullanın (closure olarak):
```tsx
const loadData = useCallback(async () => {
    // ...
}, [fetchActivityLogs])  // t çıkarıldı
```
Veya `toast.error`'da sabit string kullanın.

#### 1.4 🟡 Tüm State Güncellemeleri Tek Seferde Tetiklenmiyor

```tsx
setStats(statsData)         // → re-render 1
setUsers(usersData)         // → re-render 2
setDeletedUsers(...)        // → re-render 3
setFeedbacks(feedbacksData) // → re-render 4
setLoading(false)           // → re-render 5
```

**Not:** React 18+ automatic batching bunu handle eder AMA `await` sonrası state update'ler farklı microtask'larda olabilir. `Promise.all` sonrası tek blokta olmaları birlikte batch edilmelerini garanti eder — bu kısım şu an doğru çalışıyor ama `getAdminStats` ayrı await olduğu için ilk `setStats` ayrı render tetikler.

**Düzeltme:** useReducer ile tek state objesi kullanın ya da tüm çağrıları Promise.all yapın (1.1'deki fix).

#### 1.5 🟡 `handlePlanUpdate` Stale Closure Riski (use-admin-dashboard.tsx:120)

```tsx
const handlePlanUpdate = async (userId: string, newPlan: ...) => {
    await updateUserPlan(userId, newPlan)
    setUsers(users.map(...))  // ← closure'daki `users` stale olabilir
}
```

**Sorun:** `handlePlanUpdate` `useCallback` ile sarılmamış ama `users` state'ine doğrudan closure ile bağlı. Hızlı art arda çağrılırsa eski state'i kullanır.

**Düzeltme:**
```tsx
setUsers(prevUsers => prevUsers.map(user =>
    user.id === userId ? { ...user, plan: newPlan } : user
))
```

Aynı sorun `handleFeedbackStatusUpdate`, `handleFeedbackDelete`, `handleBulkStatusUpdate`, `handleBulkDelete`, `toggleSelectFeedback`, `toggleSelectAllFeedbacks` fonksiyonlarında da var.

---

### 🔴 2. GÜVENLİK ANALİZİ

#### 2.1 🔴 Client-Side Supabase ile Admin Tablosuna Doğrudan Erişim (use-admin-dashboard.tsx:52-73)

```tsx
const client = createClient()  // ← Browser anon key ile client
const { data, error } = await client
    .from("activity_logs")
    .select("*")
```

**Risk:** Bu, browser'da çalışan bir Supabase client. `activity_logs` tablosunda RLS yoksa:
- **Herhangi bir authenticated kullanıcı** activity log'ları okuyabilir
- Admin kontrolü sadece UI seviyesinde yapılıyor (admin dashboard'a erişimi kontrol ediyor)
- Ama bir geliştirici browser console'dan `createClient().from("activity_logs").select("*")` çalıştırabilir

**Düzeltme:** `activity_logs` için RLS politikası ekleyin VEYA bu sorguyu server action'a taşıyın.

#### 2.2 🔴 Hata Mesajlarında İç Detay Sızıntısı (use-admin-dashboard.tsx:59-60, 70-71)

```tsx
toast.error(`Log sayısı alınamadı: ${countError.message}`)
toast.error(`Loglar yüklenemedi: ${error.message}`)
toast.error(`Beklenmeyen hata: ${errorMessage}`)
```

**Risk:** Supabase hata mesajları tablo adları, RLS politika detayları, PostgreSQL hata kodları içerebilir. Bunları doğrudan kullanıcıya göstermek bilgi sızıntısıdır.

**Düzeltme:** Kullanıcıya genel mesaj gösterin, detayı sadece console'a logla:
```tsx
console.error("Supabase error:", error)
toast.error("Loglar yüklenirken bir hata oluştu")
```

#### 2.3 🟡 Race Condition — Paralel Plan Güncelleme (use-admin-dashboard.tsx:118-125)

```tsx
const handlePlanUpdate = async (userId: string, newPlan: ...) => {
    try {
        await updateUserPlan(userId, newPlan)
        setUsers(users.map(user => ...))
    } catch { ... }
}
```

**Risk:** Admin aynı kullanıcı için hızlıca iki kez plan değiştirirse:
1. İlk çağrı: Free → Plus (gönderildi, bekliyor)
2. İkinci çağrı: Free → Pro (gönderildi, stale `users` state'i ile)
3. İlk tamamlanır: UI'da Plus gösterir
4. İkinci tamamlanır: UI'da Pro gösterir ama `users.map` stale closure yüzünden hatalı sonuç verebilir

**Düzeltme:** Optimistic UI yerine loading state ekleyin veya functional state update kullanın (bkz: 1.5).

#### 2.4 🟡 confirmDelete Olmadan Bulk Delete (use-admin-dashboard.tsx:154-167)

```tsx
const handleBulkDelete = async () => {
    if (selectedFeedbackIds.length === 0) { ... return }
    // Doğrudan silme — UI'da AlertDialog var ama hook'ta yoktur
    const result = await bulkDeleteFeedbacks(selectedFeedbackIds)
    // ...
}
```

**Not:** AlertDialog `feedbacks-tab.tsx`'de var, bu yüzden hook seviyesinde sorun yok. Ama hook doğrudan çağrılabilir — savunma katmanı düşük.

---

### 🟡 3. KOD KALİTESİ

#### 3.1 🟡 10+ Ayrı State — useReducer Kullanılmalı (use-admin-dashboard.tsx:23-37)

```tsx
const [stats, setStats] = useState<AdminStats>(...)
const [users, setUsers] = useState<AdminUser[]>([])
const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([])
const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<string[]>([])
const [loading, setLoading] = useState(true)
const [searchTerm, setSearchTerm] = useState("")
const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
const [loadingLogs, setLoadingLogs] = useState(false)
const [logsPage, setLogsPage] = useState(0)
const [logsTotalCount, setLogsTotalCount] = useState(0)
```

**Sorun:** 11 ayrı `useState`. Bu hook artık bir mini Redux. Karmaşıklık ve hata oranı yüksek.

**Düzeltme:** `useReducer` ile tek state objesi ve action'lar:
```tsx
type State = {
    stats: AdminStats
    users: AdminUser[]
    deletedUsers: DeletedUser[]
    feedbacks: Feedback[]
    selectedFeedbackIds: string[]
    loading: boolean
    searchTerm: string
    activityLogs: ActivityLog[]
    loadingLogs: boolean
    logsPage: number
    logsTotalCount: number
}
```

#### 3.2 🟡 Single Responsibility İhlali — God Hook (use-admin-dashboard.tsx)

Bu tek hook şunları yönetiyor:
1. ✅ Admin stats
2. ✅ Users CRUD
3. ✅ Deleted users
4. ✅ Feedback CRUD + bulk operations + selection state
5. ✅ Activity logs + pagination
6. ✅ Search/filter

**Sorun:** 6 farklı concern tek hook'ta. Test etmek, bakım yapmak ve genişletmek zorlaşır.

**Düzeltme:** Sorumlulukları ayır:
```
use-admin-dashboard.tsx  →  Orchestrator (sadece birleştirir)
├── use-admin-stats.ts   →  Stats fetching
├── use-admin-users.ts   →  Users + plan update
├── use-admin-feedbacks.ts → Feedback CRUD + selection
└── use-admin-logs.ts    →  Activity logs + pagination
```

#### 3.3 🟡 Hardcoded Türkçe String'ler (Çoklu Dosya)

```tsx
// feedbacks-tab.tsx
"Geri Bildirimler & Sorun Bildirimleri"
"Kullanıcılardan gelen tüm geri bildirimleri..."
"Beklemede", "Çözüldü", "Kapatıldı"
"Toplu Sil", "Temizle", "İptal"
"Bu geri bildirimi ve tüm ekli dosyaları..."

// activity-logs-tab.tsx
"Aktivite Logları"
"Tüm kullanıcı aktivitelerini..."
"Yükleniyor...", "Henüz aktivite kaydı bulunmuyor."
"Önceki", "Sonraki"

// use-admin-dashboard.tsx
"Geri bildirim durumu güncellendi"
"İşlem başarısız oldu"
"Geri bildirim ve ekli dosyalar silindi"
// ... dahası
```

**Etki:** EN dili seçildiğinde tüm admin paneli Türkçe kalır. i18n bütünlüğü bozuk.

#### 3.4 🟡 defaultValue vs value — Uncontrolled Select Sorunu (users-tab.tsx:79, feedbacks-tab.tsx:207)

```tsx
// users-tab.tsx
<Select
    defaultValue={user.plan || "free"}
    onValueChange={(value) => onPlanUpdate(user.id, value as "free" | "plus" | "pro")}
>
```

**Sorun:** `defaultValue` kullanılıyor. Plan güncellendikten sonra users state'i değişir ama `defaultValue` sadece ilk render'da okunur → UI güncellemesi **çalışmayabilir** (React select component davranışına bağlı).

**Düzeltme:** `value` prop'u kullanın (controlled component).

#### 3.5 🟢 Edge Case — Tarih Parse Hatası (deleted-users-tab.tsx:61, users-tab.tsx:54)

```tsx
new Date(user.created_at).toLocaleDateString("tr-TR")
```

**Risk:** `user.created_at` null/undefined olabilir → `Invalid Date`. `activity-logs-client.tsx`'de bu handle edilmiş ama burada bir koşul yok.

#### 3.6 🟢 `"Isimsiz"` Fallback Tutarsızlığı

```tsx
// users-tab.tsx → "Isimsiz"
{user.full_name || "Isimsiz"}

// activity-logs-client.tsx → "Bilinmeyen Kullanıcı"
{log.user_name || log.user_email || "Bilinmeyen Kullanıcı"}

// activity-logs-tab.tsx → "Anonim"
{log.user_email || log.user_name || "Anonim"}
```

**Sorun:** Aynı kavram için 3 farklı fallback string. Tutarsız UX.

---

### 🟡 4. MİMARİ ANALİZ

#### 4.1 🔴 Test Edilemez Yapı — Doğrudan Supabase Client Bağımlılığı

```tsx
// use-admin-dashboard.tsx
import { createClient } from "@/lib/supabase/client"

const client = createClient()
await client.from("activity_logs").select(...)
```

**Sorun:** Dependency injection yok. Bu hook'u test etmek için:
- Supabase client'ı mock etmek gerekir (module mock)
- Integration test gerektirir
- Unit test yazılamaz

**Düzeltme:** Client'ı parametre olarak alın veya abstraction layer ekleyin:
```tsx
export function useAdminDashboard(deps?: { fetchLogs?: typeof defaultFetchLogs }) {
    const fetchLogs = deps?.fetchLogs ?? defaultFetchLogs
}
```

#### 4.2 🟡 Feedbacks Tab Çok Fazla Sorumluluk Taşıyor (feedbacks-tab.tsx)

230 satırlık bu dosya şunları içeriyor:
- Tablo render
- Bulk action bar
- Selection state UI
- AlertDialog (silme onayı)
- Status badge render
- Attachment preview (image + video)

**Düzeltme:** Alt bileşenlere ayır:
```
feedbacks-tab.tsx
├── FeedbackBulkActions.tsx
├── FeedbackRow.tsx
├── FeedbackAttachments.tsx
└── FeedbackStatusBadge.tsx
```

#### 4.3 🟡 Attachment Preview'da Image URL Güvenliği (feedbacks-tab.tsx:176-190)

```tsx
{feedback.attachments?.map((url, idx) => {
    const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("/video")
    return (
        <a href={url} target="_blank" rel="noopener noreferrer">
            <NextImage src={url} alt="" fill unoptimized />
        </a>
    )
})}
```

**Risk:**
- `url` kullanıcı tarafından yüklenen bir dosya URL'si. Doğrulama/sanitization yapılmıyor.
- `javascript:` veya `data:` URI scheme'leri `<a href={url}>` ile çalışabilir (XSS)
- `unoptimized` kullanılmış — next/image optimizasyonları atlanıyor
- `next.config.mjs`'deki `images.remotePatterns` kontrolü `unoptimized` ile bypass ediliyor

**Düzeltme:**
```tsx
const isSafeUrl = (url: string) => {
    try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
    } catch { return false }
}
```

#### 4.4 ℹ️ TranslationFn Type Çok Basit (types.ts:1)

```tsx
export type TranslationFn = (key: string) => string
```

**Not:** `key` parametresi `string` yerine known translation key'lerin union type'ı olabilir. Ama mevcut i18n yapısı bunu desteklemiyorsa bu iyileştirme büyük refactoring gerektirir. Bilgi amaçlı not.

---

## 📊 ÖZET TABLOSU

| # | Dosya | Seviye | Kategori | Kısa Açıklama |
|---|-------|--------|----------|---------------|
| 1 | activity-logs-client.tsx | 🔴 | Performans | SSR verisi atılıp tekrar fetch ediliyor |
| 2 | activity-logs-client.tsx | 🔴 | Güvenlik | Metadata JSON ham gösteriliyor |
| 3 | activity-logs-client.tsx | 🔴 | Bug | Client-side search + server pagination çelişkisi |
| 4 | activity-logs-client.tsx | 🟡 | Güvenlik | API yanıt validasyonu yok |
| 5 | activity-logs-client.tsx | 🟡 | Performans | filteredLogs memoize edilmemiş |
| 6 | activity-logs-client.tsx | 🟡 | Kod Kalitesi | Hardcoded Türkçe (i18n kırık) |
| 7 | route.ts vs admin.ts | 🔴 | Güvenlik | profiles vs users tablo tutarsızlığı |
| 8 | use-admin-dashboard.tsx | 🔴 | Güvenlik | Client-side Supabase ile admin verisine erişim |
| 9 | use-admin-dashboard.tsx | 🔴 | Performans | Waterfall API çağrıları |
| 10 | use-admin-dashboard.tsx | 🔴 | Güvenlik | Hata mesajlarında iç detay sızıntısı |
| 11 | use-admin-dashboard.tsx | 🔴 | Performans | İki ayrı Supabase query birleştirilebilir |
| 12 | use-admin-dashboard.tsx | 🟡 | Performans | `t` dependency gereksiz re-fetch tetikliyor |
| 13 | use-admin-dashboard.tsx | 🟡 | Bug | Stale closure — functional update kullanılmalı |
| 14 | use-admin-dashboard.tsx | 🟡 | Kod Kalitesi | 11 ayrı useState → useReducer |
| 15 | use-admin-dashboard.tsx | 🟡 | Mimari | God hook — SRP ihlali |
| 16 | use-admin-dashboard.tsx | 🔴 | Mimari | Test edilemez — DI eksik |
| 17 | users-tab.tsx | 🟢 | Kod Kalitesi | `users` prop unused |
| 18 | users-tab.tsx | 🟡 | Bug | defaultValue vs value — uncontrolled select |
| 19 | feedbacks-tab.tsx | 🟡 | Güvenlik | Attachment URL sanitization eksik |
| 20 | feedbacks-tab.tsx | 🟡 | Mimari | Fazla sorumluluk — alt bileşenlere bölünmeli |
| 21 | Tümü | 🟡 | Kod Kalitesi | Hardcoded Türkçe string'ler (i18n desteği eksik) |
| 22 | Tümü | 🟢 | Kod Kalitesi | Fallback string tutarsızlığı ("Isimsiz"/"Anonim"/"Bilinmeyen") |
| 23 | Tümü | 🟡 | Mimari | Duplicate ActivityLog type tanımı |

---

## 🎯 ÖNCELİKLİ AKSİYON PLANI

### Acil (Sprint 1)
1. ⬜ `profiles` vs `users` tablo tutarsızlığını düzelt (güvenlik açığı)
2. ⬜ Supabase direkt erişimi server action'a taşı (RLS bypass riski)
3. ⬜ Hata mesajlarından iç detayları temizle
4. ⬜ Metadata gösteriminde whitelist filtreleme ekle
5. ⬜ API yanıt validasyonu (`response.ok` kontrolü)
6. ⬜ Client-side search'ü server-side'a taşı veya kaldır

### Kısa Vadeli (Sprint 2-3)
7. ⬜ Waterfall API çağrılarını `Promise.all`'a dönüştür
8. ⬜ Tüm stale closure sorunlarını functional update ile düzelt
9. ⬜ Supabase'de iki sorguyu tek sorguda birleştir
10. ⬜ `defaultValue` → `value` (controlled component)
11. ⬜ Attachment URL sanitization ekle
12. ⬜ SSR initialLogs'u boşa harcamayı düzelt

### Orta Vadeli (Sprint 4+)
13. ⬜ God hook'u 4 alt hook'a ayır
14. ⬜ Tüm hardcoded string'leri i18n'e taşı
15. ⬜ `useReducer` refactoring
16. ⬜ Duplicate `ActivityLog` type'ını birleştir
17. ⬜ feedbacks-tab alt bileşenlere ayır
18. ⬜ DI pattern'ı ekleyip unit test'ler yaz

---

> **Not:** Bu rapor sadece `components/admin/` klasörünü kapsar. Backend controller'lar, API route'lar ve server action'lar ayrı denetim gerektirir.
