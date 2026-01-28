"use client"

import React, { useState } from "react"
import Link from "next/link"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import {
    Search,
    MessageCircle,
    Settings,
    ShieldCheck,
    Package,
    LifeBuoy,
    ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState("general")
    const [openQuestion, setOpenQuestion] = useState<string | null>(null)

    const categories = [
        { id: "general", label: "Genel Bakış", icon: ShieldCheck },
        { id: "products", label: "Ürünler & Katalog", icon: Package },
        { id: "sharing", label: "Paylaşım & Sipariş", icon: MessageCircle },
        { id: "account", label: "Üyelik & Teknik", icon: Settings },
    ]

    const faqData: Record<string, { q: string, a: string }[]> = {
        general: [
            {
                q: "FogCatalog tam olarak nedir ve işletmeme nasıl değer katar?",
                a: "FogCatalog, klasik PDF katalogların hantallığını ortadan kaldıran yeni nesil bir SaaS çözümüdür. Ürünlerinizi saniyeler içinde dijital, güncellenebilir ve etkileşimli bir mikrositeye dönüştürür. Müşterileriniz ürünleri incelerken tek tıkla WhatsApp üzerinden sipariş verebilir, bu da satış dönüşüm oranlarınızı (conversion rate) ciddi ölçüde artırır."
            },
            {
                q: "Ücretsiz planda herhangi bir süre sınırı var mı?",
                a: "Hayır, 'Starter' paketimiz tamamen ücretsizdir ve sonsuza kadar kullanabilirsiniz. Deneme süresi bitince otomatik ödeme alma gibi sürprizler yoktur. İşletmeniz büyüdüğünde dilediğiniz zaman üst paketlere geçiş yapabilirsiniz."
            },
            {
                q: "Mobil uygulama indirmem gerekiyor mu?",
                a: "Hayır. FogCatalog %100 bulut tabanlıdır (Web-based). Bilgisayarınızdan, tabletinizden veya telefonunuzun tarayıcısından panelinize erişip yönetim sağlayabilirsiniz. Müşterileriniz de herhangi bir uygulama indirmeden kataloğunuzu görüntüleyebilir."
            },
            {
                q: "Birden fazla dil desteği var mı?",
                a: "Şu an için arayüzümüz Türkçe ve İngilizce dillerini desteklemektedir. Ancak katalog içeriklerinizi (ürün isimleri ve açıklamaları) dilediğiniz dilde girebilirsiniz. Otomatik çeviri özelliği yol haritamızda (Roadmap) mevcuttur."
            },
            {
                q: "Ziyaretçi istatistiklerini görebilir miyim?",
                a: "Kesinlikle. 'Plus' ve üzeri paketlerimizde, kataloğunuzun kaç kez görüntülendiğini, en çok hangi ürünlerin tıklandığını ve ziyaretçilerin hangi şehirden/ülkeden geldiğini detaylı panelimizde görebilirsiniz."
            }
        ],
        products: [
            {
                q: "Toplu ürün yükleme yapabilir miyim?",
                a: "Evet! Yüzlerce ürün fotoğrafını sürükle-bırak yöntemiyle tek seferde yükleyebilirsiniz. Akıllı sistemimiz, görsel isimlerinden ürün adlarını otomatik olarak oluşturmaya çalışır, size sadece fiyatları ve detayları girmek kalır."
            },
            {
                q: "Ürün resim kalitesi düşer mi?",
                a: "Hayır. Sistemimiz yüklediğiniz yüksek çözünürlüklü görselleri akıllı sıkıştırma algoritmalarıyla optimize eder. Böylece hem sayfanız milisaniyeler içinde açılır hem de ürünleriniz cam gibi net görünür."
            },
            {
                q: "Fiyatı olmayan ürün ekleyebilir miyim?",
                a: "Tabii ki. Dilerseniz bazı ürünlerin fiyatını gizleyebilir veya 'Fiyat Sorunuz' şeklinde gösterebilirsiniz. Bu özellik özellikle B2B toptan satış yapan firmalar veya proje bazlı çalışanlar için idealdir."
            },
            {
                q: "Oluşturduğum kataloğun PDF çıktısını alabilir miyim?",
                a: "Evet. Dijital kataloğunuzu tek bir tıklamayla A4 formatında, baskıya hazır yüksek çözünürlüklü bir PDF dosyasına dönüştürebilirsiniz. Hem dijital hem fiziksel pazarlama ihtiyacınızı tek panelden çözersiniz."
            },
            {
                q: "Stok takibi veya varyasyon yönetimi var mı?",
                a: "FogCatalog bir ön muhasebe programı değildir ancak ürünleriniz için 'Stokta Var/Yok' veya 'Tükendi' etiketlerini kullanarak müşterilerinizi bilgilendirebilirsiniz. Renk ve Beden varyasyonlarını açıklama kısmında belirtebilirsiniz."
            },
            {
                q: "Ürünlerimi Excel'e aktarabilir miyim?",
                a: "Evet, tüm ürün listenizi, fiyatları ve açıklamalarıyla birlikte istediğiniz zaman Excel (CSV/XLS) formatında dışa aktarabilirsiniz. Bu sayede verilerinizi başka platformlara taşımanız kolaylaşır."
            }
        ],
        sharing: [
            {
                q: "WhatsApp sipariş butonu nasıl çalışır?",
                a: "Müşteriniz kataloğunuzda beğendiği ürünleri sepete ekler ve 'Siparişi Tamamla' butonuna bastığında, sistem otomatik olarak sipariş detaylarını içeren hazır bir WhatsApp mesajı oluşturur. Bu mesaj, tanımladığınız işletme WhatsApp hattına yönlendirilir."
            },
            {
                q: "QR kodum değişecek mi?",
                a: "Hayır. Size özel oluşturulan QR kod 'Statik' değil 'Dinamik' bir yapıdadır. Yani kataloğunuzun içeriğini, fiyatlarını veya resimlerini ne kadar değiştirirseniz değiştirin, QR kodunuz her zaman aynı kalır ve güncel kataloğunuza yönlendirir."
            },
            {
                q: "Kataloğumu Instagram veya Facebook'ta paylaşabilir miyim?",
                a: "Kesinlikle. Size verdiğimiz katalog linkini (fogcatalog.com/firma-adiniz) Instagram biyografinize, Facebook gönderilerinize veya LinkedIn profilinize ekleyebilirsiniz. Link önizlemeleri (meta tags) profesyonel görünecek şekilde optimize edilmiştir."
            },
            {
                q: "Kataloğumu kimler görebilir?",
                a: "Kataloğunuz internet üzerinde erişilebilir bir web sayfası olarak yayınlanır. Paylaştığınız linke sahip olan veya QR kodunuzu okutan herkes kataloğunuzu görüntüleyebilir. Erişim tamamen halka açıktır."
            },
            {
                q: "Mağazamda tablet üzerinden kullandırabilir miyim?",
                a: "Evet. FogCatalog dokunmatik ekranlar için özel olarak optimize edilmiştir. Mağazanızdaki bir tableti 'Kiosk Modu'nda çalıştırarak müşterilerinizin ürünlerinizi interaktif bir şekilde incelemesini sağlayabilirsiniz."
            }
        ],
        account: [
            {
                q: "Aboneliğimi nasıl iptal ederim?",
                a: "Kullanıcı panelinizdeki 'Ayarlar > Abonelik' sekmesinden tek tıkla iptal işlemini gerçekleştirebilirsiniz. Herhangi bir taahhüt, cayma bedeli veya gizli işlem ücreti yoktur."
            },
            {
                q: "Paket değişikliği (Upgrade/Downgrade) yapabilir miyim?",
                a: "Evet, dilediğiniz zaman paketinizi yükseltebilir veya düşürebilirsiniz. Yükseltme işlemlerinde, harcanmamış bakiyeniz yeni paket fiyatından düşülür (prorated), yani sadece aradaki farkı ödersiniz."
            },
            {
                q: "Fatura kesiyor musunuz? KDV dahil mi?",
                a: "Tüm fiyatlarımız KDV hariçtir. Ödemeniz başarıyla alındıktan sonra, şirket bilgilerinizle oluşturulan yasal e-faturanız (KDV dahil tutar üzerinden) sistemde kayıtlı e-posta adresinize otomatik olarak gönderilir."
            },
            {
                q: "Ekibim için ek kullanıcı açabilir miyim?",
                a: "Pro Visionary paketimizde, kataloğu yönetmesi için firmanızdaki diğer çalışanlara (satış temsilcisi, pazarlama uzmanı vb.) alt hesaplar açabilir ve yetkilendirme yapabilirsiniz."
            },
            {
                q: "Teknik destek veriyor musunuz?",
                a: "Tüm kullanıcılarımıza e-posta desteği sunuyoruz. Pro kullanıcılarımız ise WhatsApp üzerinden öncelikli canlı destek hattımıza erişebilirler."
            }
        ]
    }

    const trendingTopics = [
        { label: "Fiyatlandırma", action: () => setActiveCategory('account') },
        { label: "QR Kodlar", action: () => setActiveCategory('sharing') },
        { label: "Toplu Yükleme", action: () => setActiveCategory('products') },
        { label: "Güvenlik", action: () => setActiveCategory('general') },
    ]

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-violet-100">
            <PublicHeader />

            <main className="pt-24 pb-24">

                {/* HERO SECTION */}
                <section className="relative bg-white pt-20 pb-24 overflow-hidden">
                    {/* Blurred Purple Gradient Mesh */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-gradient-to-b from-violet-50/50 via-white to-white opacity-60 blur-3xl -z-10 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-violet-100/40 rounded-full blur-[100px] -z-10" />

                    <div className="max-w-4xl mx-auto px-6 text-center z-10 relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-wider mb-6 border border-violet-100">
                            <LifeBuoy className="w-3.5 h-3.5" />
                            Yardım Merkezi
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tiht">
                            Nasıl yardımcı olabiliriz?
                        </h1>

                        {/* Search Bar */}
                        <div className="relative max-w-2xl mx-auto mb-8 group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                                <Search className="h-6 w-6 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Ara: 'fatura', 'qr kod', 'sipariş'..."
                                className="pl-14 h-16 rounded-2xl border-slate-200 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 text-lg transition-all"
                            />
                        </div>

                        {/* Trending Pills */}
                        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                            <span className="text-slate-400 font-medium mr-1">Popüler Konular:</span>
                            {trendingTopics.map((topic, i) => (
                                <button
                                    key={i}
                                    onClick={topic.action}
                                    className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600 transition-colors text-xs font-bold"
                                >
                                    {topic.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* MAIN CONTENT */}
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">

                        {/* LEFT SIDEBAR (Sticky Navigation) */}
                        <div className="lg:w-1/4 lg:sticky lg:top-32 w-full">
                            {/* Mobile Horizontal Scroll */}
                            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setActiveCategory(cat.id)
                                            setOpenQuestion(null)
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-bold transition-all duration-200 outline-none focus:ring-2 focus:ring-violet-500/20 whitespace-nowrap",
                                            activeCategory === cat.id
                                                ? "bg-violet-50 text-violet-700 border-l-4 border-violet-600 shadow-sm"
                                                : "bg-transparent text-slate-500 border-l-4 border-transparent hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <cat.icon className={cn("w-5 h-5", activeCategory === cat.id ? "text-violet-600" : "text-slate-400")} />
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Desktop Support Card */}
                            <div className="mt-8 hidden lg:block">
                                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600 rounded-full blur-[60px] opacity-50 group-hover:opacity-70 transition-opacity" />

                                    <div className="relative z-10">
                                        <div className="flex -space-x-2 mb-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                                    Support
                                                </div>
                                            ))}
                                        </div>
                                        <h4 className="font-bold text-lg mb-2">Hala sorunuz mu var?</h4>
                                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                            Destek ekibimiz size yardımcı olmak için hazır.
                                        </p>
                                        <Button asChild className="w-full bg-white text-slate-900 hover:bg-violet-50 hover:text-violet-900 font-bold">
                                            <Link href="/contact">İletişime Geç</Link>
                                        </Button>
                                    </div>
                                </div>

                                {/* System Status Indicator */}
                                <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100 w-fit">
                                    <div className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </div>
                                    <span className="text-xs font-medium text-emerald-700">Tüm sistemler aktif</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT CONTENT (Accordion) */}
                        <div className="lg:w-3/4 w-full min-h-[600px]">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
                                        {categories.find(c => c.id === activeCategory)?.label}
                                    </h2>
                                    <p className="text-slate-500 mt-1">
                                        {activeCategory === 'general' && "Platform hakkında genel bilgiler."}
                                        {activeCategory === 'products' && "Katalog oluşturma ve ürün yönetimi."}
                                        {activeCategory === 'sharing' && "Siparişler, paylaşım ve QR kodlar."}
                                        {activeCategory === 'account' && "Faturalandırma ve üyelik işlemleri."}
                                    </p>
                                </div>
                                <span className="hidden md:inline-flex bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full">
                                    {faqData[activeCategory]?.length} Soru
                                </span>
                            </div>

                            <div className="space-y-4">
                                {faqData[activeCategory]?.map((item, index) => {
                                    const isOpen = openQuestion === `${activeCategory}-${index}`
                                    return (
                                        <div
                                            key={index}
                                            className={cn(
                                                "border rounded-2xl bg-white transition-all duration-300 overflow-hidden",
                                                isOpen
                                                    ? "border-violet-200 shadow-lg shadow-violet-100 ring-1 ring-violet-50"
                                                    : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                            )}
                                        >
                                            <button
                                                onClick={() => setOpenQuestion(isOpen ? null : `${activeCategory}-${index}`)}
                                                className={cn(
                                                    "w-full flex items-start text-left justify-between p-6 gap-6 transition-colors",
                                                    isOpen ? "bg-violet-50/30" : "bg-white"
                                                )}
                                            >
                                                <span className={cn(
                                                    "font-semibold text-lg leading-snug transition-colors",
                                                    isOpen ? "text-violet-900" : "text-slate-800"
                                                )}>
                                                    {item.q}
                                                </span>
                                                <span className={cn(
                                                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                                    isOpen
                                                        ? "bg-violet-100 text-violet-600 rotate-90"
                                                        : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                                                )}>
                                                    <ArrowRight className="w-4 h-4" />
                                                </span>
                                            </button>

                                            <div
                                                className={cn(
                                                    "transition-all duration-300 ease-out box-content",
                                                    isOpen ? "max-h-[500px] opacity-100 pb-6" : "max-h-0 opacity-0 pb-0"
                                                )}
                                            >
                                                <div className="px-6 pr-12 text-slate-600 leading-relaxed font-medium pt-2 border-t border-violet-100/50">
                                                    {item.a}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Mobile Support CTA (Visible only on mobile) */}
                            <div className="mt-12 lg:hidden">
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                                    <h4 className="font-bold text-slate-900 mb-2">Yardıma mı ihtiyacınız var?</h4>
                                    <p className="text-slate-500 text-sm mb-4">Destek ekibimiz sizinle.</p>
                                    <Button asChild className="w-full bg-slate-900 text-white">
                                        <Link href="/contact">İletişime Geçin</Link>
                                    </Button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
