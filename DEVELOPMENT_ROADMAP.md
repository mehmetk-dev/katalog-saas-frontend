# 🗺️ FogCatalog — Kapsamlı Geliştirme Yol Haritası

> **Analiz Tarihi:** 7 Mart 2026  
> **Proje:** FogCatalog SaaS — Dijital Ürün Kataloğu Platformu  
> **Stack:** Next.js 16 + React 19 + Express.js 5 + Supabase (PostgreSQL) + Cloudinary + Tailwind CSS 4  
> **Durum:** Beta — Gelir modeli henüz aktif değil  
> **Toplam Kod:** ~30,000+ satır | 18 şablon | 32 migration | 6 backend route

---

## 📊 MEVCUT DURUM ANALİZİ

### ✅ Çalışan Özellikler (Detaylı)

| Alan | Dosyalar | Detay |
|------|---------|-------|
| **Auth** | `app/auth/`, `lib/supabase/`, `middleware.ts` | Email/Password, şifre sıfırlama, email doğrulama. Supabase Auth + JWT cookie. Session middleware `updateSession()` ile refresh. |
| **Ürün Yönetimi** | `components/products/` (42 dosya), `lib/actions/products.ts` (549 satır) | CRUD, Excel/CSV import (`@e965/xlsx`), toplu fiyat güncelleme, toplu silme, toplu görsel yükleme, sıralama, kategori yönetimi (rename/delete), custom attribute. Pagination (server-side, 12-100/sayfa). |
| **Katalog Builder** | `components/builder/` (22 dosya), `editor/` (13 dosya) | 18 şablon (`templates/registry.tsx`), 2-tab editör (İçerik + Tasarım). Renk/logo/arkaplan özelleştirme, sütun sayısı, kapak sayfası, kategori ayraçları. Context-based state (`builder-context.tsx`). |
| **Public Katalog** | `app/catalog/[slug]/` (10 dosya) | Slug-bazlı URL, flipbook (`react-pageflip`), liste görünümü, zoom (`react-zoom-pan-pinch`), arama + kategori filtresi, fullscreen, lazy-loaded sayfalar (`lazy-page.tsx`). |
| **PDF Export** | `_hooks/use-public-pdf-export.ts`, `jsPDF` + `html-to-image` | A4 (794×1123px) boyutunda, kapak + kategori ayraçları dahil. İlerleme modal'ı ile progress tracking. İptal desteği. |
| **QR & Paylaşım** | `components/catalogs/share-modal.tsx` (324 satır) | QR oluşturma (`qrcode` lib), QR indirme (PNG), sosyal medya paylaşım linkleri, link kopyalama, PDF export tetikleme. |
| **Analitik** | `components/analytics/analytics-client.tsx` (491 satır) | Toplam/benzersiz ziyaretçi, cihaz dağılımı (pie chart), günlük grafikler (line chart), top kataloglar, trend hesaplama. `catalog_views` tablosundan çekiliyor. Zaman aralığı filtresi (7d/30d/90d). |
| **i18n** | `lib/translations.ts` (142KB!), `lib/contexts/i18n-provider.tsx` | TR / EN tam destek. Translation key sistemi. `useTranslation()` hook. |
| **Plan Sistemi** | `lib/constants.ts` → `PLAN_LIMITS` | Free: 1 katalog / 50 ürün / 1 export • Plus: 10 / 1000 / 50 • Pro: Sınırsız. `getPlanLimits()` helper. |
| **Admin Panel** | `app/admin/` (4 dosya), `components/admin/` (13 dosya) | Kullanıcı yönetimi, plan değiştirme, log görüntüleme, genel istatistikler. |
| **Blog** | `app/blog/`, `content/` (MDX) | MDX tabanlı, `next-mdx-remote`, `shiki` syntax highlighting. |
| **Ayarlar** | `components/settings/settings-page-client.tsx` (853 satır) | Profil düzenleme (ad, şirket, email), avatar yükleme (Cloudinary), logo yükleme, hesap silme (AlertDialog ile onay). |
| **Monitoring** | `sentry.*.config.ts`, `backend/src/services/` | Sentry error tracking (client + server + edge). Prometheus metrics (prom-client). |
| **Güvenlik** | `backend/src/middlewares/`, `lib/validations/` | RLS (Supabase), JWT auth middleware (`requireAuth`), rate limiting (`express-rate-limit`), Helmet headers, Zod validation (frontend + backend), URL sanitization (`sanitizeHref`, `sanitizeCssUrl`). |

### ❌ Eksik Alanlar (Detaylı)

