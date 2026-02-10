# Builder UX Redesign Plan

## Amaç
Catalog Builder'ın "Tasarım Ayarları" sekmesindeki kalabalığı azaltmak, bilgi hiyerarşisini güçlendirmek, responsive deneyimi iyileştirmek ve genel tasarım kalitesini artırmak.

## Hedef Dosya
`components/builder/catalog-editor.tsx` (1491 satır)

---

## ADIM 1: Tasarım Sekmesini Accordion Yapısına Çevir ✅ KRİTİK
**Satırlar:** ~892-1457 (design tab content)  
**Sorun:** 5 bölüm (Tasarım Ayarları, Logo & Markalama, Arka Plan, Hikaye Kataloğu, Sayfa Yapısı) alt alta dizilmiş. Scroll derinliği çok fazla.  
**Çözüm:**
- Collapsible/Accordion state'i ekle: `openSections` state (Set veya object) ile hangi bölümün açık olduğunu tut
- Her bölüm başlığını tıklanabilir yapıp, gövdesini toggle et
- Varsayılanda sadece ilk bölüm açık olsun
- Geçiş animasyonu: `animate-in fade-in slide-in-from-top` + `max-height` transition
- İkon rotasyonu ile açık/kapalı durumu göster (ChevronDown → rotate)

**Bölümler:**
1. Tasarım Ayarları (toggles + image fit + column count)
2. Logo & Markalama (logo upload + position + colors)  
3. Arka Plan Ayarları (color + gradient + image)
4. Hikaye Kataloğu (cover page + category dividers)
5. Sayfa Yapısı (visual flow diagram) — bu bölüm her zaman göster, accordion dışında bırak

**Dikkat:**
- `xl:grid-cols-2` layout'u kaldır. Accordion yapısında her bölüm tek sütun full-width olacak
- "Sayfa Yapısı" ve "Şablon Stili" accordion dışında bırakılacak çünkü bunlar zaten sayfa alt kısmında ve görsel öğe

---

## ADIM 2: Toggle'ları Kompakt 2-Sütun Grid'e Al
**Satırlar:** ~908-942  
**Sorun:** 5 toggle dikey listeleniyor, çok yer kaplıyor  
**Çözüm:**
- `space-y-4` → `grid grid-cols-2 gap-2` yap
- Her toggle'ın padding'ini küçült: `p-3` → `p-2`
- Son tek kalan toggle (showUrls) `col-span-2` olarak ortalansın veya son satırda tam genişlik
- Toggle label font boyutunu koruyarak toggle boyutunu küçült: `w-10 h-5` → `w-9 h-[18px]`

---

## ADIM 3: Şablon Seçimini Horizontal Carousel Yap
**Satırlar:** ~1459-1484  
**Sorun:** 10+ şablon 4 sütunluk grid'de 3 satır kaplıyor, scroll derinliğini çok artırıyor  
**Çözüm:**
- Grid layoutu kaldır → `flex overflow-x-auto snap-x` horizontal scroll yap
- Her kart `flex-shrink-0 w-44 snap-center` olacak
- Sol/sağ scroll ok butonları ekle (opsiyonel)
- Scroll indicator (gradient fade) kenar efektleri
- Bu sayede dikey alan ~400px'den ~220px'e düşer

---

## ADIM 4: "Sayfa Yapısı" Bölümünü Sadeleştir
**Satırlar:** ~1398-1457  
**Sorun:** 3 kart + ok simgeleri çok fazla alan kaplıyor, kartlar küçük ama yükseklik yüksek  
**Çözüm:**
- Card boyutlarını küçült: `w-28 h-40` → `w-24 h-28` 
- Horizontal bar formatına dönüştür — kartlar daha yatay olabilir
- "AKTİF" badge'i kaldırıp, sadece border+bg rengi ile aktif olduğunu göster
- min-height kısıtlamasını kaldır

---

## ADIM 5: Responsive İyileştirmeler
**Sorunlar:**
- Mobilde ürün kartları çok küçük (5 sütun grid çok)
- Tasarım sekmesindeki 2 sütunluk grid (xl:grid-cols-2) tablet'te kötü görünüyor
- Pagination bilgi metni mobilde kesilebilir

**Çözümler:**
- Ürün grid: `grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5` → `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` (daha az sütun, daha büyük kartlar)
- Accordion yapısıyla tablet layout sorunu zaten çözülecek (tek sütun)
- Pagination'da mobilde sadece sayfa numaraları göster, "üründen X-Y" bilgisini gizle
- "Seçili Ürünler" bölümündeki grid: `sm:grid-cols-2` → Mobilde tek sütun kalacak şekilde tutalım

---

## ADIM 6: Spacing & Border-Radius Tutarlılığı
**Sorun:** rounded-xl, rounded-2xl, rounded-[1.5rem], rounded-[2rem], rounded-3xl karışık kullanım  
**Çözüm:**
- Card container: `rounded-2xl` (standart)
- Inner elements (buttons, inputs): `rounded-xl`
- Small elements (badges, dots): `rounded-lg` veya `rounded-full`
- Upload alanları: `rounded-2xl`
- Color picker popup: `rounded-2xl`

**Padding tutarlılığı:**
- Card padding: `p-5` (standart)  
- Section gap: `space-y-5` (standart)

---

## Uygulama Sırası

| Sıra | Adım | Öncelik | Etki |
|------|------|---------|------|
| 1 | Accordion yapısı | 🔴 Kritik | Scroll derinliğini %60 azaltır |
| 2 | Toggle kompakt grid | 🟡 Önemli | Alan tasarrufu |
| 3 | Şablon carousel | 🟡 Önemli | Dikey alan tasarrufu |  
| 4 | Sayfa yapısı sadeleştir | 🟢 İyileştirme | Görsel temizlik |
| 5 | Responsive iyileştirmeler | 🔴 Kritik | Mobil deneyim |
| 6 | Spacing tutarlılığı | 🟢 İyileştirme | Profesyonel görünüm |

---

## Notlar
- Adım 1 en büyük ve en etkili değişiklik. 2-sütun grid'den accordion'a geçiş büyük refactoring.
- Adım 5 responsive kısmı diğer adımlarla birlikte yapılabilir.
- Her adımdan sonra `npm run dev` ile görsel kontrol yapılacak.
