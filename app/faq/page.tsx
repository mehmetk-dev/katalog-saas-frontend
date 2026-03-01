"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import {
    Search,
    MessageCircle,
    Settings,
    ShieldCheck,
    Package,
    ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const categories = [
    { id: "general", label: "Genel Bakış", icon: ShieldCheck },
    { id: "products", label: "Ürünler & Katalog", icon: Package },
    { id: "sharing", label: "Paylaşım & Erişim", icon: MessageCircle },
    { id: "account", label: "Üyelik & Fatura", icon: Settings },
]

const faqData: Record<string, { q: string, a: string }[]> = {
    general: [
        {
            q: "FogCatalog tam olarak nedir ve işletmeme nasıl değer katar?",
            a: "FogCatalog, klasik PDF katalogların hantallığını ortadan kaldıran yeni nesil bir SaaS çözümüdür. Ürünlerinizi saniyeler içinde dijital, güncellenebilir ve etkileşimli bir mikrositeye dönüştürür. Müşterileriniz ürünleri incelerken sizinle kolayca iletişime geçebilir, bu da etkileşimi artırır."
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
            a: "Şu an için arayüzümüz Türkçe ve İngilizce dillerini desteklemektedir. Ancak katalog içeriklerinizi (ürün isimleri ve açıklamaları) dilediğiniz dilde girebilirsiniz."
        },
        {
            q: "Ziyaretçi istatistiklerini görebilir miyim?",
            a: "Kesinlikle. 'Plus' ve üzeri paketlerimizde, kataloğunuzun kaç kez görüntülendiğini, en çok hangi ürünlerin tıklandığını detaylı panelimizde görebilirsiniz."
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
        // "Stok takibi" removed/simplified if not needed, but general "stokta var/yok" is usually fine. User didn't ask to remove it specifically aside from "WP sipariş" and "ek kullanıcı". I'll keep it unless it implies complex inventory.
        {
            q: "Stok durumu belirtebilir miyim?",
            a: "Evet, ürünleriniz için 'Stokta Var/Yok' veya 'Tükendi' etiketlerini kullanarak müşterilerinizi bilgilendirebilirsiniz."
        },
        {
            q: "Ürünlerimi Excel'e aktarabilir miyim?",
            a: "Evet, tüm ürün listenizi, fiyatları ve açıklamalarıyla birlikte istediğiniz zaman Excel (CSV/XLS) formatında dışa aktarabilirsiniz."
        }
    ],
    sharing: [
        // Removed WhatsApp Order Question
        {
            q: "QR kodum değişecek mi?",
            a: "Hayır. Size özel oluşturulan QR kod 'Statik' değil 'Dinamik' bir yapıdadır. Yani kataloğunuzun içeriğini, fiyatlarını veya resimlerini ne kadar değiştirirseniz değiştirin, QR kodunuz her zaman aynı kalır ve güncel kataloğunuza yönlendirir."
        },
        {
            q: "Kataloğumu sosyal medyada paylaşabilir miyim?",
            a: "Kesinlikle. Size verdiğimiz katalog linkini (fogcatalog.com/firma-adiniz) Instagram biyografinize, Facebook gönderilerinize veya LinkedIn profilinize ekleyebilirsiniz. Link önizlemeleri profesyonel görünecek şekilde optimize edilmiştir."
        },
        {
            q: "Kataloğumu kimler görebilir?",
            a: "Kataloğunuz internet üzerinde erişilebilir bir web sayfası olarak yayınlanır. Paylaştığınız linke sahip olan veya QR kodunuzu okutan herkes kataloğunuzu görüntüleyebilir."
        },
        {
            q: "Tablet ve mobilde düzgün görünür mü?",
            a: "Evet. FogCatalog tüm cihazlar ve ekran boyutları için (responsive) özel olarak optimize edilmiştir. Müşterileriniz telefon, tablet veya bilgisayardan sorunsuz bir deneyim yaşar."
        }
    ],
    account: [
        {
            q: "Aboneliğimi nasıl iptal ederim?",
            a: "Kullanıcı panelinizdeki 'Ayarlar > Abonelik' sekmesinden tek tıkla iptal işlemini gerçekleştirebilirsiniz. Herhangi bir taahhüt veya cayma bedeli yoktur."
        },
        {
            q: "Paket değişikliği yapabilir miyim?",
            a: "Evet, dilediğiniz zaman paketinizi yükseltebilir veya düşürebilirsiniz."
        },
        {
            q: "Fatura kesiyor musunuz?",
            a: "Evet. Ödemeniz başarıyla alındıktan sonra, şirket bilgilerinizle oluşturulan yasal e-faturanız sistemde kayıtlı e-posta adresinize otomatik olarak gönderilir."
        },
        // Removed Extra User Question
        {
            q: "Teknik destek veriyor musunuz?",
            a: "Tüm kullanıcılarımıza e-posta desteği sunuyoruz. Pro kullanıcılarımız ise öncelikli destek hattımıza erişebilirler."
        }
    ]
}

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState("general")
    const [openQuestion, setOpenQuestion] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    const toggleQuestion = (id: string) => {
        setOpenQuestion(openQuestion === id ? null : id)
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-violet-100">
            <PublicHeader />

            <main className="pt-24 pb-24">
                {/* HERO SECTION */}
                <section className="relative pt-16 pb-20 px-6 text-center overflow-hidden">
                    {/* Background decoration */}
                    <div className={cn(
                        "absolute top-0 left-1/2 -translate-x-1/2 w-full",
                        "max-w-7xl h-[600px] bg-gradient-to-b",
                        "from-indigo-50 via-white to-transparent",
                        "-z-10 rounded-full blur-3xl opacity-70"
                    )} />

                    <div className="max-w-3xl mx-auto relative z-10">
                        <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full",
                            "bg-white shadow-sm border border-slate-200",
                            "text-slate-600 text-sm font-medium mb-8"
                        )}>
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
                            Yardım Merkezi & Destek
                        </div>

                        <h1 className={cn(
                            "text-4xl md:text-5xl lg:text-6xl font-black",
                            "text-slate-900 mb-6 tracking-tight"
                        )}>
                            Nasıl yardımcı olabiliriz?
                        </h1>

                        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Aklınıza takılan soruların cevaplarını burada bulabilirsiniz.
                            Hala yardıma ihtiyacınız varsa bizimle iletişime geçin.
                        </p>

                        <div className="relative max-w-xl mx-auto group">
                            <div className={cn(
                                "absolute inset-y-0 left-0 pl-4",
                                "flex items-center pointer-events-none",
                                "text-slate-400 group-focus-within:text-indigo-500",
                                "transition-colors"
                            )}>
                                <Search className="h-5 w-5" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Bir soru arayın..."
                                className={cn(
                                    "pl-12 h-14 rounded-2xl border-slate-200",
                                    "shadow-lg shadow-slate-200/50",
                                    "focus:ring-4 focus:ring-indigo-100",
                                    "focus:border-indigo-500 text-lg",
                                    "transition-all bg-white"
                                )}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* CONTENT SECTION */}
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">

                        {/* SIDEBAR NAVIGATION */}
                        <div className="lg:col-span-4 lg:sticky lg:top-32 self-start space-y-8">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
                                <nav className="space-y-1">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setActiveCategory(cat.id)
                                                setOpenQuestion(null)
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3.5",
                                                "rounded-xl text-sm font-semibold",
                                                "transition-all duration-200",
                                                activeCategory === cat.id
                                                    ? cn(
                                                        "bg-indigo-50 text-indigo-700",
                                                        "shadow-sm ring-1 ring-indigo-100"
                                                    )
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            <cat.icon className={cn(
                                                "w-5 h-5",
                                                activeCategory === cat.id
                                                    ? "text-indigo-600"
                                                    : "text-slate-400"
                                            )} />
                                            {cat.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* SUPPORT CARD - IMPROVED */}
                            <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden text-white">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600 rounded-full blur-[80px] opacity-40" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-600 rounded-full blur-[60px] opacity-30" />

                                <div className="relative z-10 flex flex-col items-start">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md",
                                        "flex items-center justify-center mb-6",
                                        "border border-white/10"
                                    )}>
                                        <MessageCircle className="w-6 h-6 text-white" />
                                    </div>

                                    <h3 className="text-xl font-bold mb-2">Hala sorunuz mu var?</h3>
                                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                        Aradığınız cevabı bulamadıysanız destek ekibimizle iletişime geçebilirsiniz.
                                    </p>

                                    <Button asChild className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold h-11 rounded-xl">
                                        <Link href="/contact">Bize Ulaşın</Link>
                                    </Button>

                                    <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-500">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Ortalama yanıt süresi: &lt; 2 saat</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MAIN ACCORDION */}
                        <div className="lg:col-span-8 min-h-[500px]">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    {categories.find(c => c.id === activeCategory)?.label}
                                    <span className="text-base font-normal text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                        {faqData[activeCategory]?.length} Soru
                                    </span>
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {faqData[activeCategory]?.map((item, index) => {
                                    const id = `${activeCategory}-${index}`
                                    const isOpen = openQuestion === id

                                    // Search filter
                                    if (searchTerm && !item.q.toLowerCase().includes(searchTerm.toLowerCase()) && !item.a.toLowerCase().includes(searchTerm.toLowerCase())) {
                                        return null
                                    }

                                    return (
                                        <div
                                            key={id}
                                            className={cn(
                                                "group rounded-2xl bg-white transition-all duration-300 border",
                                                isOpen
                                                    ? cn(
                                                        "border-indigo-200 shadow-xl",
                                                        "shadow-indigo-100/50 ring-1 ring-indigo-50"
                                                    )
                                                    : cn(
                                                        "border-slate-100 hover:border-indigo-100",
                                                        "hover:shadow-md hover:shadow-slate-200/50"
                                                    )
                                            )}
                                        >
                                            <button
                                                onClick={() => toggleQuestion(id)}
                                                className="w-full flex items-start justify-between p-6 text-left gap-4"
                                            >
                                                <span className={cn(
                                                    "font-semibold text-lg transition-colors leading-relaxed",
                                                    isOpen ? "text-indigo-900" : "text-slate-700 group-hover:text-slate-900"
                                                )}>
                                                    {item.q}
                                                </span>
                                                <span className={cn(
                                                    "flex-shrink-0 w-8 h-8 rounded-full",
                                                    "flex items-center justify-center",
                                                    "transition-all duration-300 bg-slate-50",
                                                    isOpen
                                                        ? "bg-indigo-100 text-indigo-600 rotate-180"
                                                        : cn(
                                                            "text-slate-400 group-hover:bg-indigo-50",
                                                            "group-hover:text-indigo-500"
                                                        )
                                                )}>
                                                    <ChevronDown className="w-5 h-5" />
                                                </span>
                                            </button>

                                            <div
                                                className={cn(
                                                    "grid transition-all duration-300 ease-in-out",
                                                    isOpen ? "grid-rows-[1fr] opacity-100 pb-6" : "grid-rows-[0fr] opacity-0"
                                                )}
                                            >
                                                <div className="overflow-hidden px-6">
                                                    <div className={cn(
                                                        "pt-2 border-t border-indigo-50/50",
                                                        "text-slate-600 leading-relaxed font-medium"
                                                    )}>
                                                        {item.a}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