| Alan | Durum | Etki |
|------|-------|------|
| **Ödeme** | `upgrade-modal.tsx` var ama ödeme yok. Pricing sayfasındaki butonlar `/auth?plan=plus`'a yönlendiriyor | 💀 Gelir = ₺0 |
| **Dark Mode** | `ThemeProvider` var (`defaultTheme="light"`), `globals.css`'te dark CSS yok | 👎 Premium algı düşük |
| **Onboarding** | Yeni kullanıcı boş dashboard'a düşüyor | 📉 Yüksek churn riski |
| **WhatsApp** | Ürünlerde `product_url` var ama WhatsApp özel entegrasyonu yok | 💸 Direkt satış kanalı kayıp |
| **Notification** | `notifications` tablosu + `backend/src/controllers/notifications.ts` var ama frontend'de real-time bildirim yok | 📵 Engagement düşük |
| **Workspace** | Hiç başlanmamış | 🏢 Enterprise müşteri kaybı |
| **Test Coverage** | Vitest kurulu, basic testler var ama kritik akışlar test edilmemiş | 🐛 Regression riski |
| **Custom Domain** | Hiç başlanmamış | 💎 Premium fiyatlandırma yapılamıyor |

---

## 🏆 FAZA 1 — Gelir Modeli & Temel İyileştirmeler

> **Toplam Süre:** ~4 Hafta | **Öncelik:** 🔴 KRİTİK — Bu faza tamamlanmadan gelir elde edilemez

---

### 1.1 💳 Ödeme Entegrasyonu (Stripe + İyzico)

#### Neden 1 Numara?
- Plan sistemi hazır (`PLAN_LIMITS` → `lib/constants.ts:26-30`)
- Fiyatlandırma sayfası hazır (`app/pricing/page.tsx` → Free: ₺0, Plus: ₺500/ay, Pro: ₺1000/ay)
- Upgrade modal hazır (`components/builder/modals/upgrade-modal.tsx`)
- **Tek eksik:** Gerçek ödeme akışı

#### Mevcut Kod Referansları

**Pricing sayfasında CTA butonları sadece link:**
```tsx
// app/pricing/page.tsx:230-234 — Değişecek alan
<Button asChild ...>
  <Link href={plan.href}>   {/* Şu an: "/auth?plan=plus" */}
    {plan.cta}
  </Link>
</Button>
```

**Dashboard layout'ta plan kontrolü:**
```tsx
// app/dashboard/layout.tsx:40-53 — Plan bilgisi zaten çekiliyor
const plan = (profile?.plan || "free").toLowerCase()
const initialUser = {
  plan: plan as "free" | "plus" | "pro",
  maxProducts: getPlanLimits(plan).maxProducts,
  maxExports: getPlanLimits(plan).maxExports,
  exportsUsed: profile?.exports_used || 0,
}
```

#### Yeni Dosya Yapısı

```
📁 app/api/payments/
│   ├── create-checkout/
│   │   └── route.ts              # POST — Stripe Checkout Session oluştur
│   ├── webhook/
│   │   └── route.ts              # POST — Stripe/İyzico webhook handler
│   ├── portal/
│   │   └── route.ts              # POST — Stripe Customer Portal oturum aç
│   └── verify/
│       └── route.ts              # GET — Ödeme doğrulama (success page)
│
├── app/dashboard/billing/
│   └── page.tsx                  # Fatura ve abonelik yönetim sayfası
│
├── components/payments/
│   ├── checkout-button.tsx       # Plan bazlı ödeme butonu
│   ├── billing-info.tsx          # Mevcut plan + fatura bilgisi kartı
│   ├── plan-comparison.tsx       # Detaylı plan karşılaştırma tablosu
│   └── payment-success.tsx       # "Ödemeniz alındı!" sayfası
│
├── lib/payments/
│   ├── stripe.ts                 # Stripe SDK wrapper + helpers
│   ├── iyzico.ts                 # İyzico SDK wrapper + helpers
│   ├── types.ts                  # Ödeme tipleri (CheckoutSession, Subscription vb.)
│   └── index.ts                  # Payment provider factory (auto-select)
│
└── backend/src/
    ├── controllers/payments.ts   # Webhook processing logic
    └── routes/payments.ts        # /api/v1/payments/* endpoint'leri
```

#### Veritabanı Migration

```sql
-- supabase/migrations/add_payment_system.sql

-- 1. Subscriptions tablosu
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Stripe bilgileri
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- İyzico bilgileri (TR kullanıcılar için)
  iyzico_subscription_ref TEXT UNIQUE,
  iyzico_customer_ref TEXT,
  
  -- Plan durumu
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'plus', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Dönem bilgileri
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Meta
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'iyzico')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Payment history tablosu
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  status TEXT CHECK (status IN ('succeeded', 'failed', 'refunded', 'pending')),
  payment_provider TEXT,
  provider_payment_id TEXT,  -- Stripe payment_intent ID veya İyzico payment ID
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own payments" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Users tablosuna ek alanlar
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_provider TEXT CHECK (payment_provider IN ('stripe', 'iyzico'));

-- 4. Index'ler
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_payment_history_user ON payment_history(user_id);
```

#### Stripe Checkout Akışı (Detaylı)

```typescript
// app/api/payments/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Fiyat ID'leri — Stripe Dashboard'tan alınacak
const PRICE_IDS = {
  plus_monthly: 'price_xxx',
  plus_yearly: 'price_xxx',
  pro_monthly: 'price_xxx',
  pro_yearly: 'price_xxx',
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, billing } = await req.json()
  // plan: 'plus' | 'pro', billing: 'monthly' | 'yearly'

  const priceId = PRICE_IDS[`${plan}_${billing}` as keyof typeof PRICE_IDS]
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  // Mevcut Stripe customer var mı kontrol et
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, email, full_name')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: profile?.full_name || undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // Checkout session oluştur
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    metadata: { user_id: user.id, plan },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    locale: 'tr',                        // Türkçe ödeme sayfası
    tax_id_collection: { enabled: true }, // Fatura için vergi numarası
  })

  return NextResponse.json({ url: session.url })
}
```

#### Webhook Handler (Kritik)

```typescript
// app/api/payments/webhook/route.ts
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // Service role — RLS bypass
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan as 'plus' | 'pro'

      if (!userId || !plan) break

      // 1. Subscription kaydı oluştur
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0].price.id,
        plan,
        status: 'active',
        billing_cycle: subscription.items.data[0].price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        payment_provider: 'stripe',
      }, { onConflict: 'user_id' })

      // 2. Users tablosundaki planı güncelle
      await supabase.from('users').update({ plan }).eq('id', userId)

      // 3. Activity log
      await supabase.from('activity_logs').insert({
        user_id: userId,
        activity_type: 'plan_upgraded',
        description: `Plan upgraded to ${plan}`,
        metadata: { plan, subscription_id: subscription.id },
      })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      // Ödeme durumu değişikliği, iptal edilme vb. handle et
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (sub) {
        await supabase.from('subscriptions').update({
          status: subscription.status === 'active' ? 'active' : 'past_due',
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq('stripe_subscription_id', subscription.id)

        // Eğer iptal edildiyse → free plana düşür (period sonunda)
        if (subscription.cancel_at_period_end) {
          // İptal period sonunda geçerli olacak, şimdilik bir şey yapma
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (sub) {
        // Planı free'ye düşür
        await supabase.from('users').update({ plan: 'free' }).eq('id', sub.user_id)
        await supabase.from('subscriptions').update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id)
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      // Ödeme geçmişi kaydet
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id, id')
        .eq('stripe_subscription_id', invoice.subscription as string)
        .single()

      if (sub) {
        await supabase.from('payment_history').insert({
          user_id: sub.user_id,
          subscription_id: sub.id,
          amount: (invoice.amount_paid || 0) / 100, // Kuruş → TL
          currency: invoice.currency?.toUpperCase() || 'TRY',
          status: 'succeeded',
          payment_provider: 'stripe',
          provider_payment_id: invoice.payment_intent as string,
          invoice_url: invoice.hosted_invoice_url,
        })
      }
      break
    }
  }

  return new Response('OK', { status: 200 })
}
```

#### Güncellenecek Mevcut Dosyalar

| Dosya | Satır | Değişiklik |
|-------|-------|-----------|
| `app/pricing/page.tsx` | L221-234 | `<Link href>` → `<CheckoutButton plan={plan.id} />` |
| `components/builder/modals/upgrade-modal.tsx` | Tamamı | Ödeme akışı entegrasyonu |
| `app/dashboard/layout.tsx` | L30-53 | Subscription tablosundan plan çekme |
| `lib/constants.ts` | L26-30 | Feature flag'lar ekleme (ör. `aiDescriptions`, `whatsappButton`) |
| `middleware.ts` | L5-7 | Subscription expiry kontrolü |
| `backend/src/index.ts` | routing | `/api/v1/payments` route ekleme |
| `.env.local` | yeni | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` |

**Tahmini Süre:** 10-14 gün

---

### 1.2 📱 WhatsApp Sipariş Butonu

#### Neden Önemli?
- Katalog görüntüleyen son kullanıcıya **direkt satış kanalı** açar
- B2B müşterilerin 1 numaralı talebi
- Analitik ile birleşince "hangi üründen kaç sipariş geldi" verisi elde edilir

#### Mevcut Kod Referansları

**Template prop'ları — `TemplateProps` interface'i (`templates/types.ts:3-30`):**
```typescript
export interface TemplateProps {
    showUrls?: boolean           // ← Mevcut: "Ürün URL Göster" toggle'ı
    // ❌ showWhatsapp yok — eklenecek
    // ❌ whatsappNumber yok — eklenecek
    // ❌ whatsappTemplate yok — eklenecek
}
```

**Modern Grid şablonunda mevcut ürün butonu (`modern-grid.tsx:189-200`):**
```tsx
{showUrls && productUrl && (
    <a href={productUrl} target="_blank" ...>
        <ShoppingBag className="w-4 h-4" style={{ color: primaryColor }} />
    </a>
)}
// ↑ Sadece ShoppingBag ikonu var, WhatsApp yok
```

**Template utils (`templates/utils.ts`) — `sanitizeHref` fonksiyonu (L29-37):**
```typescript
export function sanitizeHref(url: string | null | undefined): string | undefined {
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    if (/^mailto:/i.test(trimmed)) return trimmed
    if (/^tel:/i.test(trimmed)) return trimmed
    return undefined
}
// ↑ WhatsApp URL'leri (https://wa.me/...) zaten destekleniyor ✅
```

#### Yapılacak Değişiklikler

**1. `templates/types.ts` — TemplateProps güncelleme:**
```typescript
export interface TemplateProps {
    // ... mevcut props
    showUrls?: boolean
    // YENİ: WhatsApp entegrasyonu
    showWhatsapp?: boolean              // WhatsApp butonu göster/gizle
    whatsappNumber?: string | null       // Telefon numarası (905551234567 formatında)
    whatsappMessageTemplate?: string | null  // Mesaj şablonu
}
```

**2. `templates/utils.ts` — Yeni helper fonksiyon:**
```typescript
// ─── WhatsApp URL Builder ────────────────────────────────────────────────────
interface WhatsAppProduct {
    name: string
    price?: number | string | null
    sku?: string | null
    custom_attributes?: Array<{ name: string; value: string; unit?: string }> | null
}

/**
 * WhatsApp sipariş linki oluşturur.
 * Template değişkenleri: {product_name}, {product_price}, {product_sku}
 */
export function buildWhatsAppUrl(
    phone: string,
    product: WhatsAppProduct,
    template?: string | null
): string {
    const defaultTemplate = 'Merhaba, {product_name} ürünü hakkında bilgi almak istiyorum.'
    const message = (template || defaultTemplate)
        .replace(/{product_name}/g, product.name)
        .replace(/{product_price}/g, formatProductPrice(product as ProductLike))
        .replace(/{product_sku}/g, product.sku || '-')

    // Telefon numarasından + ve boşlukları temizle
    const cleanPhone = phone.replace(/[\s+\-()]/g, '')
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
```

**3. Tüm 18 şablon dosyasında güncelleme (örnek modern-grid.tsx):**
```tsx
// modern-grid.tsx — Mevcut ShoppingBag butonunun yanına WhatsApp butonu eklenir
import { ShoppingBag, MessageCircle } from "lucide-react"
import { buildWhatsAppUrl } from "./utils"

// Props'a eklenir:
// showWhatsapp = false,
// whatsappNumber,
// whatsappMessageTemplate,

// Ürü kartında (L189-200 arası) güncelleme:
{/* Aksiyon Butonları */}
<div className="absolute bottom-2 right-2 flex items-center gap-1">
    {/* WhatsApp Butonu — YENİ */}
    {showWhatsapp && whatsappNumber && (
        <a
            href={buildWhatsAppUrl(whatsappNumber, product, whatsappMessageTemplate)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-green-50 hover:bg-green-100 border border-green-200 shadow-sm transition-all group-hover:scale-110"
            onClick={(e) => { e.stopPropagation(); trackEvent?.('whatsapp_click', product.id) }}
        >
            <MessageCircle className="w-4 h-4 text-green-600" />
        </a>
    )}

    {/* Mevcut URL Butonu */}
    {showUrls && productUrl && (
        <a href={productUrl} target="_blank" rel="noopener noreferrer" ...>
            <ShoppingBag className="w-4 h-4" style={{ color: primaryColor }} />
        </a>
    )}
</div>
```

**4. Builder'da yeni ayar bölümü (`design-sections/`):**

Yeni dosya: `design-sections/contact-section.tsx`
```tsx
// İletişim ve Sipariş Ayarları bölümü
export function ContactSection({ ... }: ContactSectionProps) {
    return (
        <SectionWrapper id="contact" title="İletişim & Sipariş" icon={<MessageCircle />}>
            {/* WhatsApp Toggle */}
            <div role="switch" ...>
                <span>WhatsApp Sipariş Butonu</span>
                <Toggle checked={showWhatsapp} onChange={onShowWhatsappChange} />
            </div>

            {/* Telefon Numarası */}
            {showWhatsapp && (
                <>
                    <Label>WhatsApp Numarası</Label>
                    <Input
                        placeholder="+90 555 123 45 67"
                        value={whatsappNumber}
                        onChange={onWhatsappNumberChange}
                    />

                    <Label>Mesaj Şablonu</Label>
                    <Textarea
                        placeholder="Merhaba, {product_name} hakkında bilgi almak istiyorum."
                        value={whatsappMessageTemplate}
                        onChange={onWhatsappMessageTemplateChange}
                        maxLength={500}
                    />
                    <p className="text-xs text-slate-400">
                        Değişkenler: {'{product_name}'}, {'{product_price}'}, {'{product_sku}'}
                    </p>
                </>
            )}
        </SectionWrapper>
    )
}
```

**5. Veritabanı:**
```sql
-- supabase/migrations/add_whatsapp_support.sql
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS whatsapp_message_template TEXT
    DEFAULT 'Merhaba, {product_name} ürünü hakkında bilgi almak istiyorum.';
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS show_whatsapp_button BOOLEAN DEFAULT false;
```

**6. Event Tracking (Analitik):**
```sql
-- supabase/migrations/add_catalog_events.sql
CREATE TABLE catalog_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'whatsapp_click', 'url_click', 'product_view',
    'pdf_download', 'qr_scan', 'share_link_copy'
  )),
  visitor_hash TEXT,     -- Anonim ziyaretçi hash
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  metadata JSONB,        -- Ek veri (produkt adı, fiyat vb.)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hızlı sorgu için
CREATE INDEX idx_catalog_events_catalog ON catalog_events(catalog_id, event_type);
CREATE INDEX idx_catalog_events_product ON catalog_events(product_id, event_type);
CREATE INDEX idx_catalog_events_date ON catalog_events(created_at);

-- RLS — Public event'ler authenticated olmayan kullanıcılar tarafından da oluşturulabilir
ALTER TABLE catalog_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert events" ON catalog_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Catalog owners can read events" ON catalog_events
  FOR SELECT USING (
    catalog_id IN (SELECT id FROM catalogs WHERE user_id = auth.uid())
  );
```

**7. Güncellenecek dosyalar listesi:**

| Dosya | Değişiklik |
|-------|-----------|
| `components/catalogs/templates/types.ts` | 3 yeni prop |
| `components/catalogs/templates/utils.ts` | `buildWhatsAppUrl()` fonksiyonu |
| `components/catalogs/templates/modern-grid.tsx` | WhatsApp butonu |
| `components/catalogs/templates/compact-list.tsx` | WhatsApp butonu |
| `components/catalogs/templates/magazine.tsx` | WhatsApp butonu |
| `components/catalogs/templates/minimalist.tsx` | WhatsApp butonu |
| `components/catalogs/templates/bold.tsx` | WhatsApp butonu |
| `components/catalogs/templates/elegant-cards.tsx` | WhatsApp butonu |
| `components/catalogs/templates/classic-catalog.tsx` | WhatsApp butonu |
| `components/catalogs/templates/showcase.tsx` | WhatsApp butonu |
| `components/catalogs/templates/catalog-pro.tsx` | WhatsApp butonu |
| `components/catalogs/templates/fashion-lookbook.tsx` | WhatsApp butonu |
| `components/catalogs/templates/industrial.tsx` | WhatsApp butonu |
| `components/catalogs/templates/luxury.tsx` | WhatsApp butonu |
| `components/catalogs/templates/product-tiles.tsx` | WhatsApp butonu |
| `components/catalogs/templates/tech-modern.tsx` | WhatsApp butonu |
| `components/catalogs/templates/clean-white.tsx` | WhatsApp butonu |
| `components/catalogs/templates/retail.tsx` | WhatsApp butonu |
| `components/catalogs/templates/registry.tsx` | Prop geçirme |
| `components/builder/editor/design-sections/index.ts` | ContactSection export |
| `components/builder/editor/editor-design-tab.tsx` | Yeni sekme ekleme |
| `components/builder/editor/design-sections/types.ts` | Yeni prop tipleri |
| `lib/actions/catalogs.ts` | Catalog interface → 3 yeni alan |
| `lib/validations/index.ts` | catalogUpdateSchema güncelleme |
| `backend/src/controllers/catalogs/` | Yeni alanlar validation |

**Tahmini Süre:** 4-5 gün

---

### 1.3 🌙 Dark Mode

#### Mevcut Durum (Detaylı)

```tsx
// app/dashboard/layout.tsx:57 — ThemeProvider zaten var ama light-only
<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
```

```tsx
// components/theme-provider.tsx — Minimal wrapper (303 bytes)
"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// ... sadece proxy, custom logic yok
```

```css
/* app/globals.css — 20KB+, dark mode class'ları yok
   Tüm renkler hardcoded: bg-white, text-slate-900, border-slate-200 */
```

#### Uygulama Stratejisi

**CSS Custom Properties yaklaşımı** (Tailwind'in `dark:` prefix'i yerine):

```css
/* app/globals.css — Eklenecek CSS değişkenleri */

/* ─── Design Tokens ─── */
:root {
  /* Surfaces */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;
  --color-bg-card: #ffffff;
  --color-bg-card-hover: #f8fafc;
  --color-bg-overlay: rgba(0, 0, 0, 0.5);
  --color-bg-input: #ffffff;

  /* Text */
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-tertiary: #94a3b8;
  --color-text-inverse: #ffffff;

  /* Borders */
  --color-border-primary: #e2e8f0;
  --color-border-secondary: #f1f5f9;
  --color-border-focus: #6366f1;

  /* Accents */
  --color-accent: #6366f1;
  --color-accent-hover: #4f46e5;
  --color-accent-light: #eef2ff;

  /* Status */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* Toast */
  --toast-bg: rgba(255, 255, 255, 0.95);
  --toast-text: #0f172a;
  --toast-border: #e2e8f0;
  --toast-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.dark {
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-tertiary: #334155;
  --color-bg-card: #1e293b;
  --color-bg-card-hover: #334155;
  --color-bg-overlay: rgba(0, 0, 0, 0.7);
  --color-bg-input: #1e293b;

  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-tertiary: #64748b;
  --color-text-inverse: #0f172a;

  --color-border-primary: #334155;
  --color-border-secondary: #1e293b;
  --color-border-focus: #818cf8;

  --color-accent: #818cf8;
  --color-accent-hover: #6366f1;
  --color-accent-light: rgba(99, 102, 241, 0.1);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);

  --toast-bg: rgba(30, 41, 59, 0.95);
  --toast-text: #f1f5f9;
  --toast-border: #334155;
  --toast-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}
```

**Theme Toggle bileşeni:**
```tsx
// components/theme-toggle.tsx — YENİ
"use client"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-full"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Tema Değiştir</span>
    </Button>
  )
}
```

**Tahmini Süre:** 5-7 gün (tüm bileşenler refactor edilecek)

---

### 1.4 📋 Katalog Klonlama

#### Mevcut Kod

```tsx
// components/catalogs/catalogs-page-client.tsx — L97-110 handleDelete fonksiyonu var
// Aynı pattern ile handleDuplicate eklenecek
```

#### Uygulama

```typescript
// lib/actions/catalogs.ts — YENİ FONKSİYON
export async function duplicateCatalog(catalogId: string): Promise<Catalog> {
  // 1. Orijinal kataloğu getir
  const original = await getCatalog(catalogId)
  if (!original) throw new Error("Katalog bulunamadı")

  // 2. Kopyasını oluştur
  const { id, created_at, updated_at, view_count, share_slug, is_published, ...rest } = original
  const duplicate = await createCatalog({
    ...rest,
    name: `${original.name} (Kopya)`,
    is_published: false,     // Kopyası yayınlanmamış başlar
    share_slug: null,        // Yeni slug gerekecek
  })

  return duplicate
}
```

```tsx
// catalogs-page-client.tsx — Dropdown menüye "Kopyala" ekleme
<DropdownMenuItem
  onClick={() => handleDuplicate(catalog.id)}
  className="flex items-center gap-2"
>
  <Copy className="w-4 h-4" />
  {t('catalogs.duplicate')}
</DropdownMenuItem>
```

**Backend endpoint:**
```typescript
// backend/src/routes/catalogs.ts
router.post('/:id/duplicate', requireAuth, CatalogController.duplicateCatalog);
```

**Tahmini Süre:** 1 gün

---

### 1.5 🎨 Hazır Renk Paletleri

#### Uygulama

```typescript
// lib/color-palettes.ts — YENİ DOSYA
export interface ColorPalette {
  id: string
  name: string
  nameEn: string
  preview: [string, string, string, string]  // 4 renk önizleme
  values: {
    primary_color: string
    background_color: string
    header_text_color: string
    background_gradient?: string
  }
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'modern-dark',
    name: 'Modern Koyu',
    nameEn: 'Modern Dark',
    preview: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
    values: {
      primary_color: '#e94560',
      background_color: '#1a1a2e',
      header_text_color: '#ffffff',
    }
  },
  {
    id: 'elegant-gold',
    name: 'Zarif Altın',
    nameEn: 'Elegant Gold',
    preview: ['#faf3e0', '#d4a574', '#8b6914', '#2c1810'],
    values: {
      primary_color: '#8b6914',
      background_color: '#faf3e0',
      header_text_color: '#2c1810',
    }
  },
  {
    id: 'eco-green',
    name: 'Eko Yeşil',
    nameEn: 'Eco Green',
    preview: ['#f0f7f4', '#52b788', '#2d6a4f', '#1b4332'],
    values: {
      primary_color: '#2d6a4f',
      background_color: '#f0f7f4',
      header_text_color: '#ffffff',
    }
  },
  {
    id: 'ocean-blue',
    name: 'Okyanus',
    nameEn: 'Ocean Blue',
    preview: ['#f0f4ff', '#3b82f6', '#1e40af', '#0f172a'],
    values: {
      primary_color: '#1e40af',
      background_color: '#f0f4ff',
      header_text_color: '#ffffff',
    }
  },
  {
    id: 'rose-blush',
    name: 'Gül Kurusu',
    nameEn: 'Rose Blush',
    preview: ['#fff5f5', '#f43f5e', '#be123c', '#4c0519'],
    values: {
      primary_color: '#be123c',
      background_color: '#fff5f5',
      header_text_color: '#ffffff',
    }
  },
  {
    id: 'monochrome',
    name: 'Siyah & Beyaz',
    nameEn: 'Monochrome',
    preview: ['#fafafa', '#71717a', '#27272a', '#09090b'],
    values: {
      primary_color: '#27272a',
      background_color: '#fafafa',
      header_text_color: '#ffffff',
    }
  },
  {
    id: 'sunset-warm',
    name: 'Gün Batımı',
    nameEn: 'Sunset Warm',
    preview: ['#fef3c7', '#f59e0b', '#d97706', '#78350f'],
    values: {
      primary_color: '#d97706',
      background_color: '#fef3c7',
      header_text_color: '#ffffff',
    }
  },
  {
    id: 'lavender-dream',
    name: 'Lavanta',
    nameEn: 'Lavender Dream',
    preview: ['#f5f3ff', '#8b5cf6', '#6d28d9', '#3b0764'],
    values: {
      primary_color: '#6d28d9',
      background_color: '#f5f3ff',
      header_text_color: '#ffffff',
    }
  },
]
```

Entegrasyon noktası: `appearance-section.tsx` dosyasına "Hazır Paletler" horizontal scroll listesi eklenir. Tıklandığında `onColorChange`, `onBackgroundColorChange`, `onHeaderTextColorChange` fonksiyonları tek seferde çağrılır.

**Tahmini Süre:** 1-2 gün

---

### 1.6 🚀 Onboarding Akışı

#### Adımlar

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│ 1. Hoş Geldin │───►│ 2. İlk Ürün │───►│ 3. Katalog  │───►│ 4. Yayınla  │───►│ 5. Tamamla │
│  Profil bilgi │    │ Ekle / Demo  │    │ Oluştur     │    │ & Paylaş    │    │ 🎉 Confetti │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

#### Teknik

```sql
-- Migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
```

```typescript
// lib/hooks/use-onboarding.ts
"use client"
import { useState, useCallback } from "react"
import { useUser } from "@/lib/contexts/user-context"

export function useOnboarding() {
  const { user } = useUser()
  const [step, setStep] = useState(user?.onboardingStep || 0)
  const isCompleted = user?.onboardingCompleted || false

  const nextStep = useCallback(async () => {
    const newStep = step + 1
    setStep(newStep)
    await fetch('/api/onboarding/progress', {
      method: 'POST',
      body: JSON.stringify({ step: newStep })
    })
  }, [step])

  const complete = useCallback(async () => {
    await fetch('/api/onboarding/complete', { method: 'POST' })
  }, [])

  return { step, nextStep, complete, isCompleted, shouldShow: !isCompleted }
}
```

**Tahmini Süre:** 5-7 gün

---

## 🚀 FAZA 2 — Büyüme Özellikleri (Özet)

> **Süre:** 4-6 Hafta | FAZA 1 tamamlandıktan sonra

| # | Özellik | Yeni Dosyalar | Migration | Süre |
|---|---------|--------------|-----------|------|
| 2.1 | 🤖 AI Ürün Açıklama | `app/api/ai/`, `lib/ai/`, `components/products/ai-*` | Yok | 5-7 gün |
| 2.2 | 🔒 Katalog Şifre Koruması | `app/catalog/[slug]/password/`, `password-gate.tsx` | `catalogs` → +2 kolon | 3-4 gün |
| 2.3 | ⏰ Süreli Kataloglar | `expired-catalog.tsx` | `catalogs` → +2 kolon | 2-3 gün |
| 2.4 | 📊 Gelişmiş Analitik v2 | `components/analytics/*` (5 yeni dosya) | `catalog_events` + materialized view | 8-10 gün |
| 2.5 | 👥 Workspace Sistemi | `app/dashboard/workspace/`, `components/workspace/` | 3 yeni tablo + RLS | 2-3 hafta |
| 2.6 | 📧 Haftalık E-posta | `lib/email/`, `backend/src/controllers/email.ts` | Yok | 4-5 gün |

## 🎯 FAZA 3 — Premium (Özet)

> **Süre:** 6-10 Hafta | FAZA 2 sonrası

| # | Özellik | Karmaşıklık | Süre |
|---|---------|-------------|------|
| 3.1 | 🌐 Custom Domain | 🔴 Yüksek (DNS + SSL) | 2-3 hafta |
| 3.2 | 🛒 Mini E-Ticaret | 🔴 Yüksek (Cart + Orders) | 2-3 hafta |
| 3.3 | 🎥 Video Desteği | 🟡 Orta | 5-7 gün |
| 3.4 | 📤 Gelişmiş Export | 🟡 Orta (PNG + HTML embed) | 5-7 gün |
| 3.5 | 🔌 Entegrasyonlar | 🔴 Yüksek (Google Sheets, Trendyol, WooCommerce) | 3-4 hafta |

## 🛠️ FAZA 4 — Teknik (Her Fazayla Paralel)

| # | Alan | Hedef |
|---|------|-------|
| 4.1 | 🧪 Test Coverage | Unit %80+ / Component %60+ / E2E: kritik akışlar |
| 4.2 | 📦 Bundle Size | `translations.ts` bölme, template lazy load → %30-40 küçülme |
| 4.3 | 🔐 Server Actions Auth | `withAuth()` middleware wrapper |
| 4.4 | ♿ Erişilebilirlik | WCAG 2.1 AA seviyesi |

## 🎨 FAZA 5 — UX/UI

| # | Özellik | Süre |
|---|---------|------|
| 5.1 | 🏪 Sektörel Şablonlar (Restoran, Gayrimenkul, Takı) | Her şablon 2-3 gün |
| 5.2 | 🔍 Gelişmiş Filtreleme (fiyat range, stok, sıralama) | 3-5 gün |
| 5.3 | 📱 PWA (offline, install prompt) | 2-3 gün |

---

## 📅 Zaman Çizelgesi

```
Mart 2026     Nisan 2026       Mayıs 2026        Haziran 2026
─────────────────────────────────────────────────────────────
█ FAZA 1 █████|                |                  |
  Ödeme       |█ FAZA 2 ████████|                  |
  WhatsApp    |  AI Açıklama   |█ FAZA 3 ██████████|
  Dark Mode   |  Şifre         |  Custom Domain   |
  Klonlama    |  Analitik v2   |  Mini E-Ticaret  |
  Paletler    |  Workspace     |  Entegrasyonlar  |
  Onboarding  |  E-posta       |  Video           |
              |                |                  |
██ FAZA 4 (Teknik — Sürekli) ████████████████████████
██ FAZA 5 (UX/UI — Sürekli)  ████████████████████████
```

---

## 🎯 Başarı Metrikleri

| Metrik | Şu An | 3 Ay Hedef | 6 Ay Hedef |
|--------|--------|-----------|-----------|
| **MRR** | ₺0 | ₺25,000 | ₺100,000 |
| **Kayıtlı Kullanıcı** | ? | 1,000 | 5,000 |
| **Aktif Katalog** | ? | 500 | 2,500 |
| **Ödeme Dönüşüm** | %0 | %5 | %8 |
| **DAU** | ? | 200 | 800 |
| **Churn Rate** | ? | <%10 | <%7 |
| **Test Coverage** | ~%5 | %50 | %75 |
| **Lighthouse Score** | ? | 90+ | 95+ |

---

> **Hazırlayan:** Antigravity (Senior Full-Stack Architect)  
> **Kaynak:** Mevcut kod tabanı analizi (30K+ satır), 32 migration, 18 şablon, 6 backend route, tüm TODO notları
